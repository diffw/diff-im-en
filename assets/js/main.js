import { normalizePosts } from "./blog-core.js";

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

export function initBlog(doc, rawPosts) {
  const timeline = doc.querySelector("#timeline");
  if (!timeline) {
    return;
  }

  const allPosts = normalizePosts(rawPosts);

  const render = () => {
    timeline.innerHTML = "";
    for (const post of allPosts) {
      const article = doc.createElement("article");
      article.className = "post";
      article.id = post.slug;

      const hasTitle = post.title && post.title.trim() !== "";
      const tags = (post.tags || []).map((tag) => `<span class="tag">#${tag}</span>`).join(" ");
      const titleHtml = hasTitle ? `<h2>${post.title}</h2>` : "";
      const tagsHtml = tags ? `<span>${tags}</span>` : "";
      const formattedContent = formatContentWithLinks(post.content || "");
      const formattedDate = new Date(post.created_at).toLocaleString("en-US");

      article.innerHTML = `
        ${titleHtml}
        <p class="post-content">${formattedContent}</p>
        <div class="post-meta">
          <time datetime="${post.created_at}">${formattedDate}</time>
          ${tagsHtml}
        </div>
      `;
      timeline.appendChild(article);
    }
  };

  render();
}

if (typeof document !== "undefined") {
  if (document.querySelector("#timeline")) {
    initBlog(document, window.BLOG_POSTS || {});
  }
}
