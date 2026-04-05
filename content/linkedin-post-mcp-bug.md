# LinkedIn Post: MCP Tool Ordering Cache Bug

---

**Your Claude Code API bill might be 2-3x higher than it needs to be.**

We traced it to a single missing sort call in the MCP tool runtime.

Here is what happens: Claude Code collects tools from your MCP servers every turn and sends them to the API. The MCP spec does not guarantee tool ordering — so the tools array shuffles between turns. Anthropic's prompt cache is order-sensitive. Different order = cache miss = full-price tokens on every turn.

With 50 MCP tools, that is roughly 10,000 tokens billed at full rate instead of the 75%-discounted cached rate. Across a 20-turn session, you are paying for 200K uncached tokens when you should be paying for 57K effective tokens.

The fix is one line of code: sort tools alphabetically before returning them.

At Gentic AI, we dig into the infrastructure layer where most teams do not look — because that is where the real cost savings and reliability gains live. This is what we do.

Full technical breakdown: gentic.pro
AI automation templates: gentic-n8n.deals

#AI #LLM #CostOptimization #MCP #ClaudeCode #AIInfrastructure #Automation

---
