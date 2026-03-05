import { describe, expect, it } from "vitest";
import { initBlog } from "../assets/js/main.js";

describe("initBlog", () => {
  it("renders timeline and reacts to tag filter", () => {
    document.body.innerHTML = `
      <select id="tag-filter"><option value="all">All</option></select>
      <section id="timeline"></section>
      <button id="prev-page" type="button">Previous</button>
      <span id="page-indicator"></span>
      <button id="next-page" type="button">Next</button>
    `;

    const rawPosts = {
      "2026-03-04": [
        { slug: "a", title: "A", content: "A1", tags: ["life"], created_at: "2026-03-04T09:10:00+08:00" },
        { slug: "b", title: "", content: "B1", tags: ["tech"], created_at: "2026-03-04T10:10:00+08:00" }
      ]
    };

    initBlog(document, rawPosts, { pageSize: 10 });
    expect(document.querySelectorAll(".post").length).toBe(2);
    expect(document.querySelectorAll(".post h2").length).toBe(1);
    expect(document.querySelector("#b h2")).toBeNull();
    expect(document.querySelectorAll("#b .tag").length).toBe(1);

    const tagFilter = document.querySelector("#tag-filter");
    tagFilter.value = "life";
    tagFilter.dispatchEvent(new Event("change"));

    expect(document.querySelectorAll(".post").length).toBe(1);
    expect(document.querySelector(".post").id).toBe("a");
  });

  it("hides tags when missing and linkifies content URLs", () => {
    document.body.innerHTML = `
      <select id="tag-filter"><option value="all">All</option></select>
      <section id="timeline"></section>
      <button id="prev-page" type="button">Previous</button>
      <span id="page-indicator"></span>
      <button id="next-page" type="button">Next</button>
    `;

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

    initBlog(document, rawPosts, { pageSize: 10 });
    expect(document.querySelectorAll(".tag").length).toBe(0);

    const link = document.querySelector("#c .post-content a");
    expect(link).not.toBeNull();
    expect(link.getAttribute("href")).toBe("https://example.com");
  });
});
