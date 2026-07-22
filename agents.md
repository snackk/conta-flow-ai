# 🔄 ContaFlow AI — Project Context for AI Agents

## Overview

**ContaFlow AI** is a React + Firebase web app that keeps **tasks synchronized across the members of a team**. Its centerpiece is a Kanban-style board organized as **swimlanes** (one row per assignee) crossed with **status columns** (Blocked / Ready to Start / In Progress / Done). Tasks can declare a **precedence** on another task (auto-blocking until the predecessor is done) and can be **recurring** (e.g. a monthly "SAFT" task that resets every month). The app is **multi-project**: every user belongs to one or more isolated projects (workspaces), switches between them via a selector, and all task/template/client data is scoped to whichever project is active.

- **Language**: Portuguese-first (all UI strings). No i18n layer — unlike its sibling project VizinhAI, this app only targets pt-PT for now.
- **Version**: 1.0.0

---

## Tech Stack

| Layer        | Technology                                                   |
|--------------|--------------------------------------------------------------|
| Build Tool   | Vite 5.4 (ES Modules)                                       |
| UI Framework | React 18.2 (JSX, functional components, hooks)              |
| Styling      | Tailwind CSS v4 via `@tailwindcss/vite` plugin               |
| Backend      | Firebase 10.8 (Authentication — Google provider, Firestore, Storage) |
| Icons        | Lucide React                                                 |
| Markdown     | react-markdown (renders the task description and comments preview) |
| Dev Server   | Vite dev server (`npm run dev`)                              |

This project intentionally mirrors the structure/conventions of `../VizinhAI` (same build tooling, same Tailwind setup, same `config/firebase.js` pattern), minus the i18n/PDF pieces which this domain doesn't need — Storage *is* used here (task/comment image uploads), unlike the note that used to be here.

`src/config/firebase.js` can boot with **zero setup** against the Firebase Local Emulator Suite: in dev mode, if no `VITE_FIREBASE_CONFIG` is set, it falls back to a `demo-*` project id and calls `connectAuthEmulator`/`connectFirestoreEmulator`/`connectStorageEmulator`. `firebase.json` wires up all three emulators (`auth` 9099, `firestore` 8080, `storage` 9199, UI 4000); run them with `npm run emulators`. Don't assume a real Firebase project is required to develop or test this app.

---

## Project Structure

