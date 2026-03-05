# Jelly2 Blog (Jekyll + JSON)

This is a short-form blog template built with Jekyll. All posts are stored in one JSON file, with timeline rendering, tag filtering, pagination, RSS, dark mode, and deployment through GitHub Actions to GitHub Pages.

## Project Structure

- `_data/posts.json`: single content source (nested by date)
- `index.html`: homepage timeline
- `feed.xml`: RSS output
- `assets/js/`: frontend filtering and pagination logic
- `.github/workflows/deploy.yml`: automatic Pages deployment

## Run Locally

```bash
bundle install
bundle exec jekyll serve
```

## Test

```bash
npm install
npx vitest run
```

## Content Format (`_data/posts.json`)

```json
{
  "2026-03-04": [
    {
      "slug": "unique-id",
      "title": "Optional title",
      "content": "Post content",
      "tags": ["tag1", "tag2"],
      "created_at": "2026-03-04T09:10:00+08:00"
    }
  ]
}
```

## Publish to GitHub Pages

1. Update `url` in `_config.yml` to your domain (for example `https://<username>.github.io`).
2. Push to the `main` branch of your GitHub repository.
3. In repository `Settings -> Pages`, set Source to `GitHub Actions`.

## Post from Telegram (Auto)

This repo supports automatic posting from Telegram every few minutes.

### 1) Create bot secrets in GitHub

In `Settings -> Secrets and variables -> Actions`, add:

- `TELEGRAM_BOT_TOKEN`: your BotFather token
- `TELEGRAM_ALLOWED_CHAT_ID`: your personal chat ID (only this chat can publish)

### 2) Message format

Telegram now supports flexible plain-text input:

```text
# Title
#tag1, #tag2
Post content lines...
```

Rules:

- `title` is optional. If omitted, no title is shown on the page.
- `tags` are optional. No tags line means no tags shown. One tag is also supported.
- If you send only one plain text line, it is treated as the post content.
- URLs in content are auto-converted into clickable links.

### 3) How publishing works

- Workflow file: `.github/workflows/telegram-publish.yml`
- Runs every 5 minutes (and supports manual dispatch).
- Reads Telegram updates, appends new entries into `_data/posts.json`.
- Commits updates automatically to `main`, which triggers Pages deployment.
