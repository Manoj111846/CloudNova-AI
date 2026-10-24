# CloudNova AI

A personal AI workspace starter built with FastAPI, HTML, CSS, and JavaScript. Includes a responsive dark interface, a fixed message composer, a compact custom cloud/Nova logo, login and sign-up UI previews, and an optional Gemini-powered chat service.

## Requirements
- Python 3.10+
- Optional: a Gemini API key for live AI responses

## Run on Windows (PowerShell)
From this project folder:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn backend.app.main:app --reload
```

If PowerShell blocks activation, use this only for the current terminal session, then activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Open http://127.0.0.1:8000. API health check: http://127.0.0.1:8000/api/health. Login: http://127.0.0.1:8000/login. Sign up: http://127.0.0.1:8000/signup.

## Enable Gemini
Edit `.env` locally and add your own key:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Never share your API key in chat or commit `.env` to Git. The `.gitignore` excludes it.

## Docker
Copy `.env.example` to `.env`, then run:

```powershell
docker compose up --build
```

## Current status and next phases
- Responsive workspace and pinned chat composer: included
- Custom SVG logo and favicon: included
- Login and sign-up page designs: included
- Chat API with optional Gemini integration: included
- Real account creation/login: **not implemented yet**. Auth forms are UI previews only and do not save credentials. Add secure password hashing, database persistence, sessions/cookies, CSRF protections, and validation before using real accounts.
- Long-term memory, file/document ingestion, voice, and cloud tools: roadmap items; not all are implemented in this starter.

See `docs/PROJECT_ROADMAP.md` for the planned build sequence.


## UI update (calm light theme)
The current UI uses a low-saturation light palette. Focusing or submitting the chat composer opens a sign-up/login prompt. The account pages are still interface previews; secure authentication and user storage are not yet implemented.

## Run locally (Windows PowerShell)

1. Open this folder in VS Code and open Terminal.
2. Create/activate a virtual environment if needed: `python -m venv .venv` then `Set-ExecutionPolicy -Scope Process Bypass` and `.\.venv\Scripts\Activate.ps1`.
3. Install dependencies: `python -m pip install -r requirements.txt`.
4. Check that `.env` exists in the project root. The included `.env` contains a random development-only session secret; keep it private and never commit it.
5. Start the app: `python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000`.
6. Visit `http://127.0.0.1:8000/signup`, create an account with a password of at least 12 characters, then chat from the home page.
7. To enable Gemini, add your own key to `GEMINI_API_KEY=` in `.env`, save, and restart the server. Never paste your API key into chat or commit it.

### Authentication notes

This is a local learning project. It stores accounts in `cloudnova.db` and hashes passwords. Before deploying publicly, use HTTPS and set `COOKIE_SECURE=true`, add rate limiting and CSRF protections, and rotate the development session secret. The included `.env` is for local development only.


## Recent UI updates
- Dark mode is enabled by default; the theme button switches between dark and light and remembers the selection in this browser.
- The sidebar has a scrollable conversation-history list. Create, reopen, pin/unpin, and delete conversations.
- Conversation history is stored in this browser's local storage. It is local to this browser/profile and is not synced across devices or accounts.
- Each message has a Copy button.
- The distributed ZIP intentionally excludes `.env`; keep your existing private `.env` file and never share it.


## Quick start (Windows)

1. Extract the ZIP.
2. Open the extracted `CloudNova-AI` folder.
3. Double-click `RUN-CLOUDNOVA-WINDOWS.bat`.
4. On first run, the launcher creates `.venv`, installs packages, and creates `.env` from `.env.example`.
5. To enable Gemini, open `.env` and set `GEMINI_API_KEY` to a **new key** from Google AI Studio. Do not share or commit `.env`.
6. Open `http://127.0.0.1:8000`.

The archive intentionally does not contain personal API keys or secrets. The local `.env` is created on your computer. If authentication says it is not configured, check that `.env` exists in this `CloudNova-AI` root folder and `SESSION_SECRET` is not blank.


## Windows quick start

1. Extract this folder.
2. Open the `CloudNova-AI` folder in PowerShell.
3. Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` if PowerShell blocks activation.
4. Run `python -m venv .venv` only if `.venv` does not already exist.
5. Activate with `\.venv\Scripts\Activate.ps1`, or skip activation and use `\.venv\Scripts\python.exe`.
6. Install dependencies: `python -m pip install -r requirements.txt`
7. Start: `python -m uvicorn backend.app.main:app --reload`
8. Visit `http://127.0.0.1:8000`.

The `.env` file is configured for local development. Keep it private and never upload it to GitHub.
If your API key has been shared publicly or stops working, revoke it in Google AI Studio and replace it in `.env`.


## Deploy to Render (student demo)

1. Create a GitHub repository named `CloudNova-AI`.
2. Extract this project ZIP, open the project folder in VS Code, and make sure `.env` is **not** included in the upload. This package intentionally excludes `.env`.
3. In the project folder, run `git init`, `git add .`, `git commit -m "Prepare CloudNova AI for deployment"`, then connect your new GitHub repository and push.
4. In Render, choose **New + → Blueprint** and connect the GitHub repository. Render reads `render.yaml`.
5. In the Render service's Environment settings, add `GEMINI_API_KEY` as a secret value from Google AI Studio. Do not put the key in source code or GitHub. `GEMINI_MODEL` is set to `gemini-3.6-flash`.
6. Deploy and test `/api/health`, sign-up, login, and a chat prompt.

### Important deployment notes
- This is a student/demo deployment. The app currently uses SQLite stored in the project directory. On hosts with ephemeral filesystems, user accounts may be lost after redeploy/restart. For durable production accounts, configure a persistent disk or migrate to a managed database.
- The Render free service may sleep when idle and the first request can be slow.
- Keep `.env` out of GitHub. If an API key was ever shared publicly or pasted into a chat, rotate it in Google AI Studio before deployment.
- Never claim features are complete unless you can demonstrate them in the deployed application.

## Quick project demo checklist
- Explain the problem CloudNova AI solves.
- Demonstrate AI chat with a real prompt.
- Demonstrate one coding or Cloud & DevOps prompt.
- Show the live deployed URL and `/api/health`.
- Show the GitHub repository and explain your own contribution.

## UI improvements

- Expanded chat workspace, clearer typography, and larger message composer.
- Automatically searches Wikimedia Commons for topic-related images after successful AI answers. Image lookup is optional and may depend on network access.
