# Inkwell — Blog Application (Frontend)

A responsive blog application built with **HTML, CSS and vanilla JavaScript**.
Codomax Digital Solutions Internship — **Module 01: Frontend Development** (Day 1 – Day 4).

## Features

- **Home** — latest published posts in a responsive card grid, with live search and a category filter
- **Register** — full form validation, password strength meter, show/hide password
- **Login** — validation, error messages, redirect back to the page you were trying to open
- **Dashboard** — your stats (total, published, drafts, words written), filter by status, view / edit / delete posts
- **Create Blog** — title, content, category and cover image URL, live word count and reading time, publish or save as draft, edit existing posts, warning before leaving with unsaved changes
- **Post page** — read a single post (owners also get edit / delete)
- Protected pages (Dashboard, Create Blog) redirect to Login when you're signed out
- Mobile-first responsive layout with a hamburger menu
- Light / dark theme (follows system setting, with a manual toggle)
- Accessible: semantic HTML, labelled inputs, `aria-invalid` on errors, keyboard friendly

## Tech stack

| Layer | Used |
|-------|------|
| Markup | HTML5 (semantic elements) |
| Styling | CSS3 — custom properties, Flexbox, Grid, media queries |
| Logic | JavaScript (ES modules) |
| Data | `localStorage` (Module 1 — no backend yet) |

## Project structure

```
blog-app-frontend/
├── index.html        # Home
├── login.html        # Login
├── register.html     # Register
├── dashboard.html    # User dashboard
├── create.html       # Create / edit blog
├── post.html         # Single post view
├── css/
│   └── style.css     # All styles (responsive + themes)
└── js/
    ├── store.js      # Data layer (users, sessions, posts)
    ├── ui.js         # Navbar, theme, toasts, shared helpers
    ├── home.js
    ├── login.js
    ├── register.js
    ├── dashboard.js
    ├── create.js
    └── post.js
```

## Running locally

The pages use ES modules, so they must be served over HTTP (opening the files directly with `file://` won't work).

Use any static server, for example:

- **VS Code**: install the *Live Server* extension → right-click `index.html` → **Open with Live Server**
- **Python**: `python -m http.server 5500` then open http://localhost:5500
- **Node**: `npx serve .`

## Notes on data & security

This is the frontend-only stage, so accounts and posts are stored in the browser's `localStorage`.
Passwords are hashed with SHA-256 before storing, but this is **for demonstration only** — real authentication
(bcrypt hashing, JWT sessions) will be implemented on the server in Module 2.

All user content is HTML-escaped before rendering to prevent XSS.

## Next: Module 2

`js/store.js` is the only file that touches storage, and every function in it is `async`.
In Module 2 these functions will be replaced with `fetch()` calls to a Node.js + Express REST API
(User Registration, User Login, Create Blog) without changing any page code.