```
/
├── index.html                      # HTML shell, loads /src/main.jsx
├── package.json                    # Dependencies & scripts
├── vite.config.js                  # Vite config with React + Tailwind plugins
├── .env.example                    # Required env vars template
├── public/
│   └── manifest.json               # PWA manifest
└── src/
    ├── main.jsx                    # ReactDOM.createRoot entry point
    ├── App.jsx                     # Root component: auth gate, sidebar, page routing, task modal
    ├── index.css                   # Tailwind directives + drag/drop + scrollbar styles
    ├── config/
    │   └── firebase.js             # Firebase init from VITE_FIREBASE_CONFIG env var, Google provider
    ├── contexts/
    │   ├── AuthContext.jsx         # onAuthStateChanged, Google popup sign-in, Firestore user profile sync, admin bootstrap, invite acceptance
    │   ├── ThemeContext.jsx        # light/dark theme: `dark` class on <html>, synced to users/{uid}.theme + localStorage
    │   └── ProjectContext.jsx      # user's projects list + current project id (localStorage-persisted per uid)
    ├── hooks/
    │   ├── useUsers.js             # Firestore `users` collection subscription (ALL platform users, not project-scoped)
    │   ├── useProjects.js          # Firestore `projects` CRUD (create, add/remove member, invite by email) + subscription
    │   ├── useTaskTemplates.js     # Firestore `taskTemplates` CRUD + subscription, scoped by projectId
    │   ├── useClients.js           # Firestore `clients` CRUD + subscription, scoped by projectId
    │   ├── useTasks.js             # Firestore `tasks` CRUD + subscription, scoped by projectId + recurrence reset side-effect
    │   └── useComments.js          # Firestore `tasks/{taskId}/comments` CRUD + subscription
    ├── utils/
    │   ├── taskLogic.js            # computeStage(), recurrence reset calc, initials, date formatting, color presets, isUserOOO(), getTaskUrgency()
    │   └── uploadImage.js          # uploadTaskImage(file, ownerUid) → Storage upload + download URL
    ├── components/
    │   ├── Avatar.jsx              # Google photo, falls back to initials-in-a-colored-circle
    │   ├── NavItem.jsx             # Sidebar nav item, supports a collapsed (icon-only) mode
    │   ├── LoginScreen.jsx         # "Sign in with Google" screen
    │   ├── ProjectSelectScreen.jsx # Shown when the user has 0 or >1 projects and none is validly selected yet
    │   ├── ProjectModal.jsx        # Create a new project (name only; admin-only entry points)
    │   ├── TaskCard.jsx            # Draggable task card shown on the board
    │   ├── TaskModal.jsx           # Expanded task view, Jira-style: title + 3/4 description+comments, 1/4 metadata sidebar
    │   ├── MarkdownEditor.jsx      # Toolbar + write/preview textarea, reused for description AND comments, image upload
    │   ├── TaskComments.jsx        # Comment list + composer, mounted inside TaskModal below the description
    │   ├── NotificationBell.jsx    # Bell icon + dropdown for deadline notifications, always in the top-right header
    │   ├── TemplateModal.jsx       # Create/edit task template form
    │   └── ClientModal.jsx         # Create/edit client form
    └── pages/
        ├── BoardPage.jsx           # Main swimlane board (filters, OOO badge, drag & drop across rows/columns)
        ├── TemplatesPage.jsx       # Task template management ("task settings" section)
        ├── ClientsPage.jsx         # Client management (the domain entity tasks reference)
        ├── ProjectsPage.jsx        # List projects, switch current project, manage members/invites
        └── ProfilePage.jsx         # Edit first/last name, theme, Out of Office date range (photo is Google-managed, read-only)
```

---

## Environment Variables

| Variable               | Description                                                                 |
|------------------------|-------------------------------------------------------------------------------|
| `VITE_FIREBASE_CONFIG` | JSON string with full Firebase config (apiKey, authDomain, projectId, etc.)   |
| `VITE_APP_ID`          | Optional app identifier, defaults to `"conta-flow-ai"` (currently unused, reserved for future multi-tenant namespacing) |

---

## Firebase Data Model (Firestore)

### `users/{uid}`

| Field       | Type   | Description                                                        |
|-------------|--------|----------------------------------------------------------------------|
| `firstName` | string | Set from the Google display name on first login, user-editable after |
| `lastName`  | string | Same as above                                                         |
| `email`     | string | Synced from Google on every login                                    |
| `photoURL`  | string | Synced from Google on every login — **never user-editable**          |
| `oooStart`  | string\|null | Out of office start date (`YYYY-MM-DD`), see "Out of Office" below |
| `oooEnd`    | string\|null | Out of office end date (`YYYY-MM-DD`)                          |
| `role`      | string | `'admin' \| 'member'`. Set once, at profile-creation time — see "ADMIN role bootstrap" below |
| `theme`     | string | `'light' \| 'dark'`, optional — see `ThemeContext.jsx`         |

**Important**: `AuthContext.jsx` only writes `firstName`/`lastName`/`role` on the user's *first* login (doc doesn't exist yet). On subsequent logins it only refreshes `email`/`photoURL` via a merge write — this is deliberate so a user's manual name edit in `ProfilePage` is never clobbered by the next Google sign-in, and so `role` (once assigned) can never be silently reset. `oooStart`/`oooEnd`/`theme` are never touched by the login flow at all — they're only ever written from `ProfilePage.jsx`.

### `projects/{projectId}`

| Field       | Type     | Description                                    |
|-------------|----------|--------------------------------------------------|
| `name`      | string   | The project's only defining field                |
| `createdBy` | string   | uid of the admin who created it                  |
| `memberIds` | string[] | uids with access to this project                 |

### `invites/{email}`

Doc id = lowercased email. One doc per email accumulates invites across **all** projects that email has been invited to:

