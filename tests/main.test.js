import { describe, expect, it } from "vitest";
import { initBlog } from "../assets/js/main.js";

function mountBaseDom() {
  window.history.replaceState({}, "", "/");
  document.body.innerHTML = `
    <p id="tag-summary" hidden></p>
    <section id="timeline"></section>
    <nav id="pagination" hidden>
      <button id="prev-page" type="button">Previous</button>
      <span id="page-indicator"></span>
      <button id="next-page" type="button">Next</button>
    </nav>
  `;
}

describe("initBlog", () => {
  it("renders posts as title, content, then meta with clickable time link", () => {
    mountBaseDom();

    const rawPosts = {
      "2026-03-04": [
        { slug: "a", title: "A", content: "A1\nA2\nA3\nA4\nA5\nA6\nA7", tags: ["life"], created_at: "2026-03-04T09:10:00+08:00" },
        { slug: "b", title: "", content: "B1", tags: ["tech"], created_at: "2026-03-04T10:10:00+08:00" }
      ]
    };

    initBlog(document, rawPosts);
    expect(document.querySelectorAll(".post").length).toBe(2);
    expect(document.querySelectorAll(".post h2").length).toBe(1);
    expect(document.querySelector("#b h2")).toBeNull();
    expect(document.querySelectorAll("#b .tag").length).toBe(1);

    const article = document.querySelector("#a");
    expect(article.lastElementChild.classList.contains("post-meta")).toBe(true);
    expect(article.querySelector(".post-content").textContent).toContain("A1");
    expect(article.querySelector(".read-more-link")).not.toBeNull();
    expect(article.querySelector(".post-time-link").getAttribute("href")).toContain("/post/?slug=a");
  });

  it("hides tags when missing and linkifies content URLs", () => {
    mountBaseDom();

    const rawPosts = {
      "2026-03-06": [
        {
          slug: "c",
          title: "",
          content: "Check https://example.com now",
          tags: [],
          created_at: "2026-03-06T10:10:00+08:00"
        }
      ]
    };

    initBlog(document, rawPosts);
    expect(document.querySelectorAll(".tag").length).toBe(0);

    const link = document.querySelector("#c .post-content a");
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("https://example.com");
  });

  it("filters posts by clicked tag and can clear filter", () => {
    mountBaseDom();
    window.history.replaceState({}, "", "/?from=%2Fpost%2F%3Fslug%3Dp9");

    const rawPosts = {
      "2026-03-06": [
        {
          slug: "p1",
          title: "",
          content: "Post one",
          tags: ["now"],
          created_at: "2026-03-06T10:10:00+08:00"
        },
        {
          slug: "p2",
          title: "",
          content: "Post two",
          tags: ["life"],
          created_at: "2026-03-06T11:10:00+08:00"
        }
      ]
    };

    initBlog(document, rawPosts);
    expect(document.querySelectorAll(".post").length).toBe(2);

    const tagButton = document.querySelector('.tag-button[data-tag="now"]');
    tagButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelectorAll(".post").length).toBe(1);
    expect(document.querySelector(".post").id).toBe("p1");
    expect(document.querySelector("#tag-summary").hidden).toBe(false);
    expect(document.querySelector("#tag-summary").textContent).toContain("#now");
    expect(document.querySelector(".inline-back-link").getAttribute("href")).toBe("/post/?slug=p9");
    expect(document.querySelector(".clear-tag-filter")).toBeNull();
  });

  it("paginates posts with 10 items per page", () => {
    mountBaseDom();

    const posts = [];
    for (let i = 1; i <= 11; i += 1) {
      posts.push({
        slug: `p${i}`,
        title: "",
        content: `Post ${i}`,
        tags: [],
        created_at: `2026-03-06T${String(i % 24).padStart(2, "0")}:00:00+08:00`
      });
    }

    initBlog(document, { "2026-03-06": posts });

    expect(document.querySelectorAll(".post").length).toBe(10);
    expect(document.querySelector("#pagination").hidden).toBe(false);
    expect(document.querySelector("#page-indicator").textContent).toContain("Page 1 / 2");

    document.querySelector("#next-page").dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(document.querySelectorAll(".post").length).toBe(1);
    expect(document.querySelector("#page-indicator").textContent).toContain("Page 2 / 2");
  });
});
