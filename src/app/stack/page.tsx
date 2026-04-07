"use client";

import { useState } from "react";

const TIERS = [
  {
    id: "working",
    name: "Working Memory",
    icon: "⚡",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.25)",
    ttl: "Session-scoped",
    storage: "In-context / Redis",
    description: "Current task state, active variables, immediate goals. Dies when execution ends.",
    schema: `{
  "task_id": "uuid",
  "objective": "string",
  "current_step": "int",
  "variables": {},
  "constraints": [],
  "started_at": "ISO8601"
}`,
    examples: [
      "Active deal being underwritten",
      "Current n8n workflow execution state",
      "Live voice call context",
    ],
    poisoning: "Low risk — ephemeral by design. Validate inputs at entry.",
    costNote: "Highest token cost per session, lowest persistence cost",
  },
  {
    id: "episodic",
    name: "Episodic Memory",
    icon: "📖",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.08)",
    borderColor: "rgba(59, 130, 246, 0.25)",
    ttl: "30–90 days rolling",
    storage: "PostgreSQL / Supabase",
    description: "Completed workflows with outcomes. What happened, what worked, what failed.",
    schema: `{
  "episode_id": "uuid",
  "agent_id": "string",
  "task_type": "string",
  "inputs_hash": "sha256",
  "outcome": "success|failure|partial",
  "metrics": {
    "duration_ms": "int",
    "token_cost": "float",
    "error_count": "int"
  },
  "compressed_narrative": "string(500)",
  "created_at": "ISO8601",
  "ttl_expires": "ISO8601"
}`,
    examples: [
      "Deal analysis → accepted → closed at $X",
      "Workflow failed at step 7, retried, succeeded",
      "Voice agent booked appointment after 3 objections",
    ],
    poisoning: "Medium risk — validate outcome classification. Hash inputs for tamper detection.",
    costNote: "Moderate storage, high value for pattern extraction",
  },
  {
    id: "semantic",
    name: "Semantic Memory",
    icon: "📐",
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.08)",
    borderColor: "rgba(139, 92, 246, 0.25)",
    ttl: "Versioned / permanent",
    storage: "Git-versioned JSON / YAML",
    description: "Rules, compliance requirements, playbooks, SOPs. The 'how things work' layer.",
    schema: `{
  "rule_id": "string",
  "domain": "real_estate|automation|voice_ai",
  "content": "string",
  "version": "semver",
  "source": "manual|derived",
  "confidence": "float(0-1)",
  "last_validated": "ISO8601",
  "changelog": [
    {"version": "1.1", "change": "string", "date": "ISO8601"}
  ]
}`,
    examples: [
      "AZ wholesale requires 10-day inspection period",
      "Retell webhook format changed in v3.2",
      "Lead scoring threshold: 65+ = qualified",
    ],
    poisoning: "HIGH risk — corrupted rules cascade everywhere. Git-version all changes. Require human approval for derived rules.",
    costNote: "Low token cost (structured), highest strategic value",
  },
  {
    id: "financial",
    name: "Financial Memory",
    icon: "💰",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.25)",
    ttl: "Immutable / append-only",
    storage: "Append-only log + PostgreSQL",
    description: "ROI data, deal performance, cost tracking. Financially material = immutable.",
    schema: `{
  "record_id": "uuid",
  "type": "deal|campaign|agent_cost",
  "amount": "decimal",
  "currency": "USD",
  "category": "string",
  "metadata": {},
  "hash": "sha256(prev_hash + record)",
  "created_at": "ISO8601",
  "created_by": "agent_id|human_id",
  "immutable": true
}`,
    examples: [
      "Deal #427: ARV $285K, purchase $195K, rehab $35K",
      "Voice agent cost: $0.12/min × 847 min = $101.64",
      "Campaign ROI: $4,200 spend → $38,000 revenue",
    ],
    poisoning: "CRITICAL — hash-chain integrity. No updates, only appends. Separate read/write permissions.",
    costNote: "Minimal token cost, maximum business impact",
  },
  {
    id: "risk",
    name: "Risk Memory",
    icon: "🛡️",
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.08)",
    borderColor: "rgba(239, 68, 68, 0.25)",
    ttl: "Permanent / escalation-linked",
    storage: "Isolated store + alert triggers",
    description: "Failures, anomalies, compliance violations, near-misses. The immune system.",
    schema: `{
  "incident_id": "uuid",
  "severity": "low|medium|high|critical",
  "category": "compliance|financial|operational|security",
  "description": "string",
  "root_cause": "string|null",
  "resolution": "string|null",
  "affected_agents": ["agent_id"],
  "escalated": "boolean",
  "created_at": "ISO8601",
  "resolved_at": "ISO8601|null"
}`,
    examples: [
      "Agent sent offer without approval gate — blocked",
      "Voice agent detected hostile caller — escalated",
      "Workflow loop detected: 47 iterations in 2 min",
    ],
    poisoning: "CRITICAL — isolated store, separate credentials. An attacker who can erase risk memory can repeat attacks undetected.",
    costNote: "Near-zero routine cost, prevents catastrophic losses",
  },
];