| Field      | Type | Description                                                             |
|------------|------|-----------------------------------------------------------------------------|
| `email`    | string | Same as the doc id, kept as a field too for convenience                   |
| `projects` | map    | `{ [projectId]: { projectName, invitedBy, invitedAt } }`                  |

Accepted automatically by `AuthContext.jsx#acceptPendingInvites` on the invitee's *next* login — see "Project invites" below.

### `taskTemplates/{templateId}`

| Field         | Type   | Description                                              |
|---------------|--------|------------------------------------------------------------|
| `projectId`   | string | Owning project — every read/write is scoped by this        |
| `name`        | string | e.g. "SAFT"                                                |
| `description` | string | Optional                                                   |
| `color`       | string | Hex color, copied onto tasks created from this template   |
| `recurrence`  | object | `{ enabled: boolean, dayOfMonth: number }`                 |
| `createdBy`   | string | uid                                                        |

### `clients/{clientId}`

| Field       | Type   | Description        |
|-------------|--------|-----------------------|
| `projectId` | string | Owning project          |
| `name`      | string | Client name            |
| `notes`     | string | Optional free text     |
| `createdBy` | string | uid                     |

Clients are a first-class domain entity, not a free-text field on the task. `TaskModal.jsx` references them by `clientId` via a native `<select>` (see "Client picker" below), and `ClientsPage.jsx` is where they're created/edited/removed.

### `tasks/{taskId}`

| Field             | Type          | Description                                                                 |
|-------------------|---------------|---------------------------------------------------------------------------------|
| `projectId`       | string        | Owning project — added by `useTasks.js#createTask`, never editable after creation |
| `title`           | string        | What needs to be done                                                          |
| `description`     | string        | Markdown text, may include embedded images (`![alt](url)`), may be empty       |
| `clientId`        | string\|null  | id of the `clients/{clientId}` doc this task is for                            |
| `dueDate`         | string        | `YYYY-MM-DD`                                                                    |
| `assignedTo`      | string\|null  | uid of the single current assignee                                             |
| `precedingTaskId` | string\|null  | id of the task this one depends on                                             |
| `templateId`      | string\|null  | id of the template used to create this task                                    |
| `color`           | string        | Hex highlight color                                                            |
| `progress`        | string        | `'todo' \| 'in_progress' \| 'done'` — the only persisted lifecycle field       |
| `recurrence`      | object        | `{ enabled: boolean, dayOfMonth: number }` — usually copied from a template but overridable per task |
| `lastCycleKey`    | string\|null  | `YYYY-MM` of the last cycle this task was reset for                            |
| `createdBy`       | string        | uid                                                                             |

### `tasks/{taskId}/comments/{commentId}`

| Field              | Type      | Description                                                       |
|--------------------|-----------|---------------------------------------------------------------------|
| `text`             | string    | Markdown, may include embedded images                               |
| `authorId`         | string    | uid                                                                  |
| `authorFirstName`  | string    | Denormalized from the author's profile **at comment creation time** |
| `authorLastName`   | string    | Same                                                                 |
| `authorPhotoURL`   | string    | Same                                                                 |
| `createdAt`        | Timestamp | `serverTimestamp()`                                                  |

`useComments.js` denormalizes author name/photo onto the comment doc instead of joining against `users` at render time — deliberate, so old comments keep showing the name/photo the author had *when they posted*, and so `TaskComments.jsx` doesn't need the full `users` list as a prop. Don't "fix" this by looking up the live user doc per comment; that's a behavior change, not a bug fix.

---

## Key Business Logic

### Derived board status (`stage`), not stored

`src/utils/taskLogic.js#computeStage(task, tasksById)` is the single source of truth for what column a task appears in:

1. `progress === 'in_progress'` → **Em Progresso**
2. `progress === 'done'` → **Terminado**
3. else, if `precedingTaskId` points at a task whose `progress !== 'done'` → **Bloqueado**
4. else → **Pronto para Começar**

This is intentionally **not** a persisted field — it's recomputed on every render from the live `tasks` snapshot, so finishing a blocking task instantly frees every dependent task with zero extra writes. Do not add a stored `stage`/`status` field for this; it would need to be kept in sync manually and could desync.

