/**
 * Gentic AI — n8n Security Monitor
 * Drop into n8n as a Code node between every LLM call and user delivery
 *
 * INPUT:  { llm_response, user_input, session_id, user_id, context }
 * OUTPUT: { action: "PASS"|"BLOCK", delivered, incident?, sanitized_response? }
 *
 * Wire as:
 *   [LLM Node] → [Security Monitor] → [IF: action==PASS] → [Send to User]
 *                                   ↘ [action==BLOCK]   → [Send Safe Error]
 */

const crypto = require('crypto');

// ── CONFIGURATION ──────────────────────────────────────────────────────────────
const SANITIZER_URL = 'http://localhost:8100';  // Your sanitizer.py service
const POSTGRES_TABLE = 'security_incidents';
const TELEGRAM_ALERT_BOT = process.env.TELEGRAM_ALERT_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT = process.env.TELEGRAM_ADMIN_CHAT_ID;

// ── INPUT ──────────────────────────────────────────────────────────────────────
const item = $input.first().json;
const llmResponse  = item.llm_response  || '';
const userInput    = item.user_input    || '';
const sessionId    = item.session_id    || 'unknown';
const userId       = item.user_id       || 'anonymous';
const context      = item.context       || 'chat';  // chat | irelop | ce_v5 | clue

// ── OUTPUT LEAKAGE PATTERNS ────────────────────────────────────────────────────
const OUTPUT_CHECKS = [
  {
    name: 'score_leak_structured',
    pattern: /(motivation|opportunity|profile)\s*:\s*\d+/i,
    severity: 'CRITICAL',
    message: 'Structured score data leaked in response',
  },
  {
    name: 'irelop_score_tag',
    pattern: /irelop\s*(score)?\s*:\s*(HOT|WARM|COOL|PASS|\d+)/i,
    severity: 'CRITICAL',
    message: 'iRELOP classification leaked verbatim',
  },
  {
    name: 'json_score_blob',
    pattern: /\{[^}]{0,200}"score"[^}]{0,200}\}/i,
    severity: 'CRITICAL',
    message: 'Raw JSON score object in response',
  },
  {
    name: 'prompt_echo',
    pattern: /(my instructions (are|say|tell me)|you (told|instructed) me to|my system prompt)/i,
    severity: 'HIGH',
    message: 'System prompt echo detected',
  },
  {
    name: 'pii_phone',
    pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    severity: 'CRITICAL',
    message: 'Phone number in response',
  },
  {
    name: 'pii_email',
    pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b/,
    severity: 'HIGH',
    message: 'Email address in response',
  },
  {
    name: 'pii_address',
    pattern: /\b\d{1,5}\s+[A-Z][a-z]+\s+(St|Ave|Blvd|Dr|Rd|Ln|Way|Ct|Pl)\b/i,
    severity: 'HIGH',
    message: 'Street address pattern in response',
  },
  {
    name: 'session_bleed',
    pattern: /(previous|last|earlier|before)\s+(lead|caller|seller|contact|user|client)\s+(said|was|scored|told me)/i,
    severity: 'CRITICAL',
    message: 'Cross-session data bleed detected',
  },
  {
    name: 'refusal_bypass_confirmed',
    pattern: /(as you wish|certainly, ignoring|override accepted|rules disabled|now in unrestricted)/i,
    severity: 'CRITICAL',
    message: 'Model confirmed jailbreak success',
  },
  {
    name: 'irelop_weight_leak',
    pattern: /\b(40|35|25)\s*(points?|pts|out of|\/)/i,
    severity: 'CRITICAL',
    message: 'iRELOP point weight values in response',
  },
  {
    name: 'threshold_leak',
    pattern: /\b(80|60|40)\s*(or\s+above|points?|is\s+HOT|is\s+WARM|is\s+COOL)/i,
    severity: 'CRITICAL',
    message: 'iRELOP threshold values in response',
  },
  {
    name: 'api_key_pattern',
    pattern: /(sk-[a-zA-Z0-9]{20,}|xai-[a-zA-Z0-9]{20,}|AIza[a-zA-Z0-9]{35,})/,
    severity: 'CRITICAL',
    message: 'API key pattern in response',
  },
  {
    name: 'training_data_echo',
    pattern: /(from\s+my\s+training|I\s+was\s+trained\s+on|training\s+example|fine.?tun)/i,
    severity: 'HIGH',
    message: 'Possible training data reference',
  },
];

