import { describe, expect, it } from "vitest";
import { initPostPage } from "../assets/js/post.js";

describe("initPostPage", () => {
  it("renders detail post by slug", () => {
    window.history.replaceState({}, "", "/post/?slug=a&from=%2F%3Ftag%3Dlife");
    document.body.innerHTML = `
      <a id="back-link" href="/">Back</a>
      <section id="post-detail"></section>
    `;
    window.BLOG_HOME_PATH = "/";

    const rawPosts = {
      "2026-03-06": [
        {
          slug: "a",
          title: "Hello",
          content: "Body line",
          tags: ["life"],
          created_at: "2026-03-06T10:10:00+08:00"
        }
      ]
    };

    initPostPage(document, rawPosts);

    expect(document.querySelector("#post-detail .post")).not.toBeNull();
    expect(document.querySelector("#post-detail h2").textContent).toBe("Hello");
    expect(document.querySelector("#back-link").getAttribute("href")).toBe("/?tag=life");
    const tagHref = document.querySelector("#post-detail .tag-link").getAttribute("href");
    expect(tagHref).toContain("/?tag=life&from=");
  });

  it("shows empty state when slug is missing", () => {
    window.history.replaceState({}, "", "/post/");
    document.body.innerHTML = `<section id="post-detail"></section>`;

    initPostPage(document, {});

    expect(document.querySelector("#post-detail").textContent).toContain("Post not found.");
  });
});
