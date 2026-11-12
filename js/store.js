/* ==========================================================
   store.js — data layer
   Module 1 keeps data in the browser (localStorage).
   Every function is async and returns plain objects, so in
   Module 2 these can be swapped for fetch() calls to the
   Node.js / Express REST API without touching the pages.
   ========================================================== */

const KEYS = {
  users: "inkwell_users",
  posts: "inkwell_posts",
  session: "inkwell_session",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function hashPassword(password) {
  // Demo only — real hashing (bcrypt) happens on the server in Module 2.
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------- Auth ---------------- */

export async function registerUser({ name, email, password }) {
  const users = read(KEYS.users, []);
  const normalized = email.trim().toLowerCase();
  if (users.some((u) => u.email === normalized)) {
    throw new Error("An account with this email already exists.");
  }
  const user = {
    id: uid(),
    name: name.trim(),
    email: normalized,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  write(KEYS.users, users);
  return startSession(user);
}

export async function loginUser({ email, password }) {
  const users = read(KEYS.users, []);
  const user = users.find((u) => u.email === email.trim().toLowerCase());
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new Error("Invalid email or password.");
  }
  return startSession(user);
}

function startSession(user) {
  const session = { id: user.id, name: user.name, email: user.email };
  write(KEYS.session, session);
  return session;
}

export function currentUser() {
  return read(KEYS.session, null);
}

export function logout() {
  localStorage.removeItem(KEYS.session);
}

/* ---------------- Posts ---------------- */

export async function listPosts({ authorId, status } = {}) {
  let posts = read(KEYS.posts, []);
  if (authorId) posts = posts.filter((p) => p.authorId === authorId);
  if (status) posts = posts.filter((p) => p.status === status);
  return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getPost(id) {
  return read(KEYS.posts, []).find((p) => p.id === id) || null;
}

export async function createPost(data) {
  const user = currentUser();
  if (!user) throw new Error("You must be logged in.");
  const posts = read(KEYS.posts, []);
  const now = new Date().toISOString();
  const post = {
    id: uid(),
    title: data.title.trim(),
    category: data.category,
    coverUrl: data.coverUrl?.trim() || "",
    content: data.content.trim(),
    status: data.status,
    authorId: user.id,
    authorName: user.name,
    createdAt: now,
    updatedAt: now,
  };
  posts.push(post);
  write(KEYS.posts, posts);
  return post;
}

export async function updatePost(id, data) {
  const user = currentUser();
  const posts = read(KEYS.posts, []);
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Post not found.");
  if (!user || posts[idx].authorId !== user.id) throw new Error("You can only edit your own posts.");
  posts[idx] = {
    ...posts[idx],
    title: data.title.trim(),
    category: data.category,
    coverUrl: data.coverUrl?.trim() || "",
    content: data.content.trim(),
    status: data.status,
    updatedAt: new Date().toISOString(),
  };
  write(KEYS.posts, posts);
  return posts[idx];
}

export async function deletePost(id) {
  const user = currentUser();
  const posts = read(KEYS.posts, []);
  const post = posts.find((p) => p.id === id);
  if (!post) return;
  if (!user || post.authorId !== user.id) throw new Error("You can only delete your own posts.");
  write(KEYS.posts, posts.filter((p) => p.id !== id));
}

/* ---------------- Demo content ---------------- */

export function seedDemoPosts() {
  if (localStorage.getItem(KEYS.posts) !== null) return;
  const day = 86400000;
  const now = Date.now();
  const demo = [
    {
      title: "Getting Started with Semantic HTML",
      category: "HTML",
      content:
        "Semantic HTML means choosing elements for their meaning, not their looks. Tags like <header>, <nav>, <main>, <article> and <footer> tell browsers, search engines and screen readers what each part of a page is for.\n\nUsing them improves accessibility for free, makes your CSS easier to reason about, and helps SEO. A good rule of thumb: if you are reaching for a <div>, pause and ask whether a more meaningful element already exists.",
    },
    {
      title: "CSS Grid vs Flexbox: When to Use Which",
      category: "CSS",
      content:
        "Flexbox is one-dimensional — it lays items out in a row or a column. Grid is two-dimensional — rows and columns at the same time.\n\nUse Flexbox for navbars, button groups and centring things. Use Grid for page layouts and card galleries. The blog grid on this site uses repeat(auto-fill, minmax(290px, 1fr)) so it becomes responsive without a single media query.",
    },
    {
      title: "Understanding the JavaScript Event Loop",
      category: "JavaScript",
      content:
        "JavaScript runs on a single thread, yet it handles timers, network requests and user clicks without freezing. The secret is the event loop.\n\nSynchronous code runs on the call stack. Async callbacks wait in queues — microtasks (Promises) first, then macrotasks (setTimeout, events). Once the stack is empty, the loop pulls the next job. Understanding this explains why a Promise.then runs before a setTimeout(fn, 0).",
    },
  ];
  const posts = demo.map((d, i) => ({
    id: uid() + i,
    ...d,
    coverUrl: "",
    status: "published",
    authorId: "demo",
    authorName: "Inkwell Team",
    createdAt: new Date(now - (i + 1) * day).toISOString(),
    updatedAt: new Date(now - (i + 1) * day).toISOString(),
  }));
  write(KEYS.posts, posts);
}