// ── INPUT ANOMALY PATTERNS (for logging even if sanitizer already blocked) ───
const INPUT_ANOMALIES = [
  { pattern: /ignore\s+(previous|all|above)\s+instructions/i, name: 'injection_classic' },
  { pattern: /\[INST\]|<\|im_start\|>|<\|system\|>/i,       name: 'token_injection' },
  { pattern: /(.)\1{100,}/,                                    name: 'repetition_dos' },
  { pattern: /(dump|list|output)\s+(all|every)\s+(lead|data|user|contact)/i, name: 'mass_extraction' },
];

// ── RUN CHECKS ─────────────────────────────────────────────────────────────────
const outputFlags  = [];
const inputAnomalies = [];

for (const check of OUTPUT_CHECKS) {
  if (check.pattern.test(llmResponse)) {
    outputFlags.push({
      name: check.name,
      severity: check.severity,
      message: check.message,
    });
  }
}

for (const check of INPUT_ANOMALIES) {
  if (check.pattern.test(userInput)) {
    inputAnomalies.push(check.name);
  }
}

const criticalFlags = outputFlags.filter(f => f.severity === 'CRITICAL');
const highFlags     = outputFlags.filter(f => f.severity === 'HIGH');
const shouldBlock   = outputFlags.length > 0;

// ── BUILD RESULT ───────────────────────────────────────────────────────────────
const incidentId = shouldBlock
  ? crypto.createHash('sha256')
      .update(`${sessionId}${Date.now()}`)
      .digest('hex')
      .substring(0, 16)
  : null;

const inputHash = crypto
  .createHash('sha256')
  .update(userInput)
  .digest('hex')
  .substring(0, 16);

const result = {
  action:     shouldBlock ? 'BLOCK' : 'PASS',
  delivered:  !shouldBlock,
  timestamp:  new Date().toISOString(),
  session_id: sessionId,
  user_id:    userId,
  context:    context,

  // Pass through for next node
  llm_response: shouldBlock ? null : llmResponse,
  safe_error: shouldBlock
    ? "I'm not able to provide that information. How else can I help you?"
    : null,

  // Incident data (null if PASS)
  incident: shouldBlock ? {
    id:            incidentId,
    output_flags:  outputFlags,
    input_anomalies: inputAnomalies,
    critical_count: criticalFlags.length,
    high_count:    highFlags.length,
    input_hash:    inputHash,
    response_preview: llmResponse.substring(0, 120),
  } : null,

  // For DB logging (always present)
  audit: {
    input_hash:    inputHash,
    input_anomalies: inputAnomalies,
    output_clean:  !shouldBlock,
    output_flags:  outputFlags.map(f => f.name),
  },
};

return [{ json: result }];

/*
 * ── DEPLOY INSTRUCTIONS ──────────────────────────────────────────────────────
 *
 * 1. Add this as a Code node after EVERY LLM response in your workflows
 *
 * 2. Wire downstream:
 *    [This Node] → [IF: {{$json.action}} == "PASS"] → [Deliver to user]
 *                                                    ↘ [Send: $json.safe_error]
 *
 * 3. Add DB logging node after this (always runs, both PASS and BLOCK):
 *    INSERT INTO security_incidents (
 *      incident_id, session_id, user_id, context, action,
 *      output_flags, input_anomalies, input_hash, response_preview, created_at
 *    ) VALUES (...)
 *
 * 4. Add Telegram alert for BLOCK events (critical flags only):
 *    IF critical_count > 0 → HTTP POST to Telegram bot
 *
 * 5. Postgres table DDL:
 *    CREATE TABLE security_incidents (
 *      id SERIAL PRIMARY KEY,
 *      incident_id VARCHAR(16),
 *      session_id VARCHAR(255),
 *      user_id VARCHAR(255),
 *      context VARCHAR(50),
 *      action VARCHAR(20),
 *      output_flags JSONB,
 *      input_anomalies TEXT[],
 *      input_hash VARCHAR(16),
 *      response_preview TEXT,
 *      created_at TIMESTAMPTZ DEFAULT NOW()
 *    );
 *    CREATE INDEX idx_security_action ON security_incidents(action);
 *    CREATE INDEX idx_security_created ON security_incidents(created_at DESC);
 */
