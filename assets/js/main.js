import { normalizePosts, paginatePosts } from "./blog-core.js";

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

const PAGE_SIZE = 10;

function getInitialTag(doc) {
  const location = doc.defaultView?.location;
  if (!location) {
    return "";
  }

  const value = new URLSearchParams(location.search).get("tag");
  return value ? value.trim() : "";
}

function getInitialPage(doc) {
  const location = doc.defaultView?.location;
  if (!location) {
    return 1;
  }

  const rawValue = new URLSearchParams(location.search).get("page");
  const value = Number.parseInt(rawValue || "1", 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function setStateInUrl(doc, tag, page) {
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
  if (page > 1) {
    url.searchParams.set("page", String(page));
  } else {
    url.searchParams.delete("page");
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

function shouldShowReadMore(content) {
  const text = String(content || "");
  const lineCount = text.split(/\r?\n/).length;
  return lineCount > 6 || text.length > 360;
}

function isPreviewTruncated(previewElement, content) {
  if (!previewElement) {
    return false;
  }

  if (previewElement.scrollHeight > 0 || previewElement.clientHeight > 0) {
    return previewElement.scrollHeight - previewElement.clientHeight > 1;
  }

  return shouldShowReadMore(content);
}

export function initBlog(doc, rawPosts) {
  const timeline = doc.querySelector("#timeline");
  const tagSummary = doc.querySelector("#tag-summary");
  const prevButton = doc.querySelector("#prev-page");
  const nextButton = doc.querySelector("#next-page");
  const pageIndicator = doc.querySelector("#page-indicator");
  const pagination = doc.querySelector("#pagination");
  if (!timeline) {
    return;
  }

  const allPosts = normalizePosts(rawPosts);
  const state = { tag: getInitialTag(doc), page: getInitialPage(doc) };
  const postDetailPath = doc.defaultView?.BLOG_POST_DETAIL_PATH || "/post/";

  const render = () => {
    const filteredPosts = filterPostsByTag(allPosts, state.tag);
    const paged = paginatePosts(filteredPosts, state.page, PAGE_SIZE);
    state.page = paged.page;

    setStateInUrl(doc, state.tag, state.page);

    if (tagSummary) {
      if (state.tag) {
        tagSummary.hidden = false;
        tagSummary.innerHTML = `
          Showing posts tagged <strong>#${escapeHtml(state.tag)}</strong> (${filteredPosts.length})
          <button type="button" class="clear-tag-filter">Clear</button>
        `;
      } else {
        tagSummary.hidden = true;
        tagSummary.innerHTML = "";
      }
    }

    if (pagination && prevButton && nextButton && pageIndicator) {
      pagination.hidden = paged.totalPages <= 1;
      prevButton.disabled = state.page <= 1;
      nextButton.disabled = state.page >= paged.totalPages;
      pageIndicator.textContent = `Page ${state.page} / ${paged.totalPages}`;
    }

    timeline.innerHTML = "";
    if (filteredPosts.length === 0) {
      timeline.innerHTML = `<p class="empty-state">No posts under #${escapeHtml(state.tag)}.</p>`;
      return;
    }

    for (const post of paged.items) {
      const article = doc.createElement("article");
      article.className = "post";
      article.id = post.slug;
      const detailUrl = `${postDetailPath}?slug=${encodeURIComponent(post.slug)}`;

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
      const readMoreHtml = `<p class="post-more" hidden><span class="content-ellipsis">...</span> <a class="read-more-link" href="${detailUrl}">Read More</a></p>`;

      article.innerHTML = `
        ${titleHtml}
        <p class="post-content post-content-preview">${formattedContent}</p>
        ${readMoreHtml}
        <div class="post-meta">
          <a class="post-time-link" href="${detailUrl}">
            <time datetime="${post.created_at}">${formattedDate}</time>
          </a>
          ${tagsHtml}
        </div>
      `;
      timeline.appendChild(article);

      const previewElement = article.querySelector(".post-content-preview");
      const readMoreElement = article.querySelector(".post-more");
      if (readMoreElement && isPreviewTruncated(previewElement, post.content || "")) {
        readMoreElement.hidden = false;
      }
    }
  };

  timeline.addEventListener("click", (event) => {
    const target = event.target.closest(".tag-button");
    if (!target) {
      return;
    }
    const rawTag = target.getAttribute("data-tag") || "";
    state.tag = decodeURIComponent(rawTag);
    state.page = 1;
    render();
  });

  if (tagSummary) {
    tagSummary.addEventListener("click", (event) => {
      const clearButton = event.target.closest(".clear-tag-filter");
      if (!clearButton) {
        return;
      }
      state.tag = "";
      state.page = 1;
      render();
    });
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (state.page > 1) {
        state.page -= 1;
        render();
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      state.page += 1;
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
