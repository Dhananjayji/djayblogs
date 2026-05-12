import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

function hasFirebaseConfig() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");
}

async function loadFirebasePosts() {
  if (!hasFirebaseConfig()) return;

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await getDocs(query(collection(db, "posts"), orderBy("date", "desc")));
  const firebasePosts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  window.setPublishedPosts(firebasePosts);
}

loadFirebasePosts().catch((error) => {
  console.warn("Firebase posts unavailable:", error);
});
