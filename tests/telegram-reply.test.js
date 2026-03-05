import { describe, expect, it, vi } from "vitest";
import { buildPublishSuccessMessage, sendPublishSuccessReply } from "../scripts/telegram-reply.js";

describe("telegram-reply", () => {
  it("builds a success message with title", () => {
    const text = buildPublishSuccessMessage({
      slug: "20260305-my-title",
      title: "My Title"
    });

    expect(text).toContain("Published successfully");
    expect(text).toContain("Slug: 20260305-my-title");
    expect(text).toContain("Title: My Title");
  });

  it("uses no-title fallback in success message", () => {
    const text = buildPublishSuccessMessage({
      slug: "20260305-post",
      title: ""
    });

    expect(text).toContain("Title: (no title)");
  });

  it("sends a Telegram reply via sendMessage", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true })
    });

    await sendPublishSuccessReply(fetchMock, "bot-token", {
      chatId: 123,
      replyToMessageId: 45,
      post: { slug: "abc", title: "Done" }
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/botbot-token/sendMessage");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toMatchObject({
      chat_id: 123,
      reply_to_message_id: 45
    });
  });
});
