export function parseTelegramPostText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const lines = text.split("\n");
  if (lines.length < 3) {
    return null;
  }

  const titleLine = (lines[0] || "").trim();
  const tagLine = (lines[1] || "").trim();
  const content = lines.slice(2).join("\n").trim();

  if (!titleLine.startsWith("#") || content.length === 0) {
    return null;
  }

  const title = titleLine.replace(/^#+\s*/, "").trim();
  if (title.length === 0) {
    return null;
  }

  const tagMatches = [...tagLine.matchAll(/#([\p{L}\p{N}_-]+)/gu)];
  if (tagMatches.length === 0) {
    return null;
  }

  const tags = [...new Set(tagMatches.map((match) => match[1].toLowerCase()))];

  return { title, tags, content };
}

export function slugify(input) {
  const normalized = (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "post";
}

export function ensureUniqueSlug(existingSlugs, proposedSlug) {
  if (!existingSlugs.has(proposedSlug)) {
    return proposedSlug;
  }

  let index = 2;
  while (existingSlugs.has(`${proposedSlug}-${index}`)) {
    index += 1;
  }

  return `${proposedSlug}-${index}`;
}

export function buildPostFromTelegramMessage(message, parsed) {
  const createdAt = new Date(message.date * 1000).toISOString();
  const timestampSlug = createdAt.replace(/[-:TZ.]/g, "").slice(0, 14);
  const baseSlug = `${timestampSlug}-${slugify(parsed.title)}`;

  return {
    slug: baseSlug,
    title: parsed.title,
    content: parsed.content,
    tags: parsed.tags,
    created_at: createdAt
  };
}

export function appendPost(postsByDate, post) {
  const dateKey = post.created_at.slice(0, 10);
  const existing = postsByDate[dateKey] || [];
  postsByDate[dateKey] = [post, ...existing];
}
