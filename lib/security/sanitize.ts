// Small string-level sanitizers. Knack rarely renders user-supplied HTML
// directly — React's default escaping covers most cases. Reach for these
// when a tool outputs plain text into a non-React boundary (CSV cell,
// download filename, error message echoed in JSON).
//
// When we eventually have a tool that legitimately renders HTML, add a
// proper `sanitizeHtml` here using DOMPurify. Don't roll your own.

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const HTML_ESCAPE_PATTERN = /[&<>"']/g

export function escapeHtml(input: string): string {
  return input.replace(HTML_ESCAPE_PATTERN, (char) => HTML_ESCAPES[char] ?? char)
}

const TAG_PATTERN = /<\/?[^>]+>/g

export function stripHtmlTags(input: string): string {
  return input.replace(TAG_PATTERN, '')
}
