import {
  BracesIcon,
  FileTextIcon,
  FingerprintIcon,
  HashIcon,
  ImageIcon,
  KeyRoundIcon,
  LinkIcon,
  ListOrderedIcon,
  type LucideIcon,
  NotebookPenIcon,
  QrCodeIcon,
  ShieldIcon,
  UploadIcon,
} from 'lucide-react'

import { type ToolIcon } from '@/lib/tools/registry'

const ICONS: Record<ToolIcon, LucideIcon> = {
  braces: BracesIcon,
  fingerprint: FingerprintIcon,
  hash: HashIcon,
  shield: ShieldIcon,
  'list-ordered': ListOrderedIcon,
  'qr-code': QrCodeIcon,
  'key-round': KeyRoundIcon,
  'file-text': FileTextIcon,
  upload: UploadIcon,
  image: ImageIcon,
  link: LinkIcon,
  'notebook-pen': NotebookPenIcon,
}

export function ToolIconView({ name, className }: { name: ToolIcon; className?: string }) {
  const Icon = ICONS[name]
  return <Icon className={className} aria-hidden />
}
