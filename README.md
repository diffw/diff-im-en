# Jelly2 Blog (Jekyll + JSON)

这是一个基于 Jekyll 的短内容博客模板：内容统一放在一个 JSON 文件，支持时间流、标签筛选、分页、RSS、深色模式，并通过 GitHub Actions 部署到 GitHub Pages。

## 目录说明

- `_data/posts.json`: 唯一内容源（按日期嵌套）
- `index.html`: 首页时间流
- `feed.xml`: RSS 输出
- `assets/js/`: 前端筛选和分页逻辑
- `.github/workflows/deploy.yml`: 自动部署到 Pages

## 本地运行

```bash
bundle install
bundle exec jekyll serve
```

## 测试

```bash
npm install
npx vitest run
```

## 内容格式（`_data/posts.json`）

```json
{
  "2026-03-04": [
    {
      "slug": "unique-id",
      "title": "标题（可选）",
      "content": "正文",
      "tags": ["标签1", "标签2"],
      "created_at": "2026-03-04T09:10:00+08:00"
    }
  ]
}
```

## 发布到 GitHub Pages

1. 把 `_config.yml` 中 `url` 改成你的域名（例如 `https://<用户名>.github.io`）。
2. 推送到 GitHub 仓库 `main` 分支。
3. 在仓库 `Settings -> Pages` 中将 Source 设为 `GitHub Actions`。
