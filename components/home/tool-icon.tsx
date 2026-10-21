import {
  BracesIcon,
  CalendarClockIcon,
  ClockIcon,
  FileTextIcon,
  FingerprintIcon,
  GlobeIcon,
  HashIcon,
  ImageIcon,
  KeyRoundIcon,
  LinkIcon,
  ListOrderedIcon,
  type LucideIcon,
  NotebookPenIcon,
  PaletteIcon,
  QrCodeIcon,
  ShieldIcon,
  TableIcon,
  TextIcon,
  UploadIcon,
} from 'lucide-react'

import { type ToolIcon } from '@/lib/tools/registry'

const ICONS: Record<ToolIcon, LucideIcon> = {
  braces: BracesIcon,
  fingerprint: FingerprintIcon,
  globe: GlobeIcon,
  hash: HashIcon,
  shield: ShieldIcon,
  'list-ordered': ListOrderedIcon,
  clock: ClockIcon,
  'calendar-clock': CalendarClockIcon,
  'qr-code': QrCodeIcon,
  'key-round': KeyRoundIcon,
  'file-text': FileTextIcon,
  upload: UploadIcon,
  image: ImageIcon,
  link: LinkIcon,
  'notebook-pen': NotebookPenIcon,
  text: TextIcon,
  table: TableIcon,
  palette: PaletteIcon,
}

export function ToolIconView({ name, className }: { name: ToolIcon; className?: string }) {
  const Icon = ICONS[name]
  return <Icon className={className} aria-hidden />
}
