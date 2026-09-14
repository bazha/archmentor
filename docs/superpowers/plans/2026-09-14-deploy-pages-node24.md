# Silence the Node.js 20 deprecation warning on deploy.yml — plan

**Status:** executed inline on 2026-09-14.

**Goal:** Stop `deploy.yml` from logging the "Node.js 20 is deprecated ... actions/deploy-pages@v4"
warning on every deploy.

**Spec:** `docs/superpowers/specs/2026-09-14-deploy-pages-node24-design.md`

## Task: Bump `actions/deploy-pages` to the Node-24-native major

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [x] **Step 1:** Change `uses: actions/deploy-pages@v4` to `uses: actions/deploy-pages@v5`
  (`v5.0.0`, released 2026-03-24, updates the action's bundled Node runtime to 24.x — confirmed via
  the action's GitHub release notes).
- [x] **Step 2:** Run `npm test` and `npx tsc --noEmit` — both must stay green (no app code touched,
  this is a CI-only YAML change).
- [x] **Step 3:** Commit.

## Definition of done

- [x] `.github/workflows/deploy.yml` pins `actions/deploy-pages@v5`.
- [x] `npm test` and `npx tsc --noEmit` green.
