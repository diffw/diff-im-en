import { normalizePosts } from "./blog-core.js";

function escapeHtml(input) {
  return String(input || "")
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

function getSlug(doc) {
  const location = doc.defaultView?.location;
  if (!location) {
    return "";
  }

  return new URLSearchParams(location.search).get("slug") || "";
}

export function initPostPage(doc, rawPosts) {
  const detail = doc.querySelector("#post-detail");
  if (!detail) {
    return;
  }

  const slug = getSlug(doc);
  if (!slug) {
    detail.innerHTML = `<p class="empty-state">Post not found.</p>`;
    return;
  }

  const posts = normalizePosts(rawPosts);
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    detail.innerHTML = `<p class="empty-state">Post not found.</p>`;
    return;
  }

  const homePath = doc.defaultView?.BLOG_HOME_PATH || "/";
  const hasTitle = post.title && post.title.trim() !== "";
  const titleHtml = hasTitle ? `<h2>${escapeHtml(post.title)}</h2>` : "";
  const tags = (post.tags || [])
    .map((tag) => `<a class="tag tag-link" href="${homePath}?tag=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`)
    .join(" ");
  const tagsHtml = tags ? `<span>${tags}</span>` : "";
  const formattedDate = new Date(post.created_at).toLocaleString("en-US");
  const content = formatContentWithLinks(post.content || "");

  detail.innerHTML = `
    <article class="post post-detail">
      ${titleHtml}
      <p class="post-content">${content}</p>
      <div class="post-meta">
        <time datetime="${post.created_at}">${formattedDate}</time>
        ${tagsHtml}
      </div>
    </article>
  `;
}

if (typeof document !== "undefined") {
  if (document.querySelector("#post-detail")) {
    initPostPage(document, window.BLOG_POSTS || {});
  }
}
