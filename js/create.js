import { createPost, updatePost, getPost } from "./store.js";
import { renderNavbar, requireAuth, CATEGORIES, setFieldError, showAlert, flash, readingTime } from "./ui.js";

const user = requireAuth();
if (user) {
  renderNavbar("create");

  const form = document.getElementById("postForm");
  const title = document.getElementById("title");
  const content = document.getElementById("content");
  const category = document.getElementById("category");
  const coverUrl = document.getElementById("coverUrl");
  const coverPreview = document.getElementById("coverPreview");
  const alertBox = document.getElementById("formAlert");

  category.innerHTML =
    `<option value="">Choose a category</option>` + CATEGORIES.map((c) => `<option>${c}</option>`).join("");

  // ----- Edit mode -----
  const editId = new URLSearchParams(location.search).get("id");
  let dirty = false;

  if (editId) {
    const post = await getPost(editId);
    if (!post || post.authorId !== user.id) {
      flash("That post doesn't exist or isn't yours.");
      location.replace("dashboard.html");
    } else {
      document.title = "Inkwell — Edit post";
      document.getElementById("pageTitle").textContent = "Edit post";
      document.getElementById("pageSub").textContent = "Update your post and save the changes.";
      title.value = post.title;
      content.value = post.content;
      category.value = post.category;
      coverUrl.value = post.coverUrl;
      form.querySelector('[data-status="published"]').textContent =
        post.status === "published" ? "Update post" : "Publish";
    }
  }

  // ----- Live counters & preview -----
  function updateCounters() {
    document.getElementById("titleCount").textContent = title.value.length;
    const words = content.value.trim().split(/\s+/).filter(Boolean).length;
    document.getElementById("wordCount").textContent = words;
    document.getElementById("readTime").textContent = readingTime(content.value);
  }

  function updatePreview() {
    const url = coverUrl.value.trim();
    if (/^https?:\/\/.+/i.test(url)) {
      coverPreview.src = url;
      coverPreview.style.display = "block";
    } else {
      coverPreview.removeAttribute("src");
      coverPreview.style.display = "none";
    }
  }
  coverPreview.addEventListener("error", () => (coverPreview.style.display = "none"));

  [title, content, category, coverUrl].forEach((el) =>
    el.addEventListener("input", () => {
      dirty = true;
      setFieldError(el, "");
      updateCounters();
    })
  );
  coverUrl.addEventListener("change", updatePreview);
  updateCounters();
  updatePreview();

  // Warn before leaving with unsaved changes.
  window.addEventListener("beforeunload", (e) => {
    if (dirty) e.preventDefault();
  });

  // ----- Validation -----
  function validate(status) {
    let ok = true;
    const check = (el, msg) => {
      setFieldError(el, msg);
      if (msg) ok = false;
    };
    const t = title.value.trim();
    check(title, !t ? "Title is required." : t.length < 5 ? "Title must be at least 5 characters." : "");

    const words = content.value.trim().split(/\s+/).filter(Boolean).length;
    // Drafts can be short; published posts need some substance.
    check(
      content,
      !content.value.trim() ? "Content is required."
        : status === "published" && words < 20 ? `Published posts need at least 20 words (currently ${words}).`
        : ""
    );

    check(category, !category.value ? "Please choose a category." : "");

    const url = coverUrl.value.trim();
    check(coverUrl, url && !/^https?:\/\/.+/i.test(url) ? "Enter a valid URL starting with http:// or https://" : "");
    return ok;
  }

  // ----- Submit -----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = e.submitter?.dataset.status || "published";
    alertBox.className = "alert";
    if (!validate(status)) {
      form.querySelector(".input-error")?.focus();
      return;
    }

    const data = {
      title: title.value,
      content: content.value,
      category: category.value,
      coverUrl: coverUrl.value,
      status,
    };

    form.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try {
      const post = editId ? await updatePost(editId, data) : await createPost(data);
      dirty = false;
      flash(status === "published" ? "Post published!" : "Draft saved.");
      location.href = status === "published" ? `post.html?id=${encodeURIComponent(post.id)}` : "dashboard.html";
    } catch (err) {
      showAlert(alertBox, err.message);
      form.querySelectorAll("button").forEach((b) => (b.disabled = false));
    }
  });
}
