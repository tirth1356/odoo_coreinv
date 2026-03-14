import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const signupSchema = z.object({
  username: z.string()
    .min(6, 'Login ID must be at least 6 characters')
    .max(12, 'Login ID must be at most 12 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a small case character')
    .regex(/[A-Z]/, 'Password must contain a large case character')
    .regex(/[^a-zA-Z0-0]/, 'Password must contain a special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupForm = z.infer<typeof signupSchema>

export const Signup = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
        }
      }
    })
    
    if (authError) {
      console.error('Signup Error:', authError)
      if (authError.message.includes('Database error') || authError.status === 500) {
        setError('Database error: Please ensure you have run the database_setup.sql script in your Supabase SQL Editor.')
      } else {
        setError(authError.message)
      }
      setLoading(false)
    } else {
      setSuccess('Registration successful! Please check your email for verification.')
      setLoading(false)
    }
  }

  const fields = [
    { label: 'Username (Login ID)', placeholder: 'e.g. rajesh_patel', name: 'username' as const, delay: '0.1s' },
    { label: 'Email address', placeholder: 'rajesh@patel.com', name: 'email' as const, type: 'email', delay: '0.18s' },
    { label: 'Password', placeholder: 'Min 8 chars, 1 Upper, 1 Special', name: 'password' as const, type: 'password', delay: '0.26s' },
    { label: 'Re-enter Password', placeholder: 'Confirm your password', name: 'confirmPassword' as const, type: 'password', delay: '0.34s' },
  ]

  return (
    <div
      className="py-8 px-6 sm:px-10 rounded-2xl border border-white/[0.08] shadow-2xl"
      style={{
        background: 'rgba(31, 29, 26, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {fields.map((field) => (
          <div key={field.name} style={{ animation: `fadeInUp 0.5s ease-out ${field.delay} both` }}>
            <Input
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              {...register(field.name)}
              error={errors[field.name]?.message}
              showPasswordToggle={field.type === 'password'}
              labelClassName="text-[#D9D3C7]"
              className="bg-white/[0.06] border-white/[0.1] text-[#F8F6F1] placeholder:text-white/30 focus:ring-[#B8860B] focus:border-[#B8860B]/40"
            />
          </div>
        ))}

        {error && (
          <div
            className="text-sm border border-red-500/20 bg-red-500/10 text-red-300 p-3 rounded-lg font-medium"
            style={{ animation: 'fadeInUp 0.3s ease-out both' }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="bg-[#B8860B]/10 text-[#D4A229] border border-[#B8860B]/25 p-5 rounded-xl text-center space-y-3"
            style={{ animation: 'fadeInUp 0.5s ease-out both' }}
          >
            <p className="font-bold text-base uppercase tracking-tight">Registration successful!</p>
            <p className="text-sm font-medium text-[#D9D3C7]/70">Please check your email for verification.</p>
            <Link to="/login" className="block w-full text-center font-semibold text-[#B8860B] hover:text-[#D4A229] transition-colors pt-2 border-t border-white/[0.08]">
              Proceed to Login
            </Link>
          </div>
        )}

        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}>
          <Button
            type="submit"
            className="w-full mt-3 bg-[#B8860B] text-white hover:bg-[#D4A229] shadow-lg hover:shadow-xl transition-all duration-300 font-semibold border-none"
            isLoading={loading}
          >
            Create GoodStock Account
          </Button>
        </div>
      </form>

      <div
        className="mt-7 text-center text-sm border-t border-white/[0.08] pt-5"
        style={{ animation: 'fadeIn 0.5s ease-out 0.55s both' }}
      >
        <span className="text-[#D9D3C7]/60 font-medium">Already have an account? </span>
        <Link to="/login" className="font-semibold text-[#B8860B] hover:text-[#D4A229] transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  )
}
