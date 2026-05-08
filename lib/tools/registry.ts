export const TOOL_CATEGORIES = ['Text & Code', 'Generators', 'Storage', 'Network', 'Notes'] as const
export type ToolCategory = (typeof TOOL_CATEGORIES)[number]

export type ToolStatus = 'live' | 'soon'

export const TOOL_ICONS = [
  'braces',
  'fingerprint',
  'hash',
  'list-ordered',
  'qr-code',
  'key-round',
  'file-text',
  'upload',
  'image',
  'link',
  'notebook-pen',
] as const
export type ToolIcon = (typeof TOOL_ICONS)[number]

// Tool data is serializable (string icon keys instead of component refs) so
// the registry can be passed from a Server Component into a Client Component
// without tripping React's "Functions cannot be passed directly" boundary.
// Client-side icon resolution happens in components/home/tool-icon.tsx.
export interface Tool {
  slug: string
  name: string
  description: string
  icon: ToolIcon
  status: ToolStatus
  category: ToolCategory
}

export const TOOLS: readonly Tool[] = [
  {
    slug: 'generate/uuid',
    name: 'UUID generator',
    description: 'Generate RFC-compliant UUID v4 and v7 identifiers in your browser.',
    icon: 'fingerprint',
    status: 'live',
    category: 'Generators',
  },
  {
    slug: 'json',
    name: 'JSON formatter',
    description: 'Pretty-print, minify, and validate JSON. No size cap.',
    icon: 'braces',
    status: 'soon',
    category: 'Text & Code',
  },
  {
    slug: 'base64',
    name: 'Base64 encoder',
    description: 'Encode and decode UTF-8 text and small files to and from base64.',
    icon: 'hash',
    status: 'soon',
    category: 'Text & Code',
  },
  {
    slug: 'diff',
    name: 'Text diff',
    description: 'Two-pane diff with word-level highlights.',
    icon: 'list-ordered',
    status: 'soon',
    category: 'Text & Code',
  },
  {
    slug: 'qr',
    name: 'QR generator',
    description: 'Generate a QR code from any string. Download as PNG or SVG.',
    icon: 'qr-code',
    status: 'soon',
    category: 'Generators',
  },
  {
    slug: 'password',
    name: 'Password generator',
    description: 'Strong random passwords with adjustable length and character set.',
    icon: 'key-round',
    status: 'soon',
    category: 'Generators',
  },
  {
    slug: 'paste',
    name: 'Paste',
    description: 'Share text snippets with optional expiry. Anonymous or signed-in.',
    icon: 'file-text',
    status: 'soon',
    category: 'Storage',
  },
  {
    slug: 'upload',
    name: 'File drop',
    description: 'Drop a file, get a short link with content-disposition download.',
    icon: 'upload',
    status: 'soon',
    category: 'Storage',
  },
  {
    slug: 'image-convert',
    name: 'Image converter',
    description: 'Convert PNG, JPEG, WebP, AVIF — your image, your browser.',
    icon: 'image',
    status: 'soon',
    category: 'Storage',
  },
  {
    slug: 'short',
    name: 'URL shortener',
    description: 'Tiny knack.wtf links. Optional expiry. No tracking.',
    icon: 'link',
    status: 'soon',
    category: 'Network',
  },
  {
    slug: 'note',
    name: 'Burn-after-reading note',
    description: 'Encrypted note that destroys itself after the first read.',
    icon: 'notebook-pen',
    status: 'soon',
    category: 'Notes',
  },
] as const

export function toolsByCategory(): Map<ToolCategory, Tool[]> {
  const map = new Map<ToolCategory, Tool[]>()
  for (const category of TOOL_CATEGORIES) {
    map.set(category, [])
  }
  for (const tool of TOOLS) {
    map.get(tool.category)?.push(tool)
  }
  return map
}
