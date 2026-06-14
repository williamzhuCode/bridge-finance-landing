# Bridge Finance — Landing Page

Static landing page for William Zhu, Bridge Finance mortgage broker.

- `index.html` — the page (inline CSS, markup).
- `main.js` — interactive behaviour (enquiry modal + animated stats counters),
  extracted from the HTML so it can be unit-tested.

## Tests

The interactive logic is covered by [Vitest](https://vitest.dev/) running in a
jsdom environment.

```bash
npm install      # one-time
npm test         # run the suite once
npm run test:watch
npm run coverage # coverage report for main.js
```

Suites live in `test/`:

| File | Covers |
|------|--------|
| `modal.test.js` | Modal navigation state machine, step visibility, backdrop click-to-close |
| `enquiry.test.js` | Enquiry + property-review form validation and `mailto:` encoding |
| `stats.test.js` | `easeOut`, `animateCount`, the stats fire-once guard and star reveal |

Tests run automatically on push and pull request via
`.github/workflows/test.yml`.
