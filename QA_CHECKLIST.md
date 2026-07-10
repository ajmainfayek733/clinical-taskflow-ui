# Frontend QA Checklist (TaskFlow UI)

Use this checklist to validate the frontend repository end-to-end before submission.

## Environment & startup

- [ ] Node version is `20.18.0` (or compatible `>=20.18.0`)
- [ ] `npm install` completes successfully
- [ ] `.env.local` contains `NEXT_PUBLIC_API_URL`
- [ ] `npm run dev` starts app on `http://localhost:3000`

## Authentication UX

- [ ] Login page loads and shows demo credentials
- [ ] Invalid login shows error UI
- [ ] Successful login redirects to `/tasks`
- [ ] Logged-out user opening `/tasks` is redirected to `/login?next=/tasks`
- [ ] Logged-out user opening `/annotate` is redirected to `/login?next=/annotate`
- [ ] Navbar is dynamic:
  - [ ] Logged out: Sign in button only
  - [ ] Logged in: Work Board + Image Review + Sign out

## Task board (`/tasks`)

- [ ] Date selector changes currently displayed tasks
- [ ] Create task via modal (title, due date, status, priority, tags)
- [ ] Edit task via modal
- [ ] Delete task works
- [ ] DnD between columns works using drag handle
- [ ] Clicking Edit/Delete does not accidentally trigger drag
- [ ] Reorder persists after refresh (when backend is running)
- [ ] Empty-column CTA appears and opens modal

## Annotation workspace (`/annotate`)

### Upload and series
- [ ] Upload panel blocks submission when no identifier is provided
- [ ] Upload works when any identifier (`patient_id` / `patient_code` / `test_code`) is set
- [ ] Series list appears and allows switching active series
- [ ] Series switching updates images rendered in workspace

### Canvas tools
- [ ] Default tool is Select
- [ ] Annotate mode lets user add vertices and manually close polygon by clicking first point
- [ ] Polygon does not auto-close unexpectedly
- [ ] Pan mode drags image correctly
- [ ] Zoom in/out and reset view work

### Polygon management
- [ ] Saved polygons list is compact and selectable via checkbox
- [ ] Selecting polygon on canvas syncs with list selection
- [ ] Delete selected polygons (header delete icon) works
- [ ] Clear current image annotations works
- [ ] Clear current series annotations opens confirmation modal

### Notes
- [ ] Image note autosaves with 500ms debounce (not blur-triggered)
- [ ] Series review autosaves with 500ms debounce (not blur-triggered)
- [ ] Series review displays on first load of selected series
- [ ] Switching series loads the correct per-series review note

## Styling & responsiveness

- [ ] Layout remains usable at mobile widths (login, tasks, annotate)
- [ ] Buttons, inputs, cards use consistent visual system
- [ ] No text overlap/truncation issues in nav and panels

## Frontend quality gates

- [ ] `npm run lint` passes
- [ ] `npm run build` passes

## Deployment readiness (Render)

- [ ] `render.yaml` exists and has build/start commands
- [ ] `build.sh` is executable and valid
- [ ] `.node-version` is present
- [ ] `NEXT_PUBLIC_API_URL` set correctly in Render dashboard

