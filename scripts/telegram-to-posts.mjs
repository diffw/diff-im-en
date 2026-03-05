import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  appendPost,
  buildPostFromTelegramMessage,
  ensureUniqueSlug,
  parseTelegramPostText
} from "./telegram-parser.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsPath = path.join(rootDir, "_data", "posts.json");
const statePath = path.join(rootDir, ".bot-state", "telegram-offset.json");

async function readJson(filePath, fallbackValue) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return fallbackValue;
  }
}

async function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getAllExistingSlugs(postsByDate) {
  const slugs = new Set();
  for (const posts of Object.values(postsByDate || {})) {
    for (const post of posts || []) {
      if (post?.slug) {
        slugs.add(post.slug);
      }
    }
  }
  return slugs;
}

async function fetchUpdates(botToken, offset) {
  const url = new URL(`https://api.telegram.org/bot${botToken}/getUpdates`);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("timeout", "0");
  url.searchParams.set("allowed_updates", JSON.stringify(["message"]));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Telegram API error: HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`Telegram API error: ${payload.description || "unknown"}`);
  }

  return payload.result || [];
}

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowedChatIdRaw = process.env.TELEGRAM_ALLOWED_CHAT_ID;

  if (!botToken || !allowedChatIdRaw) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ALLOWED_CHAT_ID.");
  }

  const allowedChatId = String(allowedChatIdRaw).trim();
  const postsByDate = await readJson(postsPath, {});
  const state = await readJson(statePath, { lastUpdateId: 0 });
  const updates = await fetchUpdates(botToken, Number(state.lastUpdateId || 0) + 1);

  if (updates.length === 0) {
    console.log("No Telegram updates.");
    return;
  }

  const existingSlugs = getAllExistingSlugs(postsByDate);
  let highestUpdateId = Number(state.lastUpdateId || 0);
  let publishedCount = 0;

  for (const update of updates) {
    highestUpdateId = Math.max(highestUpdateId, Number(update.update_id || 0));
    const message = update.message;
    if (!message || !message.text || String(message.chat?.id) !== allowedChatId) {
      continue;
    }

    const parsed = parseTelegramPostText(message.text);
    if (!parsed) {
      continue;
    }

    const post = buildPostFromTelegramMessage(message, parsed);
    post.slug = ensureUniqueSlug(existingSlugs, post.slug);
    existingSlugs.add(post.slug);

    appendPost(postsByDate, post);
    publishedCount += 1;
  }

  await writeJson(postsPath, postsByDate);
  await writeJson(statePath, { lastUpdateId: highestUpdateId });

  console.log(`Published ${publishedCount} post(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
