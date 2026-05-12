const owner = "Dhananjayji";
const repo = "djayblogs";
const branch = "gh-pages";
const postsPath = "posts.json";
const adminUser = "djay";

const tokenForm = document.querySelector("#tokenForm");
const adminIdInput = document.querySelector("#adminId");
const tokenInput = document.querySelector("#githubToken");
const forgetToken = document.querySelector("#forgetToken");
const adminPosts = document.querySelector("#adminPosts");
const postForm = document.querySelector("#postForm");
const editorTitle = document.querySelector("#editorTitle");
const adminStatus = document.querySelector("#adminStatus");
const newPost = document.querySelector("#newPost");
const deletePost = document.querySelector("#deletePost");

const fields = {
  title: document.querySelector("#postTitle"),
  topic: document.querySelector("#postTopic"),
  date: document.querySelector("#postDate"),
  readTime: document.querySelector("#postReadTime"),
  excerpt: document.querySelector("#postExcerpt"),
  content: document.querySelector("#postContent"),
};

let posts = [];
let fileSha = "";
let selectedIndex = -1;

function getToken() {
  return localStorage.getItem("djayGithubToken") || "";
}

function setStatus(message, isError = false) {
  adminStatus.textContent = message;
  adminStatus.dataset.state = isError ? "error" : "ok";
}

function apiHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function encodeBase64(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeBase64(value) {
  return decodeURIComponent(escape(atob(value.replace(/\n/g, ""))));
}

async function githubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...apiHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `GitHub returned ${response.status}`);
  }

  return response.json();
}

async function loadPostsFromGitHub() {
  setStatus("Loading posts...");
  const data = await githubRequest(
    `https://api.github.com/repos/${owner}/${repo}/contents/${postsPath}?ref=${branch}`,
  );
  fileSha = data.sha;
  posts = JSON.parse(decodeBase64(data.content));
  renderPostList();
  clearForm();
  setStatus("Connected. Choose a post or create a new one.");
}

function renderPostList() {
  if (!posts.length) {
    adminPosts.innerHTML = `<p class="admin-help">No posts yet.</p>`;
    return;
  }

  adminPosts.innerHTML = posts
    .map(
      (post, index) => `
        <button class="admin-post-button ${index === selectedIndex ? "active" : ""}" type="button" data-index="${index}">
          <strong>${post.title}</strong>
          <span>${post.topic} / ${post.date}</span>
        </button>
      `,
    )
    .join("");
}

function clearForm() {
  selectedIndex = -1;
  editorTitle.textContent = "New post";
  postForm.reset();
  fields.date.value = new Date().toISOString().slice(0, 10);
  fields.readTime.value = "3 min read";
  deletePost.disabled = true;
  renderPostList();
}

function selectPost(index) {
  selectedIndex = index;
  const post = posts[index];
  editorTitle.textContent = "Edit post";
  fields.title.value = post.title || "";
  fields.topic.value = post.topic || "";
  fields.date.value = post.date || new Date().toISOString().slice(0, 10);
  fields.readTime.value = post.readTime || "3 min read";
  fields.excerpt.value = post.excerpt || "";
  fields.content.value = post.content || "";
  deletePost.disabled = false;
  renderPostList();
}

function readForm() {
  return {
    title: fields.title.value.trim(),
    topic: fields.topic.value.trim(),
    date: fields.date.value,
    readTime: fields.readTime.value.trim(),
    excerpt: fields.excerpt.value.trim(),
    content: fields.content.value.trim(),
  };
}

async function savePosts(message) {
  setStatus("Publishing changes...");
  const body = {
    message,
    content: encodeBase64(`${JSON.stringify(posts, null, 2)}\n`),
    sha: fileSha,
    branch,
  };

  const data = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/contents/${postsPath}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  fileSha = data.content.sha;
  setStatus("Published. GitHub Pages should update in about a minute.");
}

tokenForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (adminIdInput.value.trim().toLowerCase() !== adminUser) {
    setStatus("Wrong admin ID.", true);
    return;
  }
  localStorage.setItem("djayGithubToken", tokenInput.value.trim());
  try {
    await loadPostsFromGitHub();
    adminIdInput.value = "";
    tokenInput.value = "";
  } catch (error) {
    setStatus("Login failed. Please check your password.", true);
  }
});

forgetToken.addEventListener("click", () => {
  localStorage.removeItem("djayGithubToken");
  adminIdInput.value = "";
  tokenInput.value = "";
  setStatus("Logged out.");
});

adminPosts.addEventListener("click", (event) => {
  const button = event.target.closest("[data-index]");
  if (!button) return;
  selectPost(Number(button.dataset.index));
});

newPost.addEventListener("click", clearForm);

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const post = readForm();

  if (selectedIndex >= 0) {
    posts[selectedIndex] = post;
  } else {
    posts.unshift(post);
    selectedIndex = 0;
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderPostList();

  try {
    await savePosts(`Update blog post: ${post.title}`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

deletePost.addEventListener("click", async () => {
  if (selectedIndex < 0) return;
  const post = posts[selectedIndex];
  const confirmed = confirm(`Delete "${post.title}"?`);
  if (!confirmed) return;

  posts.splice(selectedIndex, 1);
  clearForm();

  try {
    await savePosts(`Delete blog post: ${post.title}`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

if (getToken()) {
  loadPostsFromGitHub().catch((error) => setStatus(error.message, true));
}
