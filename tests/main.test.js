import { describe, expect, it } from "vitest";
import { initBlog } from "../assets/js/main.js";

describe("initBlog", () => {
  it("renders timeline and reacts to tag filter", () => {
    document.body.innerHTML = `
      <select id="tag-filter"><option value="all">全部</option></select>
      <section id="timeline"></section>
      <button id="prev-page" type="button">上一页</button>
      <span id="page-indicator"></span>
      <button id="next-page" type="button">下一页</button>
    `;

    const rawPosts = {
      "2026-03-04": [
        { slug: "a", title: "A", content: "A1", tags: ["生活"], created_at: "2026-03-04T09:10:00+08:00" },
        { slug: "b", title: "B", content: "B1", tags: ["技术"], created_at: "2026-03-04T10:10:00+08:00" }
      ]
    };

    initBlog(document, rawPosts, { pageSize: 10 });
    expect(document.querySelectorAll(".post").length).toBe(2);

    const tagFilter = document.querySelector("#tag-filter");
    tagFilter.value = "生活";
    tagFilter.dispatchEvent(new Event("change"));

    expect(document.querySelectorAll(".post").length).toBe(1);
    expect(document.querySelector(".post").id).toBe("a");
  });
});
