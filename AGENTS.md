<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# li-agent-platform

Study/experimental Next.js app (`projects/personal/study/`). Currently a fresh `create-next-app` scaffold (one commit) — only `src/app/layout.tsx`, `page.tsx`, `globals.css` exist. npm is the package manager.

## Commands

- `npm run dev` — dev server on http://localhost:3000 (Turbopack, default)
- `npm run build` — production build (Turbopack default; adding a `webpack` config to `next.config.ts` makes the build fail on purpose)
- `npm run lint` — ESLint 9 flat config via plain `eslint` (no `next lint`)
- `npx next typegen` — regenerate route type helpers into `.next/types`
- No test framework is configured.

## Stack & conventions

- TypeScript `strict`; path alias `@/*` → `src/*` (tsconfig.json).
- Tailwind CSS v4 is CSS-first: theme tokens live in `@theme inline` in `src/app/globals.css`; there is no `tailwind.config` file.
- React Compiler is enabled (`reactCompiler: true`). Don't add manual `useMemo`/`useCallback`/`React.memo`; keep components pure and obey hook rules exactly — the compiler enforces them at build time.
- Fonts load via `next/font` (Geist) in `src/app/layout.tsx`.

## Next.js 16 gotchas (differs from older Next.js in training data)

- `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are **async-only** — always `await`; sync access was removed in 16.
- Type route props with the global helpers `PageProps<'/path'>`, `LayoutProps<'/path'>`, `RouteContext` (see `LayoutProps<"/">` in layout.tsx). Run `npx next typegen` if they're missing.
- `revalidateTag(tag, profile)` now requires a second `cacheLife` profile argument; use `updateTag` for immediate (non-SWR) expiration.
- The network-boundary convention is `proxy.ts` (renamed from `middleware.ts`); it runs on the nodejs runtime only, not edge.
- Version-matched docs are bundled at `node_modules/next/dist/docs/` — read the relevant guide (e.g. `01-app/02-guides/upgrading/version-16.md`) before writing feature code. The managed block above is re-added by `next dev`; keep it and commit it.
