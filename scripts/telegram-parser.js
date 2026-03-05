export function parseTelegramPostText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const lines = text.split("\n").map((line) => line.trim());
  const nonEmptyLines = lines.filter((line) => line.length > 0);
  if (nonEmptyLines.length === 0) {
    return null;
  }

  const isTagLine = (line) => /^\s*(#([\p{L}\p{N}_-]+))(\s*,\s*#([\p{L}\p{N}_-]+))*\s*$/u.test(line);

  let cursor = 0;
  let title = "";
  let tags = [];

  if (nonEmptyLines[cursor].startsWith("#") && !isTagLine(nonEmptyLines[cursor])) {
    title = nonEmptyLines[cursor].replace(/^#+\s*/, "").trim();
    cursor += 1;
  }

  if (cursor < nonEmptyLines.length && isTagLine(nonEmptyLines[cursor])) {
    const tagMatches = [...nonEmptyLines[cursor].matchAll(/#([\p{L}\p{N}_-]+)/gu)];
    tags = [...new Set(tagMatches.map((match) => match[1].toLowerCase()))];
    cursor += 1;
  }

  const content = nonEmptyLines.slice(cursor).join("\n").trim();
  if (content.length === 0) {
    return null;
  }

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