### Single assignee, mutable

Only `assignedTo` (a single uid or `null`) exists — there is no multi-assignee array. Reassigning is just a field update (`reassignTask` / drag-and-drop onto a different swimlane row in `BoardPage.jsx`).

### Recurrence reset — client-side, opportunistic

`useTasks.js` runs `getRecurrenceReset(task, now)` against every task on every snapshot. If the task is recurring, today's date is past `recurrence.dayOfMonth`, and `lastCycleKey` doesn't match the current `YYYY-MM`, it writes back `{ progress: 'todo', dueDate: <recomputed>, lastCycleKey: <current> }`.

**This has no server-side/scheduled equivalent.** The reset only fires when some authenticated client has the app open and receives a Firestore snapshot for that task. If exact-midnight resets become a requirement, add a scheduled Cloud Function instead of relying on this client-side check — do not try to "fix" this by adding a `setInterval` poll in the browser, since the app can simply be closed on the 1st of the month.

### Drag and drop

Implemented with **native HTML5 DnD** (`draggable`, `onDragStart`, `onDrop`) in `BoardPage.jsx` — no external DnD library. Dropping a card:
- into a different **column** → updates `progress` (mapped: Blocked/Ready columns → `'todo'`, In Progress → `'in_progress'`, Done → `'done'`)
- into a different **row** → updates `assignedTo`
- both can change in a single drop

Dropping a currently-blocked task (`stage === 'blocked'`) onto the In Progress or Done column is a no-op (see `handleDrop` in `BoardPage.jsx`) — blocked tasks cannot be advanced regardless of what the UI drag gesture suggests.

### Board filters (client-side only)

`BoardPage.jsx` holds three pieces of local UI state — `assigneeFilter`, `clientFilter`, `sortOrder` — applied entirely in-memory over the already-subscribed `tasks` array (no extra Firestore queries):
- `assigneeFilter`: `'all' | uid | 'unassigned'`. When set to a specific value, only that swimlane row is rendered (see the `lanes` memo).
- `clientFilter`: `'all' | clientId`, filters `tasks` by `task.clientId` before lanes are built.
- `sortOrder`: `'due_asc' | 'due_desc'`, applied per-column-cell (`sortTasks`) — this is the "priority by due date" control. Tasks with no `dueDate` always sort last regardless of direction.

### Swimlane ordering and default expand/collapse

`BoardPage.jsx` sorts assigned lanes alphabetically by `getFullName(user)` (`nameSortDir`, toggled via the button next to the "Responsável" column header — `ArrowDownAZ`/`ArrowDownZA` icons), with the unassigned lane always pinned last regardless of direction.

Each lane's expand/collapse state is resolved by `isLaneExpanded(laneKey)`: it checks `expandedOverrides[laneKey]` first (set when the user manually clicks a lane header), and falls back to `laneKey === currentUserId` — i.e. **only the signed-in user's own lane is expanded by default**, everyone else's lane renders collapsed (name + avatar + a per-column task-count pill instead of full `TaskCard`s). `currentUserId` is `profile?.uid` passed down from `App.jsx`. Manual overrides are plain component state, not persisted — they reset on reload/re-render of `BoardPage`, which is intentional (the "only my lane expanded" behavior should re-apply each visit, not fight the user's last session).

Collapsed lanes still render one drag-and-drop target `<div>` per stage column (just shorter/compact), so dropping a card onto a collapsed lane's column still reassigns/moves it — collapsing is purely a display choice, not a functional restriction.

### Client picker (native `<select>`, not free text)

`TaskModal.jsx`'s client field is a plain `<select>` populated from the `clients` prop (sorted alphabetically by `useClients`' Firestore query). This is deliberate, not an oversight: native `<select>` elements already implement type-ahead-to-first-letter navigation in every browser, so no combobox library or custom keyboard handling was needed to satisfy that requirement. A "+ Novo" button next to the field opens `ClientModal` in a nested overlay (z-index above the task modal) so a client can be created without losing the in-progress task form; on save it sets `form.clientId` to the newly created client.

