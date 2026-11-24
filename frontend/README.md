# Tovin frontend

This folder contains the Tovin React/Vite web app. It calls the FastAPI backend in the sibling `backend/` folder; frontend setup does not require editing backend code.

## Requirements

- Node.js 18 or newer (includes `npm`)
- The project backend running locally, or a reachable deployed backend URL

Check that Node.js and npm are installed:

```powershell
node --version
npm --version
```

## Start the app after cloning or importing the project

Open a terminal at the project root (the folder containing `backend/` and `frontend/`).

### 1. Start the backend

If you already have the backend running, continue to step 2. Otherwise, open a terminal at the project root and run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `backend/.env` and set your Groq API key:

```env
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

Then start the API:

```powershell
uvicorn app.main:app --reload --port 8000
```

Keep this terminal open. Check that the backend is ready at <http://127.0.0.1:8000/health>.

### 2. Install and start the frontend

Open a second terminal at the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally <http://localhost:5173>. The home page is at `/`; select **Start a conversation** or **Open Tovin** to go to `/chat`.

You only need to run `npm install` again if the dependencies change or you remove `node_modules/`.

## Connect to a different backend

By default, the frontend calls `http://127.0.0.1:8000`. To use another backend, create a local `.env` file in `frontend/`:

```powershell
Copy-Item .env.example .env
```

Set `VITE_API_URL` in `frontend/.env` to the backend origin, without a trailing slash:

```env
VITE_API_URL=https://your-backend.example.com
```

Restart `npm run dev` after changing the value. Never put the Groq API key in the frontend `.env`; keep it in the backend environment only.

## Build and preview

From `frontend/`:

```powershell
npm run build
npm run preview
```

The production files are written to `frontend/dist/`. The preview command prints a local URL for checking the production build.

## Deployment

For Vercel, set the project root directory to `frontend`, use `npm run build` as the build command, and `dist` as the output directory. Set `VITE_API_URL` to the deployed backend origin. The backend must allow the deployed frontend URL in its `ALLOWED_ORIGINS` setting.

`vercel.json` routes chat URLs such as `/chat/<session-id>` back to the single-page app, so refreshing a conversation link works.

## Features and API connection

- The home page introduces Tovin and links into the chat workspace.
- `/health` displays backend connection status and the configured model.
- `/api/conversations` and `/api/conversations/{session_id}/messages` load saved chats.
- `/api/analyze/stream` streams assistant replies and provides message analysis and token usage.
- Incognito messages send recent conversation context but are not saved by the backend.
- Text and code attachments are read in the browser and included in the message; there is no separate file-upload endpoint.

If the sidebar says **Backend offline**, make sure the API is running, `VITE_API_URL` points to it, and the backend allows the frontend's origin.
