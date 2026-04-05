# We Found a Prompt Cache-Busting Bug in Claude Code's MCP Runtime — Here's the Fix

*By the Gentic AI team | gentic.pro | April 2026*

If you use MCP servers with Claude Code, you might be paying 2-3x more in API costs than you need to. We traced it to a single missing `.toSorted()` call in the MCP tool runtime. Here is exactly what is happening, why it matters for your bill, and how to fix it.

## What Prompt Caching Is and Why It Matters

Anthropic's prompt caching lets the API reuse previously processed context across turns in a conversation. When the beginning of your request — system prompt, tools definition, conversation history — matches what was sent on the previous turn, the API serves those tokens from cache at roughly 75% less cost than processing them fresh.

For a typical Claude Code session, the tools block alone can run 5,000-15,000 tokens depending on how many MCP servers you have connected. If that block caches correctly, you pay the discounted rate on every turn after the first. If it does not cache, you pay full price every single turn.

The cache key is sensitive to ordering. Same content in a different order = different cache key = cache miss. This is where MCP tools become a problem.

## The Bug: Nondeterministic Tool Ordering

Claude Code's MCP integration lives in `src/agents/pi-bundle-mcp-tools.ts`. The key function is `createBundleMcpToolRuntime`, which runs on every conversational turn. Here is what it does:

1. Spawns stdio transports to each configured MCP server
2. Calls `client.listTools()` on each server to collect available tools
3. Bundles those tools into the array that gets sent to the Claude API
4. Tears down the transports in the `finally` block

The problem is in step 3. The tools are collected in whatever order `listTools()` returns them — and the MCP specification does not guarantee a stable ordering for that response. The server is free to return tools in any order it likes, and many implementations use hash maps or other unordered data structures internally.

So on turn 1, you might get:

```
[read_file, write_file, list_directory, search_files]
```

And on turn 2, the same server returns:

```
[list_directory, read_file, search_files, write_file]
```

Same tools. Same capabilities. Different array order. The API sees a different tools block, and the prompt cache invalidates.

This is not a theoretical concern. We observed it in production by logging the tools array across turns and diffing. With multiple MCP servers connected, the reordering happens frequently — sometimes every turn, sometimes every few turns. The more servers and tools you have, the more likely the shuffle.

## The Cost Impact

Let us put real numbers on this. Say you have a fairly typical Claude Code setup with 3-4 MCP servers providing 50 tools total. That tools block is approximately 10,000 tokens.

With prompt caching working correctly:
- Turn 1: 10K tokens at full input price (cache write)
- Turns 2-20: 10K tokens at cached price (75% discount)
- Total for tools across 20 turns: ~10K full + 190K cached = ~57.5K effective tokens

With the cache busting on every turn:
- Turns 1-20: 10K tokens at full input price each time
- Total for tools across 20 turns: 200K full-price tokens

That is roughly a 3.5x difference just on the tools block. The actual multiplier depends on how much of your other context also fails to cache (since the tools block sits early in the request, a cache miss there can cascade and invalidate everything after it too).

Over a month of heavy Claude Code usage — say 50 sessions averaging 20 turns each — you are looking at tens of millions of unnecessarily uncached tokens. At Sonnet pricing, that is real money.

## The One-Line Fix

Sort the tools alphabetically by name before returning them:

```typescript
// Before (nondeterministic order)
return {
  tools: tools,
  // ...
};

// After (stable order, cache-friendly)
return {
  tools: tools.toSorted((a, b) => a.name.localeCompare(b.name)),
  // ...
};
```

That is it. One line. Deterministic ordering means the tools block is identical between turns (assuming the same servers are connected), and the prompt cache stays warm.

If you are running a fork or local build of Claude Code, you can apply this patch to `src/agents/pi-bundle-mcp-tools.ts` at line 122 right now. For upstream, this would be a straightforward PR.

## The Deeper Issue: Per-Turn Runtime Recreation

The sort fix addresses the immediate cache-busting problem, but there is a more fundamental architectural issue worth noting.

`createBundleMcpToolRuntime` is called on every conversational turn. Each call:

1. Spawns new stdio transports to every MCP server
2. Performs the capability handshake
3. Calls `listTools()` on each server
4. Wraps the tools
5. Disposes everything in the `finally` block

This means every turn pays the startup cost of every MCP server. For servers that are quick to start (like the filesystem server), this is barely noticeable. For servers that need to authenticate, connect to databases, or load large configurations, this adds latency to every turn.

The better fix would be to cache the MCP runtime at session scope. Create it once when the session starts (or when the MCP server config changes), keep the transports alive, and reuse the tools array. You could key the cache on a hash of the MCP server configuration — if the config has not changed, the runtime does not need to be recreated.

This would eliminate both the cache-busting issue (tools array is stable because it is the same object) and the per-turn startup overhead. It would also make MCP server errors easier to handle, since you could detect a dead transport and reconnect rather than silently getting a different tool set.

## Detecting This in Your Setup

We built [mcp-audit](https://gentic.pro), a diagnostic plugin that detects this and other MCP performance issues in Claude Code setups. It monitors:

- Tool ordering stability across turns
- Cache hit rates on the tools block
- MCP server startup latency per turn
- Transport lifecycle overhead
- Redundant tool definitions across servers

If you are running multiple MCP servers and have not checked for this, you almost certainly have some flavor of cache inefficiency happening. The ordering bug is the most common, but duplicate tool names across servers and unnecessary tool re-registration are close behind.

## What You Should Do Now

1. **Immediate**: If you build Claude Code from source, apply the one-line sort fix. It is zero-risk and saves money immediately.
2. **Short term**: Audit your MCP server setup for redundant tools and slow-starting servers.
3. **Long term**: Watch for upstream fixes to the runtime lifecycle. Session-scoped caching is the right answer.

If you are building AI automation infrastructure and want to stop leaving money on the table, check out our n8n workflow templates at [gentic-n8n.deals](https://gentic-n8n.deals) — we have spent hundreds of hours optimizing the plumbing so you do not have to.

Questions? Find us at [gentic.pro](https://gentic.pro).

---

*Gentic AI builds production AI infrastructure for businesses that cannot afford to get it wrong. From LLM cost optimization to full automation stacks, we make AI work reliably at scale.*
