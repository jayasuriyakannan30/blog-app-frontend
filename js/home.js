import { listPosts, currentUser, seedDemoPosts } from "./store.js";
import { renderNavbar, CATEGORIES, coverHTML, escapeHTML, excerpt, formatDate, readingTime } from "./ui.js";

seedDemoPosts();
renderNavbar("home");

const grid = document.getElementById("postGrid");
const empty = document.getElementById("emptyState");
const search = document.getElementById("search");
const filter = document.getElementById("categoryFilter");

document.getElementById("heroActions").innerHTML = currentUser()
  ? `<a href="create.html" class="btn btn-primary">Write a post</a>
     <a href="dashboard.html" class="btn btn-outline">Go to dashboard</a>`
  : `<a href="register.html" class="btn btn-primary">Start writing</a>
     <a href="login.html" class="btn btn-outline">Log in</a>`;

filter.insertAdjacentHTML("beforeend", CATEGORIES.map((c) => `<option>${c}</option>`).join(""));

const posts = await listPosts({ status: "published" });

function render() {
  const q = search.value.trim().toLowerCase();
  const cat = filter.value;
  const visible = posts.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (!q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q))
  );

  empty.hidden = visible.length > 0;
  if (!posts.length) empty.querySelector("p").textContent = "No posts yet. Be the first to write one!";

  grid.innerHTML = visible
    .map(
      (p) => `
      <article class="card post-card">
        <a href="post.html?id=${encodeURIComponent(p.id)}" tabindex="-1" aria-hidden="true">${coverHTML(p)}</a>
        <div class="post-body">
          <span class="tag">${escapeHTML(p.category)}</span>
          <h3><a href="post.html?id=${encodeURIComponent(p.id)}">${escapeHTML(p.title)}</a></h3>
          <p class="post-excerpt">${escapeHTML(excerpt(p.content))}</p>
          <div class="meta">
            <span>${escapeHTML(p.authorName)}</span><span>·</span>
            <span>${formatDate(p.createdAt)}</span><span>·</span>
            <span>${readingTime(p.content)} min read</span>
          </div>
        </div>
      </article>`
    )
    .join("");
}

search.addEventListener("input", render);
filter.addEventListener("change", render);
render();
