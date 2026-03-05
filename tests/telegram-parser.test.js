import { describe, expect, it } from "vitest";
import {
  appendPost,
  buildPostFromTelegramMessage,
  ensureUniqueSlug,
  parseTelegramPostText,
  slugify
} from "../scripts/telegram-parser.js";

describe("telegram-parser", () => {
  it("parses title, tags, and content from Telegram text", () => {
    const parsed = parseTelegramPostText(`# My Title
#tag1, #Tag2
Hello world
Second line`);

    expect(parsed).toEqual({
      title: "My Title",
      tags: ["tag1", "tag2"],
      content: "Hello world\nSecond line"
    });
  });

  it("rejects malformed Telegram messages", () => {
    expect(parseTelegramPostText("just text")).toBeNull();
    expect(parseTelegramPostText(`# Title
No hashtags
Body`)).toBeNull();
    expect(parseTelegramPostText(`#  
#tag
Body`)).toBeNull();
  });

  it("slugifies and deduplicates slugs", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(ensureUniqueSlug(new Set(["abc"]), "abc")).toBe("abc-2");
    expect(ensureUniqueSlug(new Set(["abc", "abc-2"]), "abc")).toBe("abc-3");
  });

  it("builds post payload and appends by date key", () => {
    const parsed = {
      title: "My Title",
      tags: ["tag1"],
      content: "Body"
    };
    const message = { date: 1700000000 };
    const post = buildPostFromTelegramMessage(message, parsed);

    expect(post.slug).toContain("my-title");
    expect(post.created_at).toBe("2023-11-14T22:13:20.000Z");

    const postsByDate = {};
    appendPost(postsByDate, post);
    expect(postsByDate["2023-11-14"][0].title).toBe("My Title");
  });
});
