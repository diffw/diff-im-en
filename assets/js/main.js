import { collectTags, filterPostsByTag, normalizePosts, paginatePosts } from "./blog-core.js";

function escapeHtml(input) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatContentWithLinks(content) {
  const escaped = escapeHtml(content);
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return linked.replaceAll("\n", "<br>");
}

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

      const hasTitle = post.title && post.title.trim() !== "";
      const tags = (post.tags || []).map((tag) => `<span class="tag">#${tag}</span>`).join(" ");
      const titleHtml = hasTitle ? `<h2>${post.title}</h2>` : "";
      const tagsHtml = tags ? `<span>${tags}</span>` : "";
      const formattedContent = formatContentWithLinks(post.content || "");

      article.innerHTML = `
        ${titleHtml}
        <div class="post-meta">
          <time datetime="${post.created_at}">${new Date(post.created_at).toLocaleString("en-US")}</time>
          ${tagsHtml}
        </div>
        <p class="post-content">${formattedContent}</p>
      `;
      timeline.appendChild(article);
    }

    pageIndicator.textContent = `Page ${state.page} / ${paged.totalPages}`;
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
