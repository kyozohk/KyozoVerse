/**
 * Escape user-supplied strings before interpolating into an HTML email body
 * or any other HTML context.
 *
 * Why this exists: prior to the May 2026 audit, several email-sending routes
 * (waitlist approve/reject, post-publish notifications) interpolated user
 * input — first names, last names, post titles, community handles — directly
 * into HTML template literals. An attacker who controlled any of those
 * fields (e.g. "<script>alert(1)</script>" as a first name on signup) could
 * inject arbitrary content into transactional emails sent from a verified
 * Kyozo domain. That's a phishing primitive even if the recipient's email
 * client doesn't run scripts.
 *
 * Use this for ANY user-controlled string interpolated into HTML.
 *
 * Do NOT use it on URLs you build into hrefs — for those, use
 * `escapeHtmlAttr()` plus a URL allow-list check.
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Escape a value going into an HTML attribute (between quotes).
 * Equivalent to escapeHtml() but kept separate for intent clarity.
 */
export function escapeHtmlAttr(input: unknown): string {
  return escapeHtml(input);
}

/** Convenience tagged-template literal: html`<p>${userInput}</p>`. */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let out = '';
  for (let i = 0; i < strings.length; i++) {
    out += strings[i];
    if (i < values.length) out += escapeHtml(values[i]);
  }
  return out;
}
