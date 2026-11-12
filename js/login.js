import { loginUser } from "./store.js";
import { renderNavbar, redirectIfAuthed, setFieldError, showAlert, wirePasswordToggles, flash, EMAIL_RE } from "./ui.js";

redirectIfAuthed();
renderNavbar("login");
wirePasswordToggles();

const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const alertBox = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");

function validate() {
  let ok = true;
  if (!email.value.trim()) { setFieldError(email, "Email is required."); ok = false; }
  else if (!EMAIL_RE.test(email.value.trim())) { setFieldError(email, "Enter a valid email address."); ok = false; }
  else setFieldError(email, "");

  if (!password.value) { setFieldError(password, "Password is required."); ok = false; }
  else setFieldError(password, "");
  return ok;
}

[email, password].forEach((el) => el.addEventListener("input", () => setFieldError(el, "")));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertBox.className = "alert";
  if (!validate()) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in…";
  try {
    const user = await loginUser({ email: email.value, password: password.value });
    flash(`Welcome back, ${user.name.split(" ")[0]}!`);
    const next = new URLSearchParams(location.search).get("next");
    // Only allow redirects to pages within this app.
    location.href = next && /^[\w-]+\.html(\?.*)?$/.test(next) ? next : "dashboard.html";
  } catch (err) {
    showAlert(alertBox, err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Log in";
  }
});
