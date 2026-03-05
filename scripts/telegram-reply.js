export function buildPublishSuccessMessage(post) {
  const title = post.title && post.title.trim() ? post.title.trim() : "(no title)";
  return `Published successfully\nSlug: ${post.slug}\nTitle: ${title}`;
}

export async function sendPublishSuccessReply(fetchImpl, botToken, payload) {
  const response = await fetchImpl(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: payload.chatId,
      text: buildPublishSuccessMessage(payload.post),
      reply_to_message_id: payload.replyToMessageId
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: HTTP ${response.status}`);
  }

  const body = await response.json();
  if (!body.ok) {
    throw new Error(`Telegram sendMessage failed: ${body.description || "unknown"}`);
  }
}