const ARCHITECTURE_LAYERS = [
  { name: "Execution Agents", desc: "Task runners (n8n, voice, deal analysis)", color: "#F59E0B" },
  { name: "Reflection Layer", desc: "Evaluates outcomes before storage", color: "#3B82F6" },
  { name: "Memory Compressor", desc: "Raw → distilled state (the core engine)", color: "#8B5CF6" },
  { name: "Approval Gate", desc: "Human-in-loop for semantic + financial writes", color: "#EF4444" },
  { name: "Tiered State Store", desc: "5-tier persistent memory (see below)", color: "#10B981" },
  { name: "Planner / Router", desc: "Reads state → allocates next actions", color: "#6366F1" },
];

const DEFENSES = [
  {
    threat: "Memory Poisoning",
    description: "Adversarial input corrupts stored knowledge",
    defense: "Hash-chain financial records. Version-control semantic rules. Input validation on all writes.",
    severity: "critical",
  },
  {
    threat: "Hallucinated Memory",
    description: "Agent fabricates episodic memories that never occurred",
    defense: "Require execution trace hash to match episode. Cross-reference with system logs.",
    severity: "high",
  },
  {
    threat: "Memory Drift",
    description: "Gradual degradation of compressed summaries over iterations",
    defense: "Periodic re-compression from source logs. Confidence decay on untouched memories.",
    severity: "medium",
  },
  {
    threat: "Privilege Escalation via Memory",
    description: "Agent writes rules that expand its own permissions",
    defense: "Semantic memory writes require human approval. Separate read/write credential scopes.",
    severity: "critical",
  },
  {
    threat: "Replay Attacks",
    description: "Old state injected to revert agent behavior",
    defense: "Monotonic version counters. Reject any state older than current.",
    severity: "high",
  },
];

const COST_MODEL = [
  { tier: "Working", tokensPer: "~2K-8K", frequency: "Every execution", monthly: "$5-25" },
  { tier: "Episodic", tokensPer: "~500", frequency: "Per completed task", monthly: "$10-40" },
  { tier: "Semantic", tokensPer: "~200", frequency: "On rule change", monthly: "$1-5" },
  { tier: "Financial", tokensPer: "~100", frequency: "Per transaction", monthly: "$2-10" },
  { tier: "Risk", tokensPer: "~300", frequency: "On incident", monthly: "$1-5" },
];

const MCP_INTEGRATION = `// MCP Server: operator-memory
// Exposes tiered memory as tools for any Claude agent

const tools = [
  {
    name: "memory_read",
    description: "Read from any memory tier",
    input_schema: {
      type: "object",
      properties: {
        tier: { enum: ["working","episodic","semantic","financial","risk"] },
        query: { type: "string" },
        filters: { type: "object" },
        limit: { type: "integer", default: 10 }
      },
      required: ["tier", "query"]
    }
  },
  {
    name: "memory_write",
    description: "Write to memory (approval gate for semantic/financial)",
    input_schema: {
      type: "object",
      properties: {
        tier: { enum: ["working","episodic","semantic","financial","risk"] },
        data: { type: "object" },
        require_approval: { type: "boolean" }
      },
      required: ["tier", "data"]
    }
  },
  {
    name: "memory_compress",
    description: "Trigger compression of working → episodic",
    input_schema: {
      type: "object",
      properties: {
        session_id: { type: "string" },
        compression_strategy: { enum: ["summary","structured","hybrid"] }
      },
      required: ["session_id"]
    }
  },
  {
    name: "memory_reflect",
    description: "Run reflection loop before compression",
    input_schema: {
      type: "object",
      properties: {
        episode_id: { type: "string" },
        reflection_prompt: { type: "string" }
      },
      required: ["episode_id"]
    }
  }
];`;

