import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { cn } from './Button'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  labelClassName?: string
  clearable?: boolean
  onClear?: () => void
  showPasswordToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, labelClassName, clearable, onClear, value, type, showPasswordToggle, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordType = type === 'password'
    const inputType = isPasswordType && showPasswordToggle && showPassword ? 'text' : type

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className={cn("block text-sm font-medium mb-1", labelClassName || "text-brand-brown")}>
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            id={id}
            ref={ref}
            value={value}
            type={inputType}
            className={cn(
              'flex h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-tan focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-brand-brown',
              (clearable && value || (showPasswordToggle && isPasswordType)) && 'pr-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {showPasswordToggle && isPasswordType && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-brand-tan transition-colors p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}

            {clearable && value && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onClear?.();
                }}
                className="text-gray-400 hover:text-brand-brown transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

