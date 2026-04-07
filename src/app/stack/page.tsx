"use client";

import { useState } from "react";
import type { Metadata } from "next";

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
    description:
      "Completed workflows with outcomes. What happened, what worked, what failed.",
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
    poisoning:
      "Medium risk — validate outcome classification. Hash inputs for tamper detection.",
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
    description:
      "Rules, compliance requirements, playbooks, SOPs. The 'how things work' layer.",
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
    poisoning:
      "HIGH risk — corrupted rules cascade everywhere. Git-version all changes. Require human approval for derived rules.",
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
    description:
      "ROI data, deal performance, cost tracking. Financially material = immutable.",
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
    poisoning:
      "CRITICAL — hash-chain integrity. No updates, only appends. Separate read/write permissions.",
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
    description:
      "Failures, anomalies, compliance violations, near-misses. The immune system.",
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
    poisoning:
      "CRITICAL — isolated store, separate credentials. An attacker who can erase risk memory can repeat attacks undetected.",
    costNote: "Near-zero routine cost, prevents catastrophic losses",
  },
];

const ARCHITECTURE_LAYERS = [
  {
    name: "Execution Agents",
    desc: "Task runners (n8n, voice, deal analysis)",
    color: "#F59E0B",
  },
  {
    name: "Reflection Layer",
    desc: "Evaluates outcomes before storage",
    color: "#3B82F6",
  },
  {
    name: "Memory Compressor",
    desc: "Raw → distilled state (the core engine)",
    color: "#8B5CF6",
  },
  {
    name: "Approval Gate",
    desc: "Human-in-loop for semantic + financial writes",
    color: "#EF4444",
  },
  {
    name: "Tiered State Store",
    desc: "5-tier persistent memory (see below)",
    color: "#10B981",
  },
  {
    name: "Planner / Router",
    desc: "Reads state → allocates next actions",
    color: "#6366F1",
  },
];

const DEFENSES = [
  {
    threat: "Memory Poisoning",
    description: "Adversarial input corrupts stored knowledge",
    defense:
      "Hash-chain financial records. Version-control semantic rules. Input validation on all writes.",
    severity: "critical",
  },
  {
    threat: "Hallucinated Memory",
    description: "Agent fabricates episodic memories that never occurred",
    defense:
      "Require execution trace hash to match episode. Cross-reference with system logs.",
    severity: "high",
  },
  {
    threat: "Memory Drift",
    description:
      "Gradual degradation of compressed summaries over iterations",
    defense:
      "Periodic re-compression from source logs. Confidence decay on untouched memories.",
    severity: "medium",
  },
  {
    threat: "Privilege Escalation via Memory",
    description: "Agent writes rules that expand its own permissions",
    defense:
      "Semantic memory writes require human approval. Separate read/write credential scopes.",
    severity: "critical",
  },
  {
    threat: "Replay Attacks",
    description: "Old state injected to revert agent behavior",
    defense:
      "Monotonic version counters. Reject any state older than current.",
    severity: "high",
  },
];

const COST_MODEL = [
  {
    tier: "Working",
    tokensPer: "~2K-8K",
    frequency: "Every execution",
    monthly: "$5-25",
  },
  {
    tier: "Episodic",
    tokensPer: "~500",
    frequency: "Per completed task",
    monthly: "$10-40",
  },
  {
    tier: "Semantic",
    tokensPer: "~200",
    frequency: "On rule change",
    monthly: "$1-5",
  },
  {
    tier: "Financial",
    tokensPer: "~100",
    frequency: "Per transaction",
    monthly: "$2-10",
  },
  {
    tier: "Risk",
    tokensPer: "~300",
    frequency: "On incident",
    monthly: "$1-5",
  },
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
    prompt:
      "Given this execution trace, what is the ONE insight that would change future behavior? Discard everything else.",
  },
  {
    stage: "Post-Episode",
    prompt:
      "Compare this outcome against the last 5 similar episodes. Is performance trending up, down, or stable? What changed?",
  },
  {
    stage: "Rule Derivation",
    prompt:
      "This pattern appeared in 3+ episodes. Should it become a semantic rule? State the rule, confidence level, and what would falsify it.",
  },
  {
    stage: "Risk Assessment",
    prompt:
      "What could go wrong if this memory is wrong? Rate: low (inconvenience), medium (cost), high (compliance), critical (business threat).",
  },
];

function SeverityBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    critical: {
      bg: "rgba(239, 68, 68, 0.15)",
      text: "#EF4444",
      border: "rgba(239, 68, 68, 0.3)",
    },
    high: {
      bg: "rgba(245, 158, 11, 0.15)",
      text: "#F59E0B",
      border: "rgba(245, 158, 11, 0.3)",
    },
    medium: {
      bg: "rgba(59, 130, 246, 0.15)",
      text: "#3B82F6",
      border: "rgba(59, 130, 246, 0.3)",
    },
  };
  const c = colors[level] || colors.medium;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 4,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {level}
    </span>
  );
}

export default function OperatorMemoryArchitecture() {
  const [activeTab, setActiveTab] = useState("topology");
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const tabs = [
    { id: "topology", label: "Architecture" },
    { id: "tiers", label: "Memory Tiers" },
    { id: "defenses", label: "Defenses" },
    { id: "reflection", label: "Reflection" },
    { id: "cost", label: "Cost Model" },
    { id: "mcp", label: "MCP Integration" },
  ];

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        background: "#0A0A0F",
        color: "#E2E8F0",
        minHeight: "100vh",
        padding: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 50%, #0A0A0F 100%)",
          borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
          padding: "32px 24px 24px",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              color: "#6366F1",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Production Blueprint
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
              background: "linear-gradient(135deg, #E2E8F0 0%, #94A3B8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Operator Memory Architecture
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#64748B",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            Tiered cognition for autonomous agents — not chatbot memory,
            operator-grade state management.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "#0D0D14",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            gap: 0,
            overflowX: "auto",
            padding: "0 24px",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 16px",
                fontSize: 12,
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: activeTab === t.id ? "#E2E8F0" : "#64748B",
                borderBottom:
                  activeTab === t.id
                    ? "2px solid #6366F1"
                    : "2px solid transparent",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>
        {/* TOPOLOGY TAB */}
        {activeTab === "topology" && (
          <div>
            <div
              style={{
                fontSize: 13,
                color: "#94A3B8",
                marginBottom: 24,
                lineHeight: 1.6,
              }}
            >
              Memory sits{" "}
              <strong style={{ color: "#E2E8F0" }}>above</strong> the agent,
              not inside it. A compromised agent cannot rewrite its own history.
              The approval gate prevents autonomous mutation of rules and
              financial records.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {ARCHITECTURE_LAYERS.map((layer, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 16px",
                    background: `linear-gradient(90deg, ${layer.color}08 0%, transparent 60%)`,
                    borderLeft: `3px solid ${layer.color}`,
                    borderRadius: "0 6px 6px 0",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: `${layer.color}20`,
                      color: layer.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#E2E8F0",
                      }}
                    >
                      {layer.name}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}
                    >
                      {layer.desc}
                    </div>
                  </div>
                  {i < ARCHITECTURE_LAYERS.length - 1 && (
                    <div
                      style={{
                        color: "#334155",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      ↓
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 24,
                padding: 16,
                background: "rgba(99, 102, 241, 0.06)",
                border: "1px solid rgba(99, 102, 241, 0.15)",
                borderRadius: 8,
                fontSize: 12,
                color: "#94A3B8",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#6366F1" }}>Key Principle:</strong> Data
              flows down through compression. Control flows up through the
              planner. No agent can write to a tier above its permission level.
              Financial and semantic writes always pass through the approval
              gate.
            </div>
          </div>
        )}

        {/* TIERS TAB */}
        {activeTab === "tiers" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {TIERS.map((tier) => {
                const isOpen = activeTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    style={{
                      border: `1px solid ${isOpen ? tier.borderColor : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 8,
                      background: isOpen
                        ? tier.bgColor
                        : "rgba(255,255,255,0.02)",
                      transition: "all 0.2s",
                    }}
                  >
                    <button
                      onClick={() =>
                        setActiveTier(isOpen ? null : tier.id)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{tier.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: tier.color,
                          }}
                        >
                          {tier.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#64748B",
                            marginTop: 2,
                          }}
                        >
                          {tier.description}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.05)",
                            color: "#94A3B8",
                          }}
                        >
                          {tier.ttl}
                        </span>
                        <span
                          style={{
                            color: "#475569",
                            fontSize: 14,
                            transform: isOpen
                              ? "rotate(180deg)"
                              : "rotate(0)",
                            transition: "transform 0.2s",
                          }}
                        >
                          ▼
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div
                        style={{
                          padding: "0 16px 16px",
                          borderTop: `1px solid ${tier.borderColor}`,
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 16,
                            marginTop: 16,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#64748B",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 8,
                              }}
                            >
                              Schema
                            </div>
                            <pre
                              style={{
                                fontSize: 11,
                                background: "rgba(0,0,0,0.3)",
                                padding: 12,
                                borderRadius: 6,
                                overflow: "auto",
                                margin: 0,
                                border: "1px solid rgba(255,255,255,0.05)",
                                color: "#94A3B8",
                                lineHeight: 1.5,
                              }}
                            >
                              {tier.schema}
                            </pre>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#64748B",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 8,
                              }}
                            >
                              Use Cases
                            </div>
                            {tier.examples.map((ex, i) => (
                              <div
                                key={i}
                                style={{
                                  fontSize: 12,
                                  color: "#94A3B8",
                                  padding: "6px 0",
                                  borderBottom:
                                    i < tier.examples.length - 1
                                      ? "1px solid rgba(255,255,255,0.04)"
                                      : "none",
                                }}
                              >
                                <span
                                  style={{
                                    color: tier.color,
                                    marginRight: 8,
                                  }}
                                >
                                  →
                                </span>
                                {ex}
                              </div>
                            ))}

                            <div
                              style={{
                                fontSize: 10,
                                color: "#64748B",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 8,
                                marginTop: 16,
                              }}
                            >
                              Storage
                            </div>
                            <div style={{ fontSize: 12, color: "#E2E8F0" }}>
                              {tier.storage}
                            </div>

                            <div
                              style={{
                                fontSize: 10,
                                color: "#64748B",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 8,
                                marginTop: 16,
                              }}
                            >
                              Poisoning Risk
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#94A3B8",
                                lineHeight: 1.5,
                              }}
                            >
                              {tier.poisoning}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DEFENSES TAB */}
        {activeTab === "defenses" && (
          <div>
            <div
              style={{
                fontSize: 13,
                color: "#94A3B8",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Most agent builders skip this. Then they lose money. These are the
              failure modes that matter when agents touch real deals and real
              dollars.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DEFENSES.map((d, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <SeverityBadge level={d.severity} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#E2E8F0",
                      }}
                    >
                      {d.threat}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748B",
                      marginBottom: 8,
                    }}
                  >
                    {d.description}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#94A3B8",
                      padding: "8px 12px",
                      background: "rgba(16, 185, 129, 0.06)",
                      border: "1px solid rgba(16, 185, 129, 0.12)",
                      borderRadius: 6,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: "#10B981" }}>Defense:</strong>{" "}
                    {d.defense}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REFLECTION TAB */}
        {activeTab === "reflection" && (
          <div>
            <div
              style={{
                fontSize: 13,
                color: "#94A3B8",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Compression without reflection produces garbage. These prompts
              run <em>before</em> memory is written — they&apos;re the quality
              gate between raw execution and curated state.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {REFLECTION_PROMPTS.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: 16,
                    background: "rgba(139, 92, 246, 0.04)",
                    border: "1px solid rgba(139, 92, 246, 0.12)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#8B5CF6",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      marginBottom: 10,
                      fontWeight: 600,
                    }}
                  >
                    {r.stage}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#E2E8F0",
                      lineHeight: 1.6,
                      fontStyle: "italic",
                      padding: "8px 12px",
                      borderLeft: "2px solid rgba(139, 92, 246, 0.3)",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "0 4px 4px 0",
                    }}
                  >
                    &ldquo;{r.prompt}&rdquo;
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 24,
                padding: 16,
                background: "rgba(245, 158, 11, 0.06)",
                border: "1px solid rgba(245, 158, 11, 0.15)",
                borderRadius: 8,
                fontSize: 12,
                color: "#94A3B8",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#F59E0B" }}>
                Implementation Note:
              </strong>{" "}
              Run reflection as a separate LLM call with a dedicated system
              prompt. Never let the executing agent reflect on itself — that
              &apos;s how you get hallucinated success memories. Use your
              cheaper local models (Devstral, Qwen) for reflection; save
              Haiku/Sonnet for execution.
            </div>
          </div>
        )}

        {/* COST MODEL TAB */}
        {activeTab === "cost" && (
          <div>
            <div
              style={{
                fontSize: 13,
                color: "#94A3B8",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Estimated costs for 100 leads/week workload across DealiQ +
              Gentic operations. Local models (Devstral, Kimi K2.5) handle
              reflection and compression at near-zero marginal cost.
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  padding: "10px 16px",
                  background: "rgba(255,255,255,0.03)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 10,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                <div>Tier</div>
                <div>Tokens/Op</div>
                <div>Frequency</div>
                <div>Est. Monthly</div>
              </div>
              {COST_MODEL.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    padding: "10px 16px",
                    borderBottom:
                      i < COST_MODEL.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                    fontSize: 12,
                  }}
                >
                  <div style={{ color: "#E2E8F0", fontWeight: 500 }}>
                    {row.tier}
                  </div>
                  <div style={{ color: "#94A3B8" }}>{row.tokensPer}</div>
                  <div style={{ color: "#94A3B8" }}>{row.frequency}</div>
                  <div style={{ color: "#10B981", fontWeight: 500 }}>
                    {row.monthly}
                  </div>
                </div>
              ))}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  padding: "10px 16px",
                  background: "rgba(16, 185, 129, 0.06)",
                  borderTop: "1px solid rgba(16, 185, 129, 0.15)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <div style={{ color: "#E2E8F0" }}>Total</div>
                <div></div>
                <div></div>
                <div style={{ color: "#10B981" }}>$19-85/mo</div>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 16,
                background: "rgba(16, 185, 129, 0.06)",
                border: "1px solid rgba(16, 185, 129, 0.15)",
                borderRadius: 8,
                fontSize: 12,
                color: "#94A3B8",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#10B981" }}>ROI Context:</strong> A
              single prevented bad deal ($5K+ loss avoided) pays for 5+ years
              of memory infrastructure. A single pattern detected early
              (underpriced ARV, seller flexibility signal) can generate $20K+
              incremental profit. Memory cost is noise. Memory{" "}
              <em>absence</em> cost is real.
            </div>
          </div>
        )}

        {/* MCP INTEGRATION TAB */}
        {activeTab === "mcp" && (
          <div>
            <div
              style={{
                fontSize: 13,
                color: "#94A3B8",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Expose tiered memory as an MCP server so any Claude agent
              (Desktop, Code, API) can read/write to the correct tier with
              proper permissions.
            </div>

            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 16px",
                  background: "rgba(255,255,255,0.03)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ fontSize: 11, color: "#64748B" }}>
                  operator-memory-mcp/tools.js
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(MCP_INTEGRATION);
                    setShowCode(true);
                    setTimeout(() => setShowCode(false), 2000);
                  }}
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 4,
                    background: showCode
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(255,255,255,0.05)",
                    border: `1px solid ${showCode ? "rgba(16, 185, 129, 0.3)" : "rgba(255,255,255,0.1)"}`,
                    color: showCode ? "#10B981" : "#94A3B8",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {showCode ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre
                style={{
                  fontSize: 11,
                  padding: 16,
                  margin: 0,
                  overflow: "auto",
                  color: "#94A3B8",
                  lineHeight: 1.5,
                  maxHeight: 400,
                }}
              >
                {MCP_INTEGRATION}
              </pre>
            </div>

            <div
              style={{
                marginTop: 20,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {[
                {
                  tool: "memory_read",
                  desc: "Any agent, any tier. Filtered by permission scope.",
                  color: "#3B82F6",
                },
                {
                  tool: "memory_write",
                  desc: "Auto-routes to approval gate for semantic + financial.",
                  color: "#F59E0B",
                },
                {
                  tool: "memory_compress",
                  desc: "Triggers working → episodic compression pipeline.",
                  color: "#8B5CF6",
                },
                {
                  tool: "memory_reflect",
                  desc: "Runs reflection prompt before write. Uses local LLM.",
                  color: "#10B981",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: `${t.color}08`,
                    border: `1px solid ${t.color}20`,
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: t.color,
                      fontFamily: "inherit",
                    }}
                  >
                    {t.tool}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#94A3B8",
                      marginTop: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    {t.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.04)",
          padding: "16px 24px",
          marginTop: 32,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{ fontSize: 10, color: "#334155", textAlign: "center" }}
        >
          Operator Memory Architecture v1.0 — Built for the Secure AI Stack
        </div>
      </div>
    </div>
  );
}
