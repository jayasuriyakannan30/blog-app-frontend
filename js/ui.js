/* ==========================================================
   ui.js — shared UI: navbar, theme, toast, helpers
   ========================================================== */
import { currentUser, logout } from "./store.js";

export const CATEGORIES = ["Technology", "HTML", "CSS", "JavaScript", "Career", "Lifestyle", "Other"];

const COVER_COLORS = ["#9b1b42", "#1f5f8b", "#2f7a4d", "#7a4b9b", "#b8641c", "#3d4a5c"];

export function escapeHTML(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function readingTime(text = "") {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function excerpt(text = "", len = 130) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > len ? clean.slice(0, len).trimEnd() + "…" : clean;
}

/** Cover image if a URL is set, otherwise a coloured block with the title's initial. */
export function coverHTML(post) {
  const initial = escapeHTML(post.title.charAt(0).toUpperCase());
  const color = COVER_COLORS[post.title.length % COVER_COLORS.length];
  if (post.coverUrl) {
    return `<img class="post-cover" src="${escapeHTML(post.coverUrl)}" alt="" loading="lazy"
      data-initial="${initial}" data-color="${color}">`;
  }
  return `<div class="post-cover" style="background:${color}" aria-hidden="true">${initial}</div>`;
}

// If a cover image URL fails to load, swap it for the coloured fallback block.
document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("post-cover")) return;
    const div = document.createElement("div");
    div.className = "post-cover";
    div.style.background = img.dataset.color || "#9b1b42";
    div.textContent = img.dataset.initial || "";
    img.replaceWith(div);
  },
  true
);

export function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

/** Flash message carried across a page redirect. */
export function flash(message) {
  sessionStorage.setItem("inkwell_flash", message);
}
function showFlash() {
  const msg = sessionStorage.getItem("inkwell_flash");
  if (msg) {
    sessionStorage.removeItem("inkwell_flash");
    toast(msg);
  }
}

/** Redirect to login if not signed in. Returns the user. */
export function requireAuth() {
  const user = currentUser();
  if (!user) {
    const next = encodeURIComponent(location.pathname.split("/").pop() + location.search);
    location.replace(`login.html?next=${next}`);
    return null;
  }
  return user;
}

/** Redirect away from login/register if already signed in. */
export function redirectIfAuthed() {
  if (currentUser()) location.replace("dashboard.html");
}

/* ---------- Theme ---------- */
function applyTheme(theme) {
  if (theme) document.documentElement.setAttribute("data-theme", theme);
  else document.documentElement.removeAttribute("data-theme");
}
function effectiveTheme() {
  const set = document.documentElement.getAttribute("data-theme");
  if (set) return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
try { applyTheme(localStorage.getItem("inkwell_theme")); } catch {}

/* ---------- Navbar ---------- */
export function renderNavbar(active = "") {
  const user = currentUser();
  const link = (href, label, key) =>
    `<li><a href="${href}" class="${active === key ? "active" : ""}">${label}</a></li>`;

  const authLinks = user
    ? `${link("dashboard.html", "Dashboard", "dashboard")}
       ${link("create.html", "Write", "create")}
       <li class="nav-user">Hi, ${escapeHTML(user.name.split(" ")[0])}</li>
       <li><button class="link" id="logoutBtn" type="button">Log out</button></li>`
    : `${link("login.html", "Log in", "login")}
       <li><a href="register.html" class="btn btn-primary btn-sm" style="color:#fff">Sign up</a></li>`;

  const header = document.createElement("header");
  header.className = "navbar";
  header.innerHTML = `
    <nav class="container" aria-label="Main">
      <a href="index.html" class="brand"><span class="brand-mark">I</span>Inkwell</a>
      <div style="display:flex;align-items:center;gap:8px">
        <ul class="nav-links" id="navLinks">
          ${link("index.html", "Home", "home")}
          ${authLinks}
        </ul>
        <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle dark mode">◐</button>
        <button class="nav-toggle" id="navToggle" type="button" aria-label="Open menu" aria-expanded="false">☰</button>
      </div>
    </nav>`;
  document.body.prepend(header);

  const navLinks = header.querySelector("#navLinks");
  const navToggle = header.querySelector("#navToggle");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  header.querySelector("#themeToggle").addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("inkwell_theme", next); } catch {}
  });

  header.querySelector("#logoutBtn")?.addEventListener("click", () => {
    logout();
    flash("You have been logged out.");
    location.href = "index.html";
  });

  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML = `<div class="container">© ${new Date().getFullYear()} Inkwell · Built with HTML, CSS &amp; JavaScript · Codomax Internship — Module 1</div>`;
  document.body.appendChild(footer);

  showFlash();
}

/* ---------- Form helpers ---------- */
export function setFieldError(input, message) {
  const err = input.closest(".form-group")?.querySelector(".field-error");
  input.classList.toggle("input-error", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  if (err) err.textContent = message || "";
}

export function showAlert(el, message, type = "error") {
  el.textContent = message;
  el.className = `alert alert-${type} show`;
}

export function wirePasswordToggles() {
  document.querySelectorAll(".pw-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
    });
  });
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
