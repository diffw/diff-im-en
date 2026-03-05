import { collectTags, filterPostsByTag, normalizePosts, paginatePosts } from "./blog-core.js";

export function initBlog(doc, rawPosts, config = {}) {
  const timeline = doc.querySelector("#timeline");
  const tagFilter = doc.querySelector("#tag-filter");
  const prevButton = doc.querySelector("#prev-page");
  const nextButton = doc.querySelector("#next-page");
  const pageIndicator = doc.querySelector("#page-indicator");
  const pageSize = config.pageSize || 5;

  const allPosts = normalizePosts(rawPosts);
  const allTags = collectTags(allPosts);
  const state = { tag: "all", page: 1 };

  for (const tag of allTags) {
    const option = doc.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  }

  const render = () => {
    const filtered = filterPostsByTag(allPosts, state.tag);
    const paged = paginatePosts(filtered, state.page, pageSize);
    state.page = paged.page;

    timeline.innerHTML = "";
    for (const post of paged.items) {
      const article = doc.createElement("article");
      article.className = "post";
      article.id = post.slug;

      const title = post.title && post.title.trim() !== "" ? post.title : post.content.slice(0, 18);
      const tags = (post.tags || []).map((tag) => `<span class="tag">#${tag}</span>`).join(" ");

      article.innerHTML = `
        <h2>${title}</h2>
        <div class="post-meta">
          <time datetime="${post.created_at}">${new Date(post.created_at).toLocaleString("zh-CN")}</time>
          <span>${tags}</span>
        </div>
        <p class="post-content">${post.content}</p>
      `;
      timeline.appendChild(article);
    }

    pageIndicator.textContent = `第 ${state.page} / ${paged.totalPages} 页`;
    prevButton.disabled = state.page <= 1;
    nextButton.disabled = state.page >= paged.totalPages;
  };

  tagFilter.addEventListener("change", () => {
    state.tag = tagFilter.value;
    state.page = 1;
    render();
  });

  prevButton.addEventListener("click", () => {
    state.page -= 1;
    render();
  });

  nextButton.addEventListener("click", () => {
    state.page += 1;
    render();
  });

  render();
}

if (typeof document !== "undefined") {
  const hasRequiredNodes =
    document.querySelector("#timeline") &&
    document.querySelector("#tag-filter") &&
    document.querySelector("#prev-page") &&
    document.querySelector("#next-page") &&
    document.querySelector("#page-indicator");

  if (hasRequiredNodes) {
    initBlog(document, window.BLOG_POSTS || {}, window.BLOG_CONFIG || {});
  }
}
