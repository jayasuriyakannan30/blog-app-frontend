import { getPost, currentUser, deletePost, seedDemoPosts } from "./store.js";
import { renderNavbar, coverHTML, escapeHTML, formatDate, readingTime, flash } from "./ui.js";

seedDemoPosts();
renderNavbar();

const el = document.getElementById("article");
const id = new URLSearchParams(location.search).get("id");
const post = id ? await getPost(id) : null;
const user = currentUser();
const isOwner = post && user && post.authorId === user.id;

if (!post || (post.status === "draft" && !isOwner)) {
  el.innerHTML = `
    <div class="empty">
      <div class="icon">?</div>
      <h1 style="font-size:1.6rem">Post not found</h1>
      <p>It may have been deleted or the link is wrong.</p>
      <a href="index.html" class="btn btn-primary">Back to home</a>
    </div>`;
} else {
  document.title = `${post.title} — Inkwell`;
  const paragraphs = post.content
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHTML(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");

  el.innerHTML = `
    <a href="${isOwner ? "dashboard.html" : "index.html"}" class="back-link">← Back</a>
    <span class="tag">${escapeHTML(post.category)}</span>
    ${post.status === "draft" ? `<span class="status draft" style="margin-left:6px">Draft</span>` : ""}
    <h1>${escapeHTML(post.title)}</h1>
    <div class="meta">
      <span>By ${escapeHTML(post.authorName)}</span><span>·</span>
      <span>${formatDate(post.createdAt)}</span><span>·</span>
      <span>${readingTime(post.content)} min read</span>
    </div>
    ${coverHTML(post)}
    <div class="article-content">${paragraphs}</div>
    ${
      isOwner
        ? `<div class="row-actions" style="justify-content:flex-start;margin-top:32px">
             <a class="btn btn-outline" href="create.html?id=${encodeURIComponent(post.id)}">Edit post</a>
             <button class="btn btn-danger" id="deleteBtn" type="button">Delete</button>
           </div>`
        : ""
    }`;

  document.getElementById("deleteBtn")?.addEventListener("click", async () => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    await deletePost(post.id);
    flash("Post deleted.");
    location.href = "dashboard.html";
  });
}
