# Taskflow — Stay in Motion

A full-stack task management web app with authentication, built with vanilla JavaScript and Supabase.

🔗 **Live Demo:** [taskflow.com](https://taskflow-web-application-gamma.vercel.app/)

---

## Screenshots
<img width="1341" height="653" alt="2026-04-06" src="https://github.com/user-attachments/assets/d7593f55-c759-4121-8355-fd5d4f289154" />

<img width="1366" height="657" alt="2026-04-06 (1)" src="https://github.com/user-attachments/assets/c09fe2dc-7c03-4a37-b417-feb93e4e3aa9" />


---

## Features

- **Authentication** — Email/password signup and Google OAuth (one-click login)
- **Per-user data** — Every user sees only their own tasks, enforced via Supabase Row Level Security
- **Task management** — Add, edit, delete, and mark tasks complete
- **Priority levels** — Low, Medium, High with color-coded indicators
- **Categories** — Personal, Work, Health, Learning, Other
- **Due dates** — Set deadlines with automatic overdue detection
- **Notes** — Add extra context to any task
- **Search** — Live search across task titles and notes
- **Filters** — All, Pending, Completed, High Priority, Overdue
- **Sort** — By newest, oldest, priority, due date, or A–Z
- **Progress tracking** — Stats bar with completion percentage
- **Dark / Light theme** — Persists across sessions
- **Responsive** — Works on mobile, tablet, and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Deployment | Vercel |
| Version Control | Git + GitHub |

---

## Getting Started

### Prerequisites
- A [Supabase](https://supabase.com) account and project
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Clone the repo

```bash
git clone https://github.com/krishshna/taskflow-web-application.git
cd taskflow-web-application
```

### 2. Set up Supabase

Run this SQL in your Supabase **SQL Editor**:

```sql
create table tasks (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  priority text default 'medium',
  category text default 'personal',
  due date,
  notes text,
  completed boolean default false,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table tasks enable row level security;

create policy "Users can read own tasks"
  on tasks for select using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on tasks for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete using (auth.uid() = user_id);
```

### 3. Add your Supabase credentials

In `script.js`, update these two lines:

```js
const SUPABASE_URL = 'your-project-url';
const SUPABASE_KEY = 'your-anon-public-key';
```

### 4. Run locally

Open `index.html` with [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code.

### 5. Deploy

Push to GitHub and import the repo on [Vercel](https://vercel.com). It auto-deploys on every `git push`.

---

## Project Structure

```
taskflow-web-application/
├── index.html      # App structure + auth screen
├── style.css       # All styles (dark/light theme, responsive)
└── script.js       # App logic, Supabase CRUD, auth handlers
```

---

## Security

- Supabase **Row Level Security (RLS)** ensures users can only read and modify their own data at the database level — not just in the frontend
- Google OAuth handled entirely by Supabase — no credentials stored in the app
- Supabase anon key is safe to expose in frontend code by design

---

## Roadmap

- [ ] Forgot password flow
- [ ] Real-time sync across tabs
- [ ] Due date browser notifications
- [ ] Drag to reorder tasks
- [ ] PWA support (installable on mobile)

---

## Author

**Krishshna** — [github.com/krishshna](https://github.com/krishshna)