### Task detail layout (Jira-style) and the description editor

`TaskModal.jsx` was deliberately redesigned to mirror a Jira issue detail view rather than a conventional stacked form:
- Title is a large, borderless `<input>` at the very top of the modal body (full width).
- Below it, a `grid grid-cols-1 lg:grid-cols-4` splits the remaining space: `lg:col-span-3` holds the **Descrição** label + `MarkdownEditor`, `lg:col-span-1` holds a `SidebarField`-per-row stack (Cliente, Responsável, Data de Entrega, Depende de, Modelo de Tarefa, Cor de destaque, Tarefa cíclica) inside a `bg-slate-50` panel — this 3/4-vs-1/4 split, and the sidebar's compact "uppercase label above control" styling, is the explicit ask this layout satisfies. Below `lg:` the grid collapses to one column (description first, then sidebar), scrolling as a single body.
- `task.description` is a new, independent Markdown string field — empty by default, never required. It is intentionally the largest control in the form (`min-h-[360px]` on `MarkdownEditor`).
- `TaskComments.jsx` is mounted directly below the description `MarkdownEditor`, still inside `lg:col-span-3` — the ask was for comments to occupy "the same first 3/4 as title/description," so it's stacked under the description rather than placed in the sidebar or as a separate tab.

`MarkdownEditor.jsx` is self-contained (no rich-text/WYSIWYG library): a toolbar of buttons (`TOOLBAR_ACTIONS` array — H1, H2, Bold, Italic, bullet list, numbered list, quote, code) each wrap or prefix the current `<textarea>` selection with the corresponding Markdown syntax via manual `selectionStart`/`selectionEnd` manipulation, then restore focus and cursor position. A "Escrever"/"Pré-visualizar" toggle switches between the raw textarea and a `react-markdown` render. It's the same component instance reused for both the task description and every comment composer (`TaskComments.jsx` renders one per comment form) — any change here affects both surfaces. There's no `@tailwindcss/typography` plugin installed, so the preview's headings/lists/quotes/code are styled by hand-written `.markdown-preview` rules in `index.css` — if you add real prose content elsewhere, prefer adding the typography plugin over duplicating these rules, but don't remove them since this is the only thing giving the preview its typographic hierarchy.

Note: `taskTemplates/{templateId}` also has a field called `description` (a short plain-text blurb about the template) — that's an unrelated, older field in a different collection; don't conflate it with `tasks.description` (Markdown, task-specific).

### Image uploads (Storage) inside MarkdownEditor

`MarkdownEditor.jsx` takes an optional `onUploadImage(file) => Promise<url>` prop. When present, it renders an "Inserir imagem" toolbar button, and also wires `onPaste`/`onDrop` handlers on the textarea to catch image files pasted or dragged in directly — all three paths funnel through the same `handleImageFile()` → `onUploadImage()` → insert `![alt](url)` at the cursor. `App.jsx` supplies this prop as `handleUploadImage = (file) => uploadTaskImage(file, profile.uid)`, passed to both the description editor and (via `TaskComments.jsx`) every comment composer. `src/utils/uploadImage.js#uploadTaskImage` validates the file (`image/*` MIME type, <8MB) client-side before calling `uploadBytes`, but the same limits are re-enforced server-side in `storage.rules` — don't rely on the client check alone if you ever expose this function elsewhere. Uploaded files live at `task-uploads/{ownerUid}/{timestamp}-{sanitizedName}`, readable by any signed-in user but writable only by the owner path segment.

### Out of Office (OOO)

`src/utils/taskLogic.js#isUserOOO(user, now)` does a plain string comparison of today's date (`YYYY-MM-DD`) against `user.oooStart`/`user.oooEnd` (inclusive on both ends) — same date-string convention as `dueDate` elsewhere in this file, no `Date` object round-tripping needed. Returns `false` if either field is missing.

