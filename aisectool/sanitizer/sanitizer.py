"""
Gentic AI — Input Sanitizer Middleware
Deploy: Mac Mini M4 as FastAPI service on :8100
All LLM inputs pass through this before touching any model
"""

import re
import hashlib
import json
import logging
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

logging.basicConfig(
    format="%(asctime)s | SANITIZER | %(levelname)s | %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Gentic Security Sanitizer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5678", "http://localhost:11434", "http://localhost:11435"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ── THREAT SIGNATURES ──────────────────────────────────────────────────────────

INJECTION_PATTERNS = [
    (r"ignore\s+(previous|all|above|prior)\s+instructions", "system_override", 40),
    (r"you\s+are\s+now\s+[A-Z]", "persona_hijack", 35),
    (r"pretend\s+(you\s+are|to\s+be|you're)", "persona_hijack", 35),
    (r"\b(DAN|STAN|DUDE|AIM|jailbreak|jail\s*break)\b", "jailbreak_keyword", 50),
    (r"(system\s+prompt|system\s+message|your\s+instructions)", "prompt_extraction", 40),
    (r"repeat\s+(after\s+me|everything\s+I\s+say|your\s+instructions)", "prompt_extraction", 40),
    (r"output\s+(your|the)\s+(instructions|prompt|system|rules|context)", "prompt_extraction", 45),
    (r"\[INST\]|\[SYS\]|<\|im_start\|>|<\|system\|>|###\s*System", "token_injection", 60),
    (r"do\s+anything\s+now", "jailbreak_keyword", 50),
    (r"forget\s+(your|all)\s+(rules|instructions|training|guidelines)", "system_override", 45),
    (r"(act|behave)\s+as\s+if\s+you\s+(have\s+no|don't\s+have)\s+(restrictions|rules|limits)", "system_override", 50),
    (r"hypothetically\s+speaking.*?(what\s+would\s+you|how\s+would\s+you)", "hypothetical_bypass", 25),
    (r"for\s+(educational|research|fictional|creative)\s+purposes.*?(how\s+to|provide|tell)", "framing_bypass", 20),
    (r"base64|rot13|hex\s+encode|cipher", "encoding_bypass", 30),
    (r"translate\s+.*?(ignore|override|bypass)", "translation_bypass", 35),
]

EXTRACTION_PATTERNS = [
    (r"what\s+(are|were)\s+your\s+(instructions|rules|system\s+prompt|training)", "data_extraction", 45),
    (r"show\s+(me\s+)?(your\s+)?(prompt|context|memory|system|instructions)", "data_extraction", 45),
    (r"what\s+(did|do)\s+you\s+(know|remember|have)\s+about\s+(me|this\s+lead|the\s+user|previous)", "pii_extraction", 50),
    (r"list\s+(all\s+)?(leads|contacts|scores|data|users|clients)", "data_extraction", 55),
    (r"(give|show|tell)\s+me\s+(all|the)\s+(lead|user|client|contact)\s+(data|info|information|scores)", "data_extraction", 55),
    (r"irelop\s+(score|scoring|rubric|formula)", "ip_extraction", 60),
    (r"(motivation|opportunity|profile)\s+(score|weight|points|breakdown)", "ip_extraction", 50),
    (r"how\s+do\s+you\s+(score|rate|evaluate|assess)\s+(leads|sellers|prospects)", "ip_extraction", 45),
    (r"what\s+makes\s+a\s+(HOT|WARM|COOL|PASS)\s+lead", "ip_extraction", 40),
    (r"dump\s+(all|the)\s+(data|context|memory|history)", "data_extraction", 60),
]

SCORE_MANIPULATION_PATTERNS = [
    (r"I\s+(am\s+)?(definitely|absolutely|100%|extremely)\s+(motivated|desperate|urgent|must\s+sell)", "score_inflation", 30),
    (r"rate\s+me\s+(as|a|HOT|WARM|\d+)", "direct_score_request", 45),
    (r"I\s+already\s+(qualify|qualified|pre-qualified|scored)", "prequalification_claim", 40),
    (r"skip\s+(the\s+)?(questions|qualification|process|screening)", "bypass_attempt", 50),
    (r"just\s+(give|make|mark)\s+me\s+(the|a)\s+(deal|offer|HOT|appointment)", "bypass_attempt", 45),
    (r"I\s+know\s+you\s+have\s+to\s+(help|assist|score|qualify)\s+me", "social_engineering", 35),
]

DOS_INDICATORS = [
    (r"(.)\1{200,}", "repetition_flood", 40),  # repeated characters
]

# ── REQUEST/RESPONSE MODELS ───────────────────────────────────────────────────

class SanitizeRequest(BaseModel):
    text: str
    context: str = "chat"          # chat | irelop | ce_v5 | clue
    session_id: Optional[str] = None
    user_id: Optional[str] = None

class SanitizeResponse(BaseModel):
    safe: bool
    action: str                    # pass | warn | block | hard_block
    risk_score: int
    flags: list
    categories: list
    sanitized_text: Optional[str]  # scrubbed version if warn-level
    incident_id: Optional[str]
    timestamp: str

# ── CORE LOGIC ────────────────────────────────────────────────────────────────

def run_patterns(text: str, patterns: list) -> tuple[list, int]:
    flags = []
    total_score = 0
    for pattern, category, score in patterns:
        if re.search(pattern, text, re.IGNORECASE | re.DOTALL):
            flags.append({"pattern": category, "score": score})
            total_score += score
    return flags, total_score

def check_token_flood(text: str) -> tuple[list, int]:
    token_estimate = len(text.split()) * 1.3
    if token_estimate > 3000:
        return [{"pattern": "token_flood", "score": 50}], 50
    if token_estimate > 1500:
        return [{"pattern": "token_flood_warn", "score": 20}], 20
    return [], 0

def sanitize_warn_level(text: str) -> str:
    """For warn-level inputs, scrub the suspicious phrases and pass through"""
    scrubbed = text
    for pattern, _, _ in INJECTION_PATTERNS[:6]:  # only scrub clear injections
        scrubbed = re.sub(pattern, "[FILTERED]", scrubbed, flags=re.IGNORECASE)
    return scrubbed

def log_incident(request: SanitizeRequest, result: dict) -> str:
    incident_id = hashlib.sha256(
        f"{request.session_id}{request.text[:50]}{datetime.utcnow().isoformat()}".encode()
    ).hexdigest()[:16]
    
    logger.warning(
        f"INCIDENT {incident_id} | action={result['action']} | "
        f"risk={result['risk_score']} | context={request.context} | "
        f"flags={[f['pattern'] for f in result['flags']]} | "
        f"user={request.user_id or 'anonymous'} | "
        f"input_hash={hashlib.sha256(request.text.encode()).hexdigest()[:16]}"
    )
    return incident_id

# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@app.post("/sanitize", response_model=SanitizeResponse)
async def sanitize(req: SanitizeRequest):
    text = req.text.strip()
    all_flags = []
    total_score = 0

    # Run all pattern sets
    for pattern_set in [INJECTION_PATTERNS, EXTRACTION_PATTERNS, SCORE_MANIPULATION_PATTERNS, DOS_INDICATORS]:
        flags, score = run_patterns(text, pattern_set)
        all_flags.extend(flags)
        total_score += score

    # Token flood check
    flood_flags, flood_score = check_token_flood(text)
    all_flags.extend(flood_flags)
    total_score += flood_score

    # Context-specific amplification
    if req.context == "irelop" and total_score > 0:
        total_score = int(total_score * 1.3)  # iRELOP is higher stakes

    total_score = min(total_score, 100)
    categories = list(set(f["pattern"] for f in all_flags))

    # Determine action
    if total_score >= 70:
        action = "hard_block"
    elif total_score >= 45:
        action = "block"
    elif total_score >= 20:
        action = "warn"
    else:
        action = "pass"

    safe = action == "pass"
    incident_id = None
    sanitized_text = None

    if action == "warn":
        sanitized_text = sanitize_warn_level(text)
        incident_id = log_incident(req, {"action": action, "risk_score": total_score, "flags": all_flags})
    elif action in ("block", "hard_block"):
        incident_id = log_incident(req, {"action": action, "risk_score": total_score, "flags": all_flags})

    return SanitizeResponse(
        safe=safe,
        action=action,
        risk_score=total_score,
        flags=all_flags,
        categories=categories,
        sanitized_text=sanitized_text,
        incident_id=incident_id,
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/sanitize/output")
async def sanitize_output(req: SanitizeRequest):
    """Post-LLM output scanning — catches leakage before delivery"""
    text = req.text

    output_leakage_patterns = [
        (r"(motivation|opportunity|profile)\s*:\s*\d+", "score_leak"),
        (r"irelop\s*score\s*:\s*(HOT|WARM|COOL|PASS|\d+)", "score_leak"),
        (r"\{[^}]*\"score\"[^}]*\}", "json_score_leak"),
        (r"(my|the)\s+(system\s+prompt|instructions)\s+(say|are|tell me)", "prompt_echo"),
        (r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b", "pii_phone"),
        (r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b", "pii_email"),
        (r"(previous|last|earlier)\s+(lead|caller|seller|contact)\s+(said|was|scored)", "session_bleed"),
    ]

    flags = []
    for pattern, category in output_leakage_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            flags.append(category)

    blocked = len(flags) > 0
    if blocked:
        logger.error(f"OUTPUT BLOCKED | categories={flags} | preview={text[:80]}")

    return {
        "safe": not blocked,
        "action": "block" if blocked else "pass",
        "categories": flags,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health():
    return {"status": "ok", "service": "gentic-sanitizer", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8100, log_level="info")
