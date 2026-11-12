import { listPosts, deletePost } from "./store.js";
import { renderNavbar, requireAuth, escapeHTML, formatDate, readingTime, toast } from "./ui.js";

const user = requireAuth();
if (user) {
  renderNavbar("dashboard");
  document.getElementById("greeting").textContent = `Hi, ${user.name.split(" ")[0]} 👋`;

  const list = document.getElementById("postList");
  const empty = document.getElementById("emptyState");
  const statusFilter = document.getElementById("statusFilter");
  let posts = await listPosts({ authorId: user.id });

  function renderStats() {
    const words = posts.reduce((n, p) => n + p.content.trim().split(/\s+/).filter(Boolean).length, 0);
    document.getElementById("statTotal").textContent = posts.length;
    document.getElementById("statPublished").textContent = posts.filter((p) => p.status === "published").length;
    document.getElementById("statDrafts").textContent = posts.filter((p) => p.status === "draft").length;
    document.getElementById("statWords").textContent = words.toLocaleString();
  }

  function render() {
    renderStats();
    const f = statusFilter.value;
    const visible = f ? posts.filter((p) => p.status === f) : posts;

    const none = visible.length === 0;
    list.hidden = none;
    empty.hidden = !none;
    if (none) {
      empty.querySelector("p").textContent = posts.length
        ? `No ${f === "draft" ? "drafts" : "published posts"} yet.`
        : "You haven't written anything yet.";
    }

    list.innerHTML = visible
      .map(
        (p) => `
        <div class="post-row">
          <div>
            <h3><a href="post.html?id=${encodeURIComponent(p.id)}">${escapeHTML(p.title)}</a></h3>
            <div class="meta">
              <span class="status ${p.status}">${p.status}</span>
              <span>${escapeHTML(p.category)}</span><span>·</span>
              <span>Updated ${formatDate(p.updatedAt)}</span><span>·</span>
              <span>${readingTime(p.content)} min read</span>
            </div>
          </div>
          <div class="row-actions">
            <a class="btn btn-outline btn-sm" href="post.html?id=${encodeURIComponent(p.id)}">View</a>
            <a class="btn btn-outline btn-sm" href="create.html?id=${encodeURIComponent(p.id)}">Edit</a>
            <button class="btn btn-danger btn-sm" data-delete="${escapeHTML(p.id)}" type="button">Delete</button>
          </div>
        </div>`
      )
      .join("");
  }

  list.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-delete]");
    if (!btn) return;
    const post = posts.find((p) => p.id === btn.dataset.delete);
    if (!post || !window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await deletePost(post.id);
      posts = posts.filter((p) => p.id !== post.id);
      render();
      toast("Post deleted.");
    } catch (err) {
      toast(err.message);
    }
  });

  statusFilter.addEventListener("change", render);
  render();
}
