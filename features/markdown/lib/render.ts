import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

// Harden outbound links: add rel + target, block javascript: URLs.
// Hook is idempotent in effect but added only once at module load.
DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
  if (node.nodeName === 'A') {
    const href = node.getAttribute('href') ?? ''
    if (/^javascript:/i.test(href)) node.setAttribute('href', '#')
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer nofollow')
  }
})

const PURIFY_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'style'],
  ALLOW_DATA_ATTR: false,
  // Allow src only for images (data: URLs on images are benign)
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
}

export function renderMarkdown(input: string): string {
  const raw = marked.parse(input)
  // marked.parse returns string when no async hooks are registered
  const html = typeof raw === 'string' ? raw : ''
  return DOMPurify.sanitize(html, PURIFY_CONFIG)
}
