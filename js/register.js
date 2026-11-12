import { registerUser } from "./store.js";
import { renderNavbar, redirectIfAuthed, setFieldError, showAlert, wirePasswordToggles, flash, EMAIL_RE } from "./ui.js";

redirectIfAuthed();
renderNavbar("register");
wirePasswordToggles();

const form = document.getElementById("registerForm");
const name = document.getElementById("name");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirm = document.getElementById("confirm");
const alertBox = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");
const bar = document.getElementById("strengthBar");
const barText = document.getElementById("strengthText");

function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LEVELS = [
  { w: "10%", c: "var(--danger)", t: "Too weak" },
  { w: "30%", c: "var(--danger)", t: "Weak" },
  { w: "55%", c: "#c98a12", t: "Fair" },
  { w: "80%", c: "var(--success)", t: "Good" },
  { w: "100%", c: "var(--success)", t: "Strong" },
];

password.addEventListener("input", () => {
  const pw = password.value;
  if (!pw) {
    bar.style.width = "0";
    barText.textContent = "Use 8+ characters with a mix of letters, numbers and symbols.";
    return;
  }
  const lvl = LEVELS[strength(pw)];
  bar.style.width = lvl.w;
  bar.style.background = lvl.c;
  barText.textContent = `Strength: ${lvl.t}`;
});

function validate() {
  let ok = true;
  const check = (input, msg) => {
    setFieldError(input, msg);
    if (msg) ok = false;
  };

  const n = name.value.trim();
  check(name, !n ? "Name is required." : n.length < 2 ? "Name must be at least 2 characters." : "");

  const em = email.value.trim();
  check(email, !em ? "Email is required." : !EMAIL_RE.test(em) ? "Enter a valid email address." : "");

  const pw = password.value;
  check(
    password,
    !pw ? "Password is required."
      : pw.length < 8 ? "Password must be at least 8 characters."
      : !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "Include at least one letter and one number."
      : ""
  );

  check(confirm, !confirm.value ? "Please confirm your password." : confirm.value !== pw ? "Passwords do not match." : "");
  return ok;
}

[name, email, password, confirm].forEach((el) => el.addEventListener("input", () => setFieldError(el, "")));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertBox.className = "alert";
  if (!validate()) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account…";
  try {
    const user = await registerUser({ name: name.value, email: email.value, password: password.value });
    flash(`Welcome to Inkwell, ${user.name.split(" ")[0]}!`);
    location.href = "dashboard.html";
  } catch (err) {
    showAlert(alertBox, err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Create account";
  }
});
