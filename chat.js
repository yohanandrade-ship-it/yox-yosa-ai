const ALLOWED_ROLES = new Set(["user", "assistant", "system"]);
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
  const reply = (statusCode, payload) => ({ statusCode, headers, body: JSON.stringify(payload) });
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return reply(405, { error: "Use POST para enviar uma mensagem." });
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return reply(503, { error: "A chave OPENROUTER_API_KEY ainda não foi configurada no Netlify." });
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return reply(400, { error: "O corpo da mensagem não é um JSON válido." }); }
  if (!Array.isArray(body.messages) || body.messages.length === 0) return reply(400, { error: "Envie pelo menos uma mensagem." });
  const messages = body.messages.slice(-24).map((m) => {
    if (!m || !ALLOWED_ROLES.has(m.role) || typeof m.content !== "string") return null;
    return { role: m.role, content: m.content.slice(0, 12000) };
  });
  if (messages.some(m => !m)) return reply(400, { error: "Formato de mensagem inválido." });
  if (!messages.some(m => m.role === "user")) return reply(400, { error: "A conversa precisa conter uma mensagem do usuário." });
  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.URL || "https://yox-yosa-ai-chat.netlify.app",
        "X-Title": "YOX YOSA AI"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o",
        messages: [
          { role: "system", content: "Você é a YOX YOSA AI, uma assistente útil, clara e respeitosa. Responda em português brasileiro por padrão. Explique assuntos complexos passo a passo e não afirme que realizou ações que não realizou." },
          ...messages.filter(m => m.role !== "system")
        ],
        temperature: 0.7,
        max_tokens: 1200
      }),
      signal: AbortSignal.timeout(45000)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const detail = data?.error?.message || `O provedor de IA respondeu com status ${upstream.status}.`;
      if (upstream.status === 401 || upstream.status === 403) return reply(502, { error: "A OpenRouter recusou a chave. Verifique OPENROUTER_API_KEY no Netlify e gere uma chave válida." });
      if (upstream.status === 429) return reply(429, { error: "Limite de uso da OpenRouter atingido. Confira créditos e limites da conta." });
      console.error("OpenRouter error:", upstream.status, detail);
      return reply(502, { error: "O serviço de IA não respondeu corretamente. Confira a chave, os créditos e o modelo configurado." });
    }
    const content = data?.choices?.[0]?.message?.content;
    const answer = Array.isArray(content) ? content.map(part => part.text || "").join("") : content;
    if (typeof answer !== "string" || !answer.trim()) return reply(502, { error: "O serviço de IA não retornou texto." });
    return reply(200, { reply: answer.trim() });
  } catch (error) {
    console.error("Chat function error:", error);
    return reply(504, { error: "A conexão com o serviço de IA demorou demais. Tente novamente." });
  }
};