import { describe, expect, it } from "vitest";
import { collectTags, filterPostsByTag, normalizePosts, paginatePosts } from "../assets/js/blog-core.js";

describe("blog-core", () => {
  it("normalizes nested JSON and sorts by created_at desc", () => {
    const raw = {
      "2026-03-03": [{ slug: "a", content: "A", tags: ["生活"], created_at: "2026-03-03T10:00:00+08:00" }],
      "2026-03-04": [{ slug: "b", content: "B", tags: ["技术"], created_at: "2026-03-04T10:00:00+08:00" }]
    };

    const posts = normalizePosts(raw);
    expect(posts.map((p) => p.slug)).toEqual(["b", "a"]);
  });

  it("collects unique tags", () => {
    const tags = collectTags([
      { tags: ["生活", "技术"] },
      { tags: ["技术", "Jekyll"] }
    ]);

    expect(tags).toHaveLength(3);
    expect(tags).toEqual(expect.arrayContaining(["Jekyll", "技术", "生活"]));
  });

  it("filters posts by tag", () => {
    const posts = [
      { slug: "a", tags: ["生活"] },
      { slug: "b", tags: ["技术"] }
    ];

    expect(filterPostsByTag(posts, "生活").map((p) => p.slug)).toEqual(["a"]);
    expect(filterPostsByTag(posts, "all").map((p) => p.slug)).toEqual(["a", "b"]);
  });

  it("paginates posts with safe page bounds", () => {
    const posts = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];
    const page = paginatePosts(posts, 5, 2);

    expect(page.page).toBe(2);
    expect(page.totalPages).toBe(2);
    expect(page.items.map((p) => p.slug)).toEqual(["c"]);
  });
});
