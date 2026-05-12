import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { adminEmail, firebaseConfig } from "./firebase-config.js";

const tokenForm = document.querySelector("#tokenForm");
const adminIdInput = document.querySelector("#adminId");
const passwordInput = document.querySelector("#adminPassword");
const forgetToken = document.querySelector("#forgetToken");
const adminPosts = document.querySelector("#adminPosts");
const postForm = document.querySelector("#postForm");
const editorTitle = document.querySelector("#editorTitle");
const adminStatus = document.querySelector("#adminStatus");
const newPost = document.querySelector("#newPost");
const deletePost = document.querySelector("#deletePost");
const adminUser = "djay";

const fields = {
  title: document.querySelector("#postTitle"),
  topic: document.querySelector("#postTopic"),
  date: document.querySelector("#postDate"),
  readTime: document.querySelector("#postReadTime"),
  excerpt: document.querySelector("#postExcerpt"),
  content: document.querySelector("#postContent"),
};

let app;
let auth;
let db;
let posts = [];
let selectedIndex = -1;

function hasFirebaseConfig() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");
}

function setStatus(message, isError = false) {
  adminStatus.textContent = message;
  adminStatus.dataset.state = isError ? "error" : "ok";
}

function startFirebase() {
  if (!hasFirebaseConfig()) {
    setStatus("Admin setup is not finished yet. Add Firebase settings first.", true);
    return false;
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  return true;
}

async function loadPosts() {
  setStatus("Loading posts...");
  const snapshot = await getDocs(query(collection(db, "posts"), orderBy("date", "desc")));
  posts = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
  renderPostList();
  clearForm();
  setStatus("Ready. Choose a post or create a new one.");
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

tokenForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (adminIdInput.value.trim().toLowerCase() !== adminUser) {
    setStatus("Wrong admin ID.", true);
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, adminEmail, passwordInput.value);
    adminIdInput.value = "";
    passwordInput.value = "";
  } catch {
    setStatus("Login failed. Please check your password.", true);
  }
});

forgetToken.addEventListener("click", async () => {
  await signOut(auth);
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
  setStatus("Publishing...");

  try {
    if (selectedIndex >= 0) {
      await setDoc(doc(db, "posts", posts[selectedIndex].id), post);
    } else {
      await addDoc(collection(db, "posts"), post);
    }
    await loadPosts();
    setStatus("Published. Refresh the blog page to see the change.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

deletePost.addEventListener("click", async () => {
  if (selectedIndex < 0) return;
  const post = posts[selectedIndex];
  const confirmed = confirm(`Delete "${post.title}"?`);
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "posts", post.id));
    await loadPosts();
    setStatus("Deleted.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

if (startFirebase()) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadPosts().catch((error) => setStatus(error.message, true));
    } else {
      posts = [];
      renderPostList();
      clearForm();
    }
  });
}
