import type { HTMLAttributes } from 'react'
import { cn } from './Button'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-brand-beige text-brand-brown border border-brand-stone',
    success: 'bg-[#e7f5e9] text-[#2e7d32] border border-[#c8e6c9]',
    warning: 'bg-[#fff8e1] text-[#f57f17] border border-[#ffecb3]',
    danger: 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]',
    info: 'bg-[#e3f2fd] text-[#1565c0] border border-[#bbdefb]',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
