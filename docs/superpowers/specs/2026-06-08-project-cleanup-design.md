# Project Cleanup Design Spec

**Date:** 2026-06-08
**Scope:** Git history cleanup + garbage file removal
**Not in scope:** Code restructuring (component/hook slimming, type/import cleanup, naming unification)

## Goal

Organize 79 unstaged files into clean, logical commits with proper prefixes, and remove temporary/garbage files before committing.

## Approach

**Method A: Clean first, then commit.** Remove garbage files before any `git add`, so commit history stays clean.

## Phase 1: Garbage File Removal

Delete the following files/directories:

| Path | Reason |
|------|--------|
| `%USERPROFILE%Desktopweixin-qr.png` | Malformed filename from failed env var expansion |
| `weixin-qr.png` | Duplicate QR code; belongs in public/ if needed |
| `屏幕截图 2026-05-20 221301.png` | Temporary screenshot |
| `新建文件夹/` | Empty directory |
| `Usersnetws.claudetemp-vision-skill/` | Temp vision skill directory |
| `.superpowers/brainstorm/` | Old brainstorm session cache (both subdirs) |
| `p2p-fix-plan.md` | Outdated plan; fixes already in working tree |
| `plan-for-codex.md` | Outdated plan; changes already in working tree |

After deletion, stage and commit as a single `chore` commit.

## Phase 2: Module-based Commits

### Commit 1 — `chore: remove temp files and outdated plans`
All deletions from Phase 1.

### Commit 2 — `feat: Liquid Glass theme system`
Files:
- `src/contexts/` (ThemeProvider)
- `src/lib/theme/` (themes.ts, storage.ts)
- `src/lib/animations/` (GSAP helpers, hooks)
- `src/app/globals.css` (CSS theme variables)
- `src/components/ui/ThemeSwitcher.tsx`
- Any component changes that are purely theme-related (color variable swaps, glass class additions)

### Commit 3 — `refactor: unify UI to Liquid Glass style`
Files:
- All `src/components/<tool>/` UI updates (draw-guess, group-chat, file-transfer, everything-files, media, obsidian, fruit-slice, qr-code, metronome, piano, system)
- Hook changes that are purely UI-adaptation (not new feature logic)
- `src/components/ui/` shared component updates (Sidebar, AppShell, ToolCard, GlassPanel, PageTransition, iconMap)

### Commit 4 — `feat: music player module`
Files:
- `src/app/tools/music-player/page.tsx`
- `src/components/music-player/` (all components)
- `src/hooks/useMusicPlayer.ts`
- `src/lib/audio/player-engine.ts`
- `src/lib/music/` (music-storage.ts)
- `src/app/api/music/` (upload, library routes)
- `src/types/music-player.ts`

### Commit 5 — `feat: P2P transfer + todo modules`
Files:
- `src/app/tools/p2p-transfer/page.tsx`
- `src/app/tools/todo/page.tsx`
- `src/components/p2p-transfer/`
- `src/components/todo/`
- `src/hooks/useP2PTransfer.ts`
- `src/hooks/useTodo.ts`
- `src/types/p2p.ts`
- `src/types/todo.ts`

### Commit 6 — `chore: server refactor, deps, config updates`
Files:
- `server/ws-server.mjs` (unified WS refactor, deleted chat-server.mjs)
- `server/dev.mjs`
- `package.json` / `package-lock.json`
- `next.config.ts`
- `CLAUDE.md`
- `src/app/api/` route changes (download, everything, files, media, obsidian, chat)
- Any remaining unstaged files not covered above

## Rules for Ambiguous Files

- A file that spans two commits (e.g., a hook with both theme changes and new feature logic) goes to the **feature** commit, not the theme commit.
- When in doubt, group by "what would a reviewer expect this change to be bundled with?"
- Every commit must leave the app in a buildable state.

## Verification

After all commits:
1. `git status` should show clean working tree
2. `npm run build` should succeed
3. `git log --oneline -6` should show 6 clean, well-named commits
