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

  it("supports plain text as content with optional title and tags", () => {
    expect(parseTelegramPostText("just text")).toEqual({
      title: "",
      tags: [],
      content: "just text"
    });

    expect(parseTelegramPostText(`# Title
Body`)).toEqual({
      title: "Title",
      tags: [],
      content: "Body"
    });

    expect(parseTelegramPostText(`#tag1
Body only`)).toEqual({
      title: "",
      tags: ["tag1"],
      content: "Body only"
    });
  });

  it("parses title/tags/content in any order", () => {
    expect(parseTelegramPostText(`content first
# Title later
#AI #Design`)).toEqual({
      title: "Title later",
      tags: ["ai", "design"],
      content: "content first"
    });

    expect(parseTelegramPostText(`#AI #Design
# Title
content`)).toEqual({
      title: "Title",
      tags: ["ai", "design"],
      content: "content"
    });

    expect(parseTelegramPostText(`# Title
content
#AI, #Design`)).toEqual({
      title: "Title",
      tags: ["ai", "design"],
      content: "content"
    });
  });

  it("preserves line breaks in content", () => {
    const parsed = parseTelegramPostText("First paragraph\n\nSecond paragraph\nthird line");
    expect(parsed.content).toBe("First paragraph\n\nSecond paragraph\nthird line");

    const withHeader = parseTelegramPostText("# Title\n#tag1\n\nPara one\n\nPara two");
    expect(withHeader.content).toBe("Para one\n\nPara two");
  });

  it("rejects empty or content-less messages", () => {
    expect(parseTelegramPostText("")).toBeNull();
    expect(parseTelegramPostText(`# Title
#tag1`)).toBeNull();
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
