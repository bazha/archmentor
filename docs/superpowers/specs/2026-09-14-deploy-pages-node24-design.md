# Silence the Node.js 20 deprecation warning on deploy.yml — design

**Date:** 2026-09-14
**Status:** design approved, executed inline

## Problem

`deploy.yml`'s `deploy` job logs:

> Warning: Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced
> to run on Node.js 24: actions/deploy-pages@v4.

GitHub is retiring the Node 20 runtime for actions (see the 2025-09-19 changelog) and forcing
Node-20 actions onto Node 24 in the meantime. `actions/deploy-pages@v4` still bundles a Node-20
runtime internally, hence the warning on every deploy.

## Fix

`actions/deploy-pages` shipped `v5.0.0` (2026-03-24, "Update Node.js version to 24.x") specifically
to fix this. Bump the pin in `.github/workflows/deploy.yml` from `@v4` to `@v5` — a drop-in
replacement (only internal runtime/dependency changes; no input/output changes affecting our usage).

Other actions in the repo (`checkout@v6`, `setup-node@v4`, `upload-pages-artifact@v3`) are out of
scope: the reported warning names only `deploy-pages@v4`, and only that one has a released
Node-24-native major that the card's warning is asking to be fixed.

## Definition of done

- `.github/workflows/deploy.yml` pins `actions/deploy-pages@v5`.
- `npm test` and `npx tsc --noEmit` stay green (workflow YAML change only; no app code touched).
