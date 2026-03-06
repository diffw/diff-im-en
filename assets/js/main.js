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

function getInitialTag(doc) {
  const location = doc.defaultView?.location;
  if (!location) {
    return "";
  }

  const value = new URLSearchParams(location.search).get("tag");
  return value ? value.trim() : "";
}

function setTagInUrl(doc, tag) {
  const win = doc.defaultView;
  if (!win?.history?.replaceState || !win.location) {
    return;
  }

  const url = new URL(win.location.href);
  if (tag) {
    url.searchParams.set("tag", tag);
  } else {
    url.searchParams.delete("tag");
  }
  win.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function filterPostsByTag(posts, activeTag) {
  if (!activeTag) {
    return posts;
  }

  const normalizedTag = activeTag.toLowerCase();
  return posts.filter((post) =>
    (post.tags || []).some((tag) => String(tag).toLowerCase() === normalizedTag)
  );
}

export function initBlog(doc, rawPosts) {
  const timeline = doc.querySelector("#timeline");
  const tagSummary = doc.querySelector("#tag-summary");
  if (!timeline) {
    return;
  }

  const allPosts = normalizePosts(rawPosts);
  const state = { tag: getInitialTag(doc) };

  const render = () => {
    const visiblePosts = filterPostsByTag(allPosts, state.tag);

    if (tagSummary) {
      if (state.tag) {
        tagSummary.hidden = false;
        tagSummary.innerHTML = `
          Showing posts tagged <strong>#${escapeHtml(state.tag)}</strong> (${visiblePosts.length})
          <button type="button" class="clear-tag-filter">Clear</button>
        `;
      } else {
        tagSummary.hidden = true;
        tagSummary.innerHTML = "";
      }
    }

    timeline.innerHTML = "";
    if (visiblePosts.length === 0) {
      timeline.innerHTML = `<p class="empty-state">No posts under #${escapeHtml(state.tag)}.</p>`;
      return;
    }

    for (const post of visiblePosts) {
      const article = doc.createElement("article");
      article.className = "post";
      article.id = post.slug;

      const hasTitle = post.title && post.title.trim() !== "";
      const tags = (post.tags || [])
        .map(
          (tag) =>
            `<button type="button" class="tag tag-button" data-tag="${encodeURIComponent(tag)}">#${escapeHtml(tag)}</button>`
        )
        .join(" ");
      const titleHtml = hasTitle ? `<h2>${escapeHtml(post.title)}</h2>` : "";
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

  timeline.addEventListener("click", (event) => {
    const target = event.target.closest(".tag-button");
    if (!target) {
      return;
    }
    const rawTag = target.getAttribute("data-tag") || "";
    state.tag = decodeURIComponent(rawTag);
    setTagInUrl(doc, state.tag);
    render();
  });

  if (tagSummary) {
    tagSummary.addEventListener("click", (event) => {
      const clearButton = event.target.closest(".clear-tag-filter");
      if (!clearButton) {
        return;
      }
      state.tag = "";
      setTagInUrl(doc, "");
      render();
    });
  }

  render();
}

if (typeof document !== "undefined") {
  if (document.querySelector("#timeline")) {
    initBlog(document, window.BLOG_POSTS || {});
  }
}
