'use client'

import { useCallback, useState } from 'react'

import { type VariantProps } from 'class-variance-authority'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button, type buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyButtonProps extends VariantProps<typeof buttonVariants> {
  value: string
  label?: string
  className?: string
}

export function CopyButton({
  value,
  label = 'Copy',
  variant = 'outline',
  size = 'sm',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const isIconOnly = typeof size === 'string' && size.startsWith('icon')

  const handleCopy = useCallback(async () => {
    let success = false
    try {
      await navigator.clipboard.writeText(value)
      success = true
    } catch {
      // Legacy fallback for browsers without clipboard API
      try {
        const el = document.createElement('textarea')
        el.value = value
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand('copy')
        document.body.removeChild(el)
        success = true
      } catch {
        // both methods failed
      }
    }

    if (success) {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } else {
      toast.error('Failed to copy')
    }
  }, [value])

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {!isIconOnly && label}
    </Button>
  )
}
