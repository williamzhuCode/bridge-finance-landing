import fs from 'node:fs';
import path from 'node:path';

/*
 * Loads the real markup from index.html into the jsdom document so tests run
 * against the actual page structure rather than a hand-rolled fixture. Returns
 * the body's inner HTML and also installs it on document.body.
 */
export function loadIndexFixture() {
  const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!match) throw new Error('Could not find <body> in index.html');
  document.body.innerHTML = match[1];
  return match[1];
}

/* Convenience: get an element's value/text by id. */
export function setValue(id, value) {
  document.getElementById(id).value = value;
}
