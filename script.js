const postContainer = document.querySelector("#posts");
const topicList = document.querySelector("#topicList");
const searchInput = document.querySelector("#searchInput");
const postCount = document.querySelector("#postCount");
const topicCount = document.querySelector("#topicCount");
const dialog = document.querySelector("#postDialog");
const dialogMeta = document.querySelector("#dialogMeta");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogBody = document.querySelector("#dialogBody");
const closeDialog = document.querySelector("#closeDialog");
const themeToggle = document.querySelector("#themeToggle");

let posts = [];
let activeTopic = "All";

const fallbackPosts = [
  {
    title: "Welcome to djay Blogs",
    topic: "Notes",
    date: "2026-05-11",
    readTime: "2 min read",
    excerpt:
      "This is the first post in a personal corner of the web built for clear thinking and honest writing.",
    content:
      "This space is ready for your thoughts. Replace the sample posts in posts.json with your own essays, notes, tutorials, or reflections. Keep the writing direct, human, and useful.",
  },
  {
    title: "The Small Habit of Writing",
    topic: "Life",
    date: "2026-05-10",
    readTime: "3 min read",
    excerpt:
      "A tiny writing practice can become a reliable way to notice what matters before it disappears.",
    content:
      "Writing does not need a perfect desk or a perfect mood. It needs a place to land. A blog gives your ideas a little gravity, and gravity is often enough to turn a passing thought into something real.",
  },
  {
    title: "Why Own Your Words",
    topic: "Web",
    date: "2026-05-09",
    readTime: "4 min read",
    excerpt:
      "Social platforms are rented rooms. A personal site is a place with your name on the door.",
    content:
      "Publishing on your own site means your work has a stable address. You can still share links anywhere, but the original home remains yours. That is simple, practical, and quietly powerful.",
  },
];

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function allPosts() {
  return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getTopics(items) {
  return ["All", ...new Set(items.map((post) => post.topic))];
}

function renderTopics(items) {
  const topics = getTopics(items);
  topicList.innerHTML = topics
    .map(
      (topic) =>
        `<button class="topic-chip ${topic === activeTopic ? "active" : ""}" type="button" data-topic="${topic}">${topic}</button>`,
    )
    .join("");
  topicCount.textContent = topics.length - 1;
}

function renderPosts() {
  const query = searchInput.value.trim().toLowerCase();
  const items = allPosts();
  const filtered = items.filter((post) => {
    const matchesTopic = activeTopic === "All" || post.topic === activeTopic;
    const searchable = `${post.title} ${post.topic} ${post.excerpt} ${post.content}`.toLowerCase();
    return matchesTopic && searchable.includes(query);
  });

  postCount.textContent = items.length;
  renderTopics(items);

  if (!filtered.length) {
    postContainer.innerHTML = `<div class="empty-state">No posts found. Try another topic or search term.</div>`;
    return;
  }

  postContainer.innerHTML = filtered
    .map(
      (post, index) => `
        <article class="post-card" tabindex="0" role="button" data-index="${index}">
          <div>
            <div class="post-meta">
              <span>${post.topic}</span>
              <span>${formatDate(post.date)}</span>
              <span>${post.readTime || "Post"}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
          </div>
          <span class="read-arrow" aria-hidden="true">-&gt;</span>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll(".post-card").forEach((card, index) => {
    const open = () => openPost(filtered[index]);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function openPost(post) {
  dialogMeta.textContent = `${post.topic} / ${formatDate(post.date)} / ${post.readTime || "Post"}`;
  dialogTitle.textContent = post.title;
  dialogBody.innerHTML = post.content
    .split("\n")
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
  dialog.showModal();
}

async function loadPosts() {
  try {
    const response = await fetch("posts.json", { cache: "no-store" });
    posts = response.ok ? await response.json() : fallbackPosts;
  } catch {
    posts = fallbackPosts;
  }
  renderPosts();
}

topicList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-topic]");
  if (!button) return;
  activeTopic = button.dataset.topic;
  renderPosts();
});

searchInput.addEventListener("input", renderPosts);

closeDialog.addEventListener("click", () => dialog.close());

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("djayTheme", nextTheme);
});

document.querySelector("#year").textContent = new Date().getFullYear();
document.documentElement.dataset.theme = localStorage.getItem("djayTheme") || "light";
loadPosts();
