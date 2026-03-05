export function normalizePosts(rawPosts) {
  const allPosts = [];

  for (const [dateKey, posts] of Object.entries(rawPosts || {})) {
    for (const post of posts || []) {
      allPosts.push({
        slug: post.slug || `${dateKey}-${allPosts.length + 1}`,
        title: post.title || "",
        content: post.content || "",
        tags: Array.isArray(post.tags) ? post.tags : [],
        created_at: post.created_at || `${dateKey}T00:00:00+08:00`
      });
    }
  }

  return allPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function collectTags(posts) {
  return [...new Set(posts.flatMap((post) => post.tags || []))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export function filterPostsByTag(posts, tag) {
  if (!tag || tag === "all") {
    return posts;
  }

  return posts.filter((post) => (post.tags || []).includes(tag));
}

export function paginatePosts(posts, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: posts.slice(start, end),
    page: safePage,
    totalPages
  };
}
