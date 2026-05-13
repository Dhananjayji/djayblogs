# djay Blogs

A simple personal blog website hosted with GitHub Pages.

## Post From The Website

Open the website and click **Admin**.

Use:

```text
Admin ID: djay
GitHub token: your personal access token
```

The token must have **Contents: Read and write** access for the `Dhananjayji/djayblogs` repository. It is stored only in your browser.

## Add Or Edit Posts

Open `posts.json` and edit the posts.

Example:

```json
{
  "title": "Your Post Title",
  "topic": "Notes",
  "date": "2026-05-12",
  "readTime": "3 min read",
  "excerpt": "A short summary shown on the homepage.",
  "content": "Your full blog post. Use \\n\\n for new paragraphs."
}
```

Publish changes:

```bash
git add posts.json
git commit -m "update blog posts"
git push origin main
git push origin main:gh-pages --force
```

Live site:

```text
https://dhananjayji.github.io/djayblogs/
```
