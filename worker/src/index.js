function fromBase64(str) {
  const binary = atob(str.replace(/[\n\r]/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function parseTelegramPostText(text) {
  if (!text || typeof text !== "string") return null;

  const lines = text.split("\n");
  let cursor = 0;
  while (cursor < lines.length && lines[cursor].trim().length === 0) cursor++;
  if (cursor >= lines.length) return null;

  const isTagLine = (line) =>
    /^\s*(#([\p{L}\p{N}_-]+))(\s*,\s*#([\p{L}\p{N}_-]+))*\s*$/u.test(line);

  let title = "";
  let tags = [];

  if (lines[cursor].trim().startsWith("#") && !isTagLine(lines[cursor].trim())) {
    title = lines[cursor].trim().replace(/^#+\s*/, "").trim();
    cursor++;
    while (cursor < lines.length && lines[cursor].trim().length === 0) cursor++;
  }

  if (cursor < lines.length && isTagLine(lines[cursor].trim())) {
    tags = [
      ...new Set(
        [...lines[cursor].matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((m) =>
          m[1].toLowerCase()
        )
      ),
    ];
    cursor++;
  }

  const content = lines.slice(cursor).join("\n").trim();
  if (!content) return null;

  return { title, tags, content };
}

function buildPost(message, parsed) {
  const createdAt = new Date(message.date * 1000).toISOString();
  const ts = createdAt.replace(/[-:TZ.]/g, "").slice(0, 14);
  const titleSlug = (parsed.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${ts}-${titleSlug || "post"}`;
  return {
    slug,
    title: parsed.title,
    content: parsed.content,
    tags: parsed.tags,
    created_at: createdAt,
  };
}

async function githubApi(env, path, options = {}) {
  const resp = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    ...options,
    headers: {
      Authorization: `token ${env.GITHUB_PAT}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "diff-im-bot",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`GitHub API ${resp.status}: ${body}`);
  }
  return resp.json();
}

async function updatePostsJson(env, post) {
  const file = await githubApi(env, "/contents/_data/posts.json");
  const postsByDate = JSON.parse(fromBase64(file.content));

  const dateKey = post.created_at.slice(0, 10);
  const existing = postsByDate[dateKey] || [];

  if (existing.some((p) => p.slug === post.slug)) {
    return false;
  }

  postsByDate[dateKey] = [post, ...existing];

  const updatedContent = toBase64(JSON.stringify(postsByDate, null, 2) + "\n");

  await githubApi(env, "/contents/_data/posts.json", {
    method: "PUT",
    body: JSON.stringify({
      message: `New post: ${post.slug}`,
      content: updatedContent,
      sha: file.sha,
      committer: { name: "telegram-bot", email: "bot@diff.im" },
    }),
  });

  return true;
}

async function sendTelegramReply(env, chatId, messageId, post) {
  const title = post.title?.trim() || "(no title)";
  const text = `Published successfully\nSlug: ${post.slug}\nTitle: ${title}`;
  await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_to_message_id: messageId,
      }),
    }
  );
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK", { status: 200 });
    }

    const secretToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (env.WEBHOOK_SECRET && secretToken !== env.WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 403 });
    }

    try {
      const update = await request.json();
      const message = update.message;
      if (!message?.text) return new Response("OK", { status: 200 });

      if (String(message.chat.id) !== env.TELEGRAM_ALLOWED_CHAT_ID) {
        return new Response("OK", { status: 200 });
      }

      const parsed = parseTelegramPostText(message.text);
      if (!parsed) return new Response("OK", { status: 200 });

      const post = buildPost(message, parsed);
      const added = await updatePostsJson(env, post);

      if (added) {
        await sendTelegramReply(env, message.chat.id, message.message_id, post);
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Worker error:", err);
      return new Response("Error", { status: 500 });
    }
  },
};
