import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

// Harden outbound links: add rel + target, block javascript:/data: URLs.
// NOTE: DOMPurify hooks are process-global. This is safe today because
// nothing else in the bundle calls DOMPurify, but if a future tool needs
// its own DOMPurify instance it should create one via DOMPurify(window)
// rather than using the default singleton, so these hooks don't bleed in.
DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
  if (node.nodeName === 'A') {
    const href = node.getAttribute('href') ?? ''
    if (/^(?:javascript|data):/i.test(href)) node.setAttribute('href', '#')
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
  const html = marked.parse(input, { async: false })
  return DOMPurify.sanitize(html, PURIFY_CONFIG)
}
