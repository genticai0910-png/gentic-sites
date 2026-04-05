# Twitter/X Thread: MCP Cache-Busting Bug in Claude Code

---

🧵 1/9
We found a bug in Claude Code that's been silently 2-3x-ing your API costs if you use MCP servers.

Here's what's happening and the one-line fix 👇

---

🧵 2/9
First, prompt caching: Anthropic lets you reuse previously processed tokens at ~75% off. Your system prompt, tools, and history get cached between turns.

The catch? The cache key is order-sensitive. Same content + different order = cache miss = full price.

---

🧵 3/9
When you connect MCP servers to Claude Code, each server's tools get bundled into the API request's tools array.

That tools array is part of the cache key. If it changes between turns — even just the ordering — you bust the cache.

---

🧵 4/9
The bug: `createBundleMcpToolRuntime` in `pi-bundle-mcp-tools.ts` calls `client.listTools()` every turn without sorting the results.

The MCP spec doesn't guarantee listTools() order. Servers use hash maps, Sets, whatever — order is nondeterministic.

---

🧵 5/9
So turn 1 your tools array might be [read_file, write_file, search_files] and turn 2 it's [search_files, read_file, write_file].

Same tools. Different order. Cache miss. Full-price tokens. Every. Single. Turn.

---

🧵 6/9
The math: 50 MCP tools ≈ 10K tokens in the tools block.

Cached across 20 turns: ~57K effective tokens
Uncached across 20 turns: 200K full-price tokens

That's 3.5x more spend on just the tools block. And cache misses cascade — everything after the tools block gets reprocessed too.

---

🧵 7/9
The fix is one line:

```
tools: tools.toSorted((a, b) => a.name.localeCompare(b.name))
```

Deterministic order → stable cache key → cache stays warm.

The deeper fix: stop recreating the entire MCP runtime per turn. Cache it at session scope, keyed on server config hash.

---

🧵 8/9
We built an mcp-audit plugin that detects this and other MCP performance issues:

- Tool ordering instability
- Cache hit rate monitoring
- Transport startup overhead
- Redundant tools across servers

If you run multiple MCP servers, you almost certainly have cache inefficiency.

---

🧵 9/9
Full technical writeup on our blog at gentic.pro

n8n automation templates (cost-optimized): gentic-n8n.deals

We build production AI infrastructure at @gentic_ai — if you're burning money on uncached tokens, we can help.

---
