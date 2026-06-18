# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page marketing site for **Bridge Finance** — William Zhu, a Sydney mortgage broker. It is a static landing page with no backend, no framework, and no build step.

## Architecture

The entire site is one file: **`index.html`**. HTML, CSS (in a `<style>` block in `<head>`), and JavaScript (in a `<script>` block before `</body>`) all live there. There is no bundler, package manager, transpiler, or dependency install — what's in the file is what ships. The only external dependency is Google Fonts (Playfair Display for headings, Inter for body), loaded via `<link>`.

Assets are committed PNG/JPG files referenced by relative path: `logo-full.png` (header), `logo-icon.jpg` (footer), `william.png` (hero + about headshot). Image tags use `onerror="this.style.display='none'"` so a missing asset degrades gracefully.

Two interactive systems in the inline `<script>`:

- **Enquiry modal** — a multi-step overlay (`#modal-overlay`). `openModal(type)` opens it; `'property-review'` jumps straight to the dedicated property-review step (`modal-step-pr`), anything else starts at step 1 (situation picker) → step 2 (contact details) → step 3 (thank you). `showStep(n)` / `hideAllSteps()` toggle visibility. There is **no server submission**: `submitEnquiry()` and `submitPropertyReview()` build a `mailto:` link to `williamzhu@bridge-finance.com.au` and open the user's mail client. Changing where enquiries go means editing those two functions.
- **Stats counter animation** — an `IntersectionObserver` on `#stats-section` runs `animateCount()` once the strip scrolls into view, easing each number ($500M+ settled, 90+ lenders, Top 50 CBA, 5-star rating) up from zero. Edit the target values in the observer callback, not the static HTML (the HTML values are placeholders shown before the animation fires).

## Design conventions

- All colors are CSS custom properties on `:root` (`--navy`, `--yellow`, `--yellow-dark`, `--light-bg`, `--text-dark`, `--text-muted`). Use these tokens rather than hardcoding hex values; the navy/yellow palette is the brand identity and repeats throughout.
- Layout is plain CSS Grid/Flexbox with `clamp()` for fluid type and a few `@media` breakpoints (600px, 480px). No CSS framework.
- Section structure repeats a pattern: `<section>` → `.section-inner` (max-width wrapper) → `.section-label` (uppercase eyebrow) → `<h2>` → `.section-sub`. Follow it when adding sections.

## Compliance — do not change without instruction

The footer carries legally required broker disclosures: **Credit Rep No. 567817**, **MFAA Member**, and the "general information only / does not constitute financial advice" disclaimer. Contact details (phone `0492 949 169`, email, socials) appear in multiple places (header CTA, about badge, contact cards, mailto handlers) — update all of them together to stay consistent.

## Workflow

- **Preview:** open `index.html` directly in a browser, or serve the folder (`python3 -m http.server`) and visit `localhost:8000`. No build or install.
- **No tests, no linter, no CI.** Verify changes by eye in the browser, including the mobile breakpoints and the modal flow.
- Commit messages in this repo are short and imperative, describing the user-facing change (e.g. "Fix header CTA button styling", "Add enquiry modal").
