# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A small Vue 3 + Vite single-page app for drilling English vocabulary flashcards with Russian translations. Deployed to GitHub Pages at https://oberst472.github.io/teach/.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — production build into `dist/`
- `npm run deploy` — publish `dist/` to the `gh-pages` branch by hand (run `build` first)

Deployment is normally automatic: `.github/workflows/deploy.yml` builds and publishes `dist/` to `gh-pages` on every push to `master`.

There are no tests, linter, or type-checker configured. `<script setup lang="ts">` blocks are transpiled by Vite/esbuild only (TypeScript is not a dependency), so type errors are not caught.

## Architecture

- `src/App.vue` holds almost all app logic and state in a single `reactive` `data` object: category selection, random word picking, prompt reveal, and keyboard shortcuts (`keyup` listener: Space/ShiftRight reveal the answer; Enter/ArrowRight/MetaRight go to the next word).
- Word selection draws randomly without replacement from `data.els` (a deep copy of the current category); when it empties, it refills from `data.defaultEls`. The counter in the UI shows how many words remain.
- "Change algorithm" (`isAlgorithmChanged`) swaps which side (`original` vs `translate`) is shown as the question.
- The active category persists in `localStorage` (`activeCategoryWord`).
- `src/components/sections/keyboard/index.vue` (`SectionKeyboard`) is a typing-practice overlay: it shuffles the current category's `translate` strings, joins them, and colors each character green/red as the user types; it reshuffles once the full length is typed.

## Vocabulary data

Each week is its own file, `src/jsons/en/weeks/week_N.json`. `src/jsons/en/index.js` loads them all with `import.meta.glob`, sorts them by week number, and exports `en`: an object whose keys (`week_N`) are the categories shown in the sidebar. To add a week, just create a new `week_N.json`; gaps in the numbering are fine. `src/jsons/en/idioms.json` is a separate flat list of words, added after the weeks as the `idioms` category; `src/jsons/en/all_prepositions.json` is likewise a flat list (the `all prepositions` category) with one short example sentence for each preposition entry from every week, and `all_phrasal_verbs.json` (the `all phrasal verbs` category) does the same for phrasal verbs. Words are objects of the form:

```js
{ id: <unique number>, original: '...', translate: '...', isActive: true }
```

- `original` is the prompt side, `translate` is the answer side. Both are rendered with `v-html`, so `<b>...</b>` can be used for highlighting (styled green globally); the keyboard overlay strips `<b>` tags.
- Each week file is an array of groups, `[{ title: 'words', items: [...] }, { title: 'prepositions', items: [...] }, { title: 'phrasal verbs', items: [...] }]`. (`App.vue` also still accepts a plain array of words as a category.) A group may have an optional `description` HTML string (see the `grammar` group in `week_1`), shown at the top of the word list when that group is selected. The sidebar shows the key as a header with the groups nested under it; `App.vue` flattens them via the `categories` computed into keys like `week_1 / words`, which is also what gets stored in `localStorage`.
- The first selectable category is the default when nothing is stored yet.
- `isActive` is currently not used for filtering.

## Notes

- `vite.config.js` sets an absolute `base` pointing at the GitHub Pages URL; keep it in mind if asset paths break locally or when changing the deploy target.
- `/favicon.svg` is served from `public/`.
- Styles are SCSS with BEM-style class names (`app__nav-item--active`), scoped by block name rather than `scoped` attributes.