const REFLECTION_PROMPTS = [
  {
    stage: "Pre-Compression",
    prompt: "Given this execution trace, what is the ONE insight that would change future behavior? Discard everything else.",
  },
  {
    stage: "Post-Episode",
    prompt: "Compare this outcome against the last 5 similar episodes. Is performance trending up, down, or stable? What changed?",
  },
  {
    stage: "Rule Derivation",
    prompt: "This pattern appeared in 3+ episodes. Should it become a semantic rule? State the rule, confidence level, and what would falsify it.",
  },
  {
    stage: "Risk Assessment",
    prompt: "What could go wrong if this memory is wrong? Rate: low (inconvenience), medium (cost), high (compliance), critical (business threat).",
  },
];

function SeverityBadge({ level }: { level: string }) {
  const cls: Record<string, string> = {
    critical: "bg-red-500/15 text-red-500 border border-red-500/30",
    high: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
    medium: "bg-blue-500/15 text-blue-500 border border-blue-500/30",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-[0.5px] ${cls[level] ?? cls.medium}`}>
      {level}
    </span>
  );
}

function TierCard({ tier }: { tier: typeof TIERS[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-lg transition-all duration-200"
      style={{
        border: `1px solid ${open ? tier.borderColor : "rgba(255,255,255,0.06)"}`,
        background: open ? tier.bgColor : "rgba(255,255,255,0.02)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-transparent border-none cursor-pointer font-mono text-left"
      >
        <span className="text-xl">{tier.icon}</span>
        <div className="flex-1">
          <div className="text-sm font-semibold" style={{ color: tier.color }}>{tier.name}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{tier.description}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400">{tier.ttl}</span>
          <span
            className="text-slate-600 text-sm transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
          >
            ▼
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${tier.borderColor}` }}>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[1px] mb-2">Schema</div>
              <pre className="text-[11px] bg-black/30 p-3 rounded-md overflow-auto border border-white/5 text-slate-400 leading-relaxed m-0">
                {tier.schema}
              </pre>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[1px] mb-2">Use Cases</div>
              {tier.examples.map((ex, i) => (
                <div
                  key={i}
                  className="text-xs text-slate-400 py-1.5"
                  style={{ borderBottom: i < tier.examples.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <span className="mr-2" style={{ color: tier.color }}>→</span>
                  {ex}
                </div>
              ))}

              <div className="text-[10px] text-slate-500 uppercase tracking-[1px] mb-2 mt-4">Storage</div>
              <div className="text-xs text-slate-200">{tier.storage}</div>

              <div className="text-[10px] text-slate-500 uppercase tracking-[1px] mb-2 mt-4">Poisoning Risk</div>
              <div className="text-xs text-slate-400 leading-relaxed">{tier.poisoning}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DefenseCard({ d }: { d: typeof DEFENSES[number] }) {
  return (
    <div className="px-4 py-3.5 bg-white/[0.02] border border-white/[0.06] rounded-lg">
      <div className="flex items-center gap-2.5 mb-2">
        <SeverityBadge level={d.severity} />
        <span className="text-[13px] font-semibold text-slate-200">{d.threat}</span>
      </div>
      <div className="text-xs text-slate-500 mb-2">{d.description}</div>
      <div className="text-xs text-slate-400 px-3 py-2 bg-emerald-500/[0.06] border border-emerald-500/[0.12] rounded-md leading-relaxed">
        <strong className="text-emerald-500">Defense:</strong> {d.defense}
      </div>
    </div>
  );
}

export default function OperatorMemoryArchitecture() {
  const [activeTab, setActiveTab] = useState("topology");
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: "topology", label: "Architecture" },
    { id: "tiers", label: "Memory Tiers" },
    { id: "defenses", label: "Defenses" },
    { id: "reflection", label: "Reflection" },
    { id: "cost", label: "Cost Model" },
    { id: "mcp", label: "MCP Integration" },
  ];

  return (
    <div className="font-mono bg-[#0A0A0F] text-slate-200 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A0A0F] via-[#1A1A2E] to-[#0A0A0F] border-b border-indigo-500/20 px-6 lg:px-12 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-[11px] text-indigo-500 tracking-[3px] uppercase mb-2">Production Blueprint</div>
          <h1 className="text-[28px] font-bold m-0 leading-tight bg-gradient-to-br from-slate-200 to-slate-400 bg-clip-text text-transparent">
            Operator Memory Architecture
          </h1>
          <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
            Tiered cognition for autonomous agents — not chatbot memory, operator-grade state management.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06] bg-[#0D0D14] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex gap-0 overflow-x-auto px-6 lg:px-12">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-xs font-medium bg-transparent border-x-0 border-t-0 cursor-pointer font-mono whitespace-nowrap transition-all duration-150 ${
                activeTab === t.id
                  ? "text-slate-200 border-b-2 border-indigo-500"
                  : "text-slate-500 border-b-2 border-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">

        {/* TOPOLOGY TAB */}
        {activeTab === "topology" && (
          <div>
            <p className="text-[13px] text-slate-400 mb-6 leading-relaxed">
              Memory sits <strong className="text-slate-200">above</strong> the agent, not inside it. A compromised
              agent cannot rewrite its own history. The approval gate prevents autonomous mutation of rules and
              financial records.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0.5">
              {ARCHITECTURE_LAYERS.map((layer, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-r-md"
                  style={{
                    background: `linear-gradient(90deg, ${layer.color}08 0%, transparent 60%)`,
                    borderLeft: `3px solid ${layer.color}`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ background: `${layer.color}20`, color: layer.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-slate-200">{layer.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{layer.desc}</div>
                  </div>
                  {i < ARCHITECTURE_LAYERS.length - 1 && (
                    <div className="text-slate-700 text-base shrink-0">↓</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-indigo-500/[0.06] border border-indigo-500/[0.15] rounded-lg text-xs text-slate-400 leading-relaxed">
              <strong className="text-indigo-500">Key Principle:</strong> Data flows down through compression.
              Control flows up through the planner. No agent can write to a tier above its permission level.
              Financial and semantic writes always pass through the approval gate.
            </div>
          </div>
        )}

        {/* TIERS TAB */}
        {activeTab === "tiers" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {TIERS.map((tier) => <TierCard key={tier.id} tier={tier} />)}
          </div>
        )}

        {/* DEFENSES TAB */}
        {activeTab === "defenses" && (
          <div>
            <p className="text-[13px] text-slate-400 mb-5 leading-relaxed">
              Most agent builders skip this. Then they lose money. These are the failure modes that matter when
              agents touch real deals and real dollars.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {DEFENSES.map((d, i) => <DefenseCard key={i} d={d} />)}
            </div>
          </div>
        )}

        {/* REFLECTION TAB */}
        {activeTab === "reflection" && (
          <div>
            <p className="text-[13px] text-slate-400 mb-5 leading-relaxed">
              Compression without reflection produces garbage. These prompts run <em>before</em> memory is
              written — they&apos;re the quality gate between raw execution and curated state.
            </p>
            <div className="flex flex-col gap-3">
              {REFLECTION_PROMPTS.map((r, i) => (
                <div key={i} className="p-4 bg-violet-500/[0.04] border border-violet-500/[0.12] rounded-lg">
                  <div className="text-[10px] text-violet-400 uppercase tracking-[1.5px] mb-2.5 font-semibold">
                    {r.stage}
                  </div>
                  <div className="text-[13px] text-slate-200 leading-relaxed italic px-3 py-2 border-l-2 border-violet-500/30 bg-black/20 rounded-r">
                    &ldquo;{r.prompt}&rdquo;
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-amber-500/[0.06] border border-amber-500/[0.15] rounded-lg text-xs text-slate-400 leading-relaxed">
              <strong className="text-amber-500">Implementation Note:</strong> Run reflection as a separate LLM
              call with a dedicated system prompt. Never let the executing agent reflect on itself — that&apos;s
              how you get hallucinated success memories. Use your cheaper local models (Devstral, Qwen) for
              reflection; save Haiku/Sonnet for execution.
            </div>
          </div>
        )}

        {/* COST MODEL TAB */}
        {activeTab === "cost" && (
          <div>
            <p className="text-[13px] text-slate-400 mb-5 leading-relaxed">
              Estimated costs for 100 leads/week workload across DealiQ + Gentic operations. Local models
              (Devstral, Kimi K2.5) handle reflection and compression at near-zero marginal cost.
            </p>
            <div className="border border-white/[0.06] rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] text-[10px] text-slate-500 uppercase tracking-[1px]">
                <div>Tier</div>
                <div>Tokens/Op</div>
                <div>Frequency</div>
                <div>Est. Monthly</div>
              </div>
              {COST_MODEL.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 px-4 py-2.5 text-xs"
                  style={{ borderBottom: i < COST_MODEL.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <div className="text-slate-200 font-medium">{row.tier}</div>
                  <div className="text-slate-400">{row.tokensPer}</div>
                  <div className="text-slate-400">{row.frequency}</div>
                  <div className="text-emerald-500 font-medium">{row.monthly}</div>
                </div>
              ))}
              <div className="grid grid-cols-4 px-4 py-2.5 bg-emerald-500/[0.06] border-t border-emerald-500/[0.15] text-xs font-semibold">
                <div className="text-slate-200">Total</div>
                <div />
                <div />
                <div className="text-emerald-500">$19-85/mo</div>
              </div>
            </div>
            <div className="mt-5 p-4 bg-emerald-500/[0.06] border border-emerald-500/[0.15] rounded-lg text-xs text-slate-400 leading-relaxed">
              <strong className="text-emerald-500">ROI Context:</strong> A single prevented bad deal ($5K+ loss
              avoided) pays for 5+ years of memory infrastructure. A single pattern detected early (underpriced
              ARV, seller flexibility signal) can generate $20K+ incremental profit. Memory cost is noise.
              Memory <em>absence</em> cost is real.
            </div>
          </div>
        )}

        {/* MCP INTEGRATION TAB */}
        {activeTab === "mcp" && (
          <div>
            <p className="text-[13px] text-slate-400 mb-5 leading-relaxed">
              Expose tiered memory as an MCP server so any Claude agent (Desktop, Code, API) can read/write to
              the correct tier with proper permissions.
            </p>
            <div className="bg-black/30 border border-white/[0.06] rounded-lg overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
                <span className="text-[11px] text-slate-500">operator-memory-mcp/tools.js</span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(MCP_INTEGRATION);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`text-[11px] px-2.5 py-0.5 rounded cursor-pointer font-mono transition-all duration-150 ${
                    copied
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
                      : "bg-white/5 border border-white/10 text-slate-400"
                  }`}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre className="text-[11px] p-4 m-0 overflow-auto text-slate-400 leading-relaxed max-h-[400px]">
                {MCP_INTEGRATION}
              </pre>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { tool: "memory_read", desc: "Any agent, any tier. Filtered by permission scope.", color: "#3B82F6" },
                { tool: "memory_write", desc: "Auto-routes to approval gate for semantic + financial.", color: "#F59E0B" },
                { tool: "memory_compress", desc: "Triggers working → episodic compression pipeline.", color: "#8B5CF6" },
                { tool: "memory_reflect", desc: "Runs reflection prompt before write. Uses local LLM.", color: "#10B981" },
              ].map((t, i) => (
                <div
                  key={i}
                  className="p-3 rounded-md"
                  style={{ background: `${t.color}08`, border: `1px solid ${t.color}20` }}
                >
                  <div className="text-xs font-semibold font-mono" style={{ color: t.color }}>{t.tool}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.04] px-6 py-4 mt-8 flex justify-center">
        <div className="text-[10px] text-slate-700 text-center">
          Operator Memory Architecture v1.0 — Built for the Secure AI Stack
        </div>
      </div>
    </div>
  );
}
