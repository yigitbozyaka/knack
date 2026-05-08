import {
  BracesIcon,
  FileTextIcon,
  HashIcon,
  ImageIcon,
  KeyRoundIcon,
  LinkIcon,
  ListOrderedIcon,
  type LucideIcon,
  NotebookPenIcon,
  QrCodeIcon,
  UploadIcon,
} from 'lucide-react'

export const TOOL_CATEGORIES = ['Text & Code', 'Generators', 'Storage', 'Network', 'Notes'] as const
export type ToolCategory = (typeof TOOL_CATEGORIES)[number]

export type ToolStatus = 'live' | 'soon'

export interface Tool {
  slug: string
  name: string
  description: string
  icon: LucideIcon
  status: ToolStatus
  category: ToolCategory
}

export const TOOLS: readonly Tool[] = [
  {
    slug: 'json',
    name: 'JSON formatter',
    description: 'Pretty-print, minify, and validate JSON. No size cap.',
    icon: BracesIcon,
    status: 'soon',
    category: 'Text & Code',
  },
  {
    slug: 'base64',
    name: 'Base64 encoder',
    description: 'Encode and decode UTF-8 text and small files to and from base64.',
    icon: HashIcon,
    status: 'soon',
    category: 'Text & Code',
  },
  {
    slug: 'diff',
    name: 'Text diff',
    description: 'Two-pane diff with word-level highlights.',
    icon: ListOrderedIcon,
    status: 'soon',
    category: 'Text & Code',
  },
  {
    slug: 'qr',
    name: 'QR generator',
    description: 'Generate a QR code from any string. Download as PNG or SVG.',
    icon: QrCodeIcon,
    status: 'soon',
    category: 'Generators',
  },
  {
    slug: 'password',
    name: 'Password generator',
    description: 'Strong random passwords with adjustable length and character set.',
    icon: KeyRoundIcon,
    status: 'soon',
    category: 'Generators',
  },
  {
    slug: 'paste',
    name: 'Paste',
    description: 'Share text snippets with optional expiry. Anonymous or signed-in.',
    icon: FileTextIcon,
    status: 'soon',
    category: 'Storage',
  },
  {
    slug: 'upload',
    name: 'File drop',
    description: 'Drop a file, get a short link with content-disposition download.',
    icon: UploadIcon,
    status: 'soon',
    category: 'Storage',
  },
  {
    slug: 'image-convert',
    name: 'Image converter',
    description: 'Convert PNG, JPEG, WebP, AVIF — your image, your browser.',
    icon: ImageIcon,
    status: 'soon',
    category: 'Storage',
  },
  {
    slug: 'short',
    name: 'URL shortener',
    description: 'Tiny knack.wtf links. Optional expiry. No tracking.',
    icon: LinkIcon,
    status: 'soon',
    category: 'Network',
  },
  {
    slug: 'note',
    name: 'Burn-after-reading note',
    description: 'Encrypted note that destroys itself after the first read.',
    icon: NotebookPenIcon,
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