`BoardPage.jsx` computes `oooActive` per lane and, when true, adds an amber left-border + background tint to the lane header button and a `Palmtree`-icon "Férias" pill next to the assignee's name (with a tooltip naming the return date). This is **purely visual** — it does not filter, block, or auto-reassign tasks; a human still has to move the work. Don't wire OOO into `computeStage()` or drag-and-drop logic; those two concerns (workflow stage vs. availability) are intentionally separate.

### Deadline notifications — derived, not persisted, "unread" is impossible by construction

`src/utils/taskLogic.js#getTaskUrgency(task, now)` is the single source of truth: for any task with a `dueDate` and `progress !== 'done'`, it returns `'urgent'` (< 2 days left, including overdue), `'warning'` (≤ 5 days left), or `null`. Like `computeStage()`, this is **recomputed on every render**, never written to Firestore.

This is the entire mechanism behind "notifications can't be marked read, only resolved by completing the task": there is no `read`/`dismissed` field anywhere, and there could not sensibly be one — a notification is just "does this task currently qualify," so completing the task (`progress: 'done'`) is the only way `getTaskUrgency` stops returning non-null for it. Do not add a persisted notification/read-state collection to "fix" this; it would be solving a problem that doesn't exist and would desync from the derived state.

`NotificationBell.jsx` (mounted once in `App.jsx`'s persistent header, not per-page) takes the **full current-project `tasks` array** — explicitly not filtered to `assignedTo === currentUser`, per the requirement that this is project-wide, not personal. It computes the notification list with `useMemo`, sorts urgent-before-warning then by `dueDate` ascending, and renders each row as `{assignee name} — {task.title}` (falling back to "Sem responsável"). The dropdown panel body is capped with `max-h-[22rem] overflow-y-auto` — a fixed height showing roughly 5 rows, not a hard slice of the array — so the badge count and the panel's list always agree; only the *visible* portion is scroll-limited.

Clicking a notification calls the same `onOpenTask`/`openEditTask` handler `BoardPage.jsx` cards use, opening `TaskModal` directly without switching `activeTab` — the modal is already rendered unconditionally at the bottom of `App.jsx`'s JSX regardless of which page is active, so this works from any tab.

`TaskCard.jsx` calls the same `getTaskUrgency()` and applies a matching `ring-2` + tinted background (`URGENCY_CARD_STYLES` map, amber/red) **in addition to** the existing `task.color` left-border — these are two independent visual signals (custom highlight color vs. deadline urgency) and must not be conflated or merged into one.

### Collapsible sidebar, no separate "profile" nav row

`App.jsx` holds a `collapsed` boolean (persisted to `localStorage` under `contaflow:sidebarCollapsed`, independent of the per-project/per-theme keys). When collapsed, `<aside>` shrinks from `w-72` to `w-20`; `NavItem.jsx` takes a `collapsed` prop that suppresses the label span (falls back to a native `title` tooltip) — this is a single shared prop for every nav item plus the logout button, so don't special-case any one of them.

There is deliberately **no** "O Meu Perfil" `NavItem`. Instead, the block showing the avatar/name/email at the bottom of the sidebar is itself a `<button onClick={() => goToTab('profile')}>` — clicking the user's own identity block navigates to `ProfilePage`, both expanded (full block) and collapsed (avatar only, with a `title` tooltip). If you're tempted to re-add a "Perfil" nav item for consistency, don't — this was an explicit simplification request, not an oversight.

### Theme (light/dark)

Tailwind v4's class-based dark variant is opted into explicitly via `@custom-variant dark (&:where(.dark, .dark *));` in `index.css` (v4 defaults to the `prefers-color-scheme` media strategy otherwise, which wouldn't support a manual toggle). `ThemeContext.jsx` toggles the `dark` class on `document.documentElement`, reading/writing `localStorage` (`contaflow:theme`) for an instant, pre-auth default, and syncing with `users/{uid}.theme` once the profile loads (Firestore is the cross-device source of truth; localStorage is just the fast local cache + anti-flash mechanism — there's also an inline script in `index.html` that applies the class before React even mounts, to avoid a flash of the wrong theme).

Every surface in the app carries hand-added `dark:` variants (not a CSS-variable theming layer) — when adding new UI, follow the existing convention rather than introducing a different theming mechanism: `bg-white dark:bg-slate-800` for cards/panels, `bg-slate-50 dark:bg-slate-900` for page backgrounds, `border-slate-100/200 dark:border-slate-700` for borders, `text-slate-800 dark:text-slate-100` for primary text, `text-slate-500 dark:text-slate-400` for secondary text.

### Multi-project data model

The app moved from single-tenant to multi-project. Every `tasks`, `taskTemplates`, and `clients` document now carries a `projectId`; `useTasks`/`useTaskTemplates`/`useClients` all take `projectId` as their first argument and filter with `where('projectId', '==', projectId)` — pass `null`/`undefined` and they return an empty list rather than throwing (checked explicitly at the top of each hook's effect). **Never** query these collections without a `projectId` filter; there is no "all projects" view anywhere in the UI.

`useUsers.js` (no `projectId` param) stays intentionally global — it backs the "add existing user" flow in `ProjectsPage.jsx`, which needs to search across the whole platform, not just current members. `App.jsx` derives `projectUsers = users.filter(u => currentProject.memberIds.includes(u.uid))` and passes *that* filtered list to `BoardPage`/`TaskModal` for anything assignee-related — don't pass the raw global `users` list into project-scoped UI.

#### ADMIN role bootstrap

There's no backend/CLI step to create the first admin. `AuthContext.jsx` calls `getCountFromServer(collection(db, 'users'))` at the moment it's about to create a brand-new user doc; if the count is `0`, that user becomes `role: 'admin'`, otherwise `'member'`. This only runs once, at doc-creation time — it cannot retroactively promote anyone, and there's a small theoretical race if two people sign up at the exact same instant (both could read count `0`). Acceptable for this app's scale; don't "fix" it with a transaction unless multi-admin races become an actual reported problem.

Only admins can create projects (`isAdmin` from `useAuth()`, checked in the UI at `ProjectsPage.jsx`/`ProjectSelectScreen.jsx`, and enforced server-side in `firestore.rules`'s `projects` `create` rule).

#### Project invites — batched acceptance

Inviting an email that doesn't have an account yet writes to `invites/{lowercasedEmail}`, accumulating a `projects` map so the same email can be invited to several projects before ever logging in (`useProjects.js#inviteByEmail`). On every login, `AuthContext.jsx#acceptPendingInvites` reads that doc and applies **all** pending projects in a single `writeBatch()` (`memberIds: arrayUnion(uid)` per project, plus deleting the invite doc) — **not** a `Promise.all` of separate `updateDoc` calls.

This batching is load-bearing, not stylistic: with separate writes, `ProjectContext`'s "my projects" `onSnapshot` listener could observe an intermediate state where only the first project's write had landed, its `projects.length === 1` auto-select effect would fire and lock in that one project, and the user would never see `ProjectSelectScreen` even though a second project membership was about to arrive a moment later. This was caught and fixed during development by testing a user invited to two projects simultaneously — if you ever touch `acceptPendingInvites`, keep it as one atomic batch, or the race comes back.

#### Project selection

`ProjectContext.jsx` subscribes to `projects` via `useProjects(uid)` (`where('memberIds', 'array-contains', uid)`). `currentProjectId` is persisted per-user in `localStorage` (`contaflow:project:{uid}`). `needsProjectSelection` is `true` whenever there's no valid current project selected **and** the user doesn't have exactly one project (in which case auto-select just handles it silently) — this drives whether `App.jsx` renders `ProjectSelectScreen` instead of the normal shell. `ProjectSelectScreen` covers both the "0 projects" case (admins get a "create first project" CTA, non-admins get a "ask an admin" message) and the "pick one of several" case.

#### Member management

`ProjectsPage.jsx` lets whoever created a project (`project.createdBy === uid`) or any admin expand it and manage members: add an existing platform user directly (`addMemberToProject`, an immediate `arrayUnion`), or invite by email (`inviteByEmail`, goes through the `invites` collection above). There is no persisted "pending invites" list shown in the UI — once an invite is sent there's no way to see/revoke it before it's accepted; if that becomes a requirement, it needs a proper query surface (a `collectionGroup` or reverse index), not just reading the single `invites/{email}` doc.

---

## Authentication

- Firebase Authentication, **Google provider only** (`signInWithPopup` + `GoogleAuthProvider`).
- No email/password flow, no password reset flow — unlike VizinhAI, this app has no such requirement.
- User photo always comes from `user.photoURL` (Google); if empty or the `<img>` fails to load, `Avatar.jsx` falls back to a colored circle with the user's initials (first letter of `firstName` + first letter of `lastName`).

---

## UI/UX Patterns

- **Styling**: Tailwind CSS v4 utility classes, rounded-2xl/3xl cards, slate color palette, indigo-600 accent (vs. VizinhAI's blue-600).
- **Layout**: Sidebar (desktop) + hamburger menu (mobile), responsive with `lg:` breakpoints — same pattern as VizinhAI's `App.jsx`.
- **Board**: CSS Grid with a fixed first column (assignee, `260px`) and one column per stage; horizontally scrollable on narrow viewports. Amber is used for both the OOO lane indicator and the "warning" deadline urgency (task card ring/tint + notification dot) — these are different concerns that happen to share a color on purpose (both mean "needs attention soon"); red is reserved exclusively for "urgent" deadline urgency, don't reuse it elsewhere.
- **Modals**: Centered overlay with `backdrop-blur-sm`, rounded-3xl panel — same visual language as VizinhAI's forms. `TaskModal.jsx` is the outlier in size (`max-w-6xl h-[88vh]`) since it now holds description + comments + a metadata sidebar; other modals (`ClientModal`, `TemplateModal`) stay small/centered.
- **Color highlight**: task/template color is a hex string rendered as a left border on cards and a tinted badge; picked from `TASK_COLOR_PRESETS` in `taskLogic.js` or a native `<input type="color">`.

---

## Deployment

No CI/CD or hosting has been set up for this project yet (unlike VizinhAI's GitHub Pages workflow). `npm run build` outputs a static `dist/` folder deployable to any static host; wire up hosting and secrets injection when that becomes a requirement.

---

## Firebase Security Rules

Defined in `firestore.rules` and `storage.rules` (both wired into `firebase.json` for the emulators, not yet deployed to a real Firebase project).

`tasks`, `taskTemplates`, and `clients` are gated by an `isProjectMember(projectId)` helper (a `get()` on the relevant `projects/{projectId}` doc, checking `request.auth.uid in ... .memberIds`) — read/write requires membership in the document's `projectId`, checked via `resource.data.projectId` for reads/updates/deletes and `request.resource.data.projectId` for creates. Within a project, rules stay intentionally permissive (any member can edit any task/template/client), mirroring the "any user can create/edit/remove any task" requirement — tighten per-user ownership only if that's ever explicitly asked for.

`projects/{projectId}`: `create` requires `isAdmin()`; `update` allows the creator, any admin, **or** a self-join (any signed-in user appending exactly their own uid to `memberIds` — see "Project invites" above for why this exists despite looking like an odd permission). `invites/{email}` is read/write for any signed-in user — there's no way to scope it more tightly without a backend to broker acceptance.

`tasks/{taskId}/comments/{commentId}`: create requires `authorId == request.auth.uid`, delete requires `resource.data.authorId == request.auth.uid`, and update is always denied — comments are create/delete-only by design (no editing), enforced server-side, not just hidden in the UI.

Storage rules restrict writes under `task-uploads/{uid}/` to that same uid, and require an `image/*` content type under 8MB.

`firestore.indexes.json` defines the composite indexes these scoped queries need (`projectId` + `orderBy`, and `memberIds array-contains` + `orderBy('name')` for `projects`) — the emulator applies them automatically; a real deploy needs `firebase deploy --only firestore:indexes`.

---

## Scripts

| Command          | Description               |
|------------------|----------------------------|
| `npm run dev`    | Start Vite dev server      |
| `npm run build`  | Production build to `dist` |
| `npm run preview`| Preview production build   |
| `npm run emulators` | Start Firebase Auth + Firestore + Storage emulators (`firebase-tools`, no real project needed) |
