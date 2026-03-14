import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const signupSchema = z.object({
  login_id: z.string()
    .min(6, 'Login ID must be at least 6 characters')
    .max(12, 'Login ID must not exceed 12 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(9, 'Password must be more than 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character'),
  confirm_password: z.string()
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password']
})

type SignupForm = z.infer<typeof signupSchema>

export const Signup = () => {
  const navigate = useNavigate()
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
    
    // Attempt signup with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Insert user into our public.users table specifying login_id
    if (authData.user) {
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        login_id: data.login_id,
        email: data.email,
        full_name: data.login_id
      })

      if (dbError) {
        if (dbError.code === '23505') {
          setError('Login ID or Email is already taken.')
        } else {
            setError('Failed to create user profile. Please try again.')
            console.error(dbError)
        }
        setLoading(false)
        return
      }
    }
    
    setLoading(false)
    setSuccess('Signup successful! Please check your email for verification.')
  }

  return (
    <div className="bg-white py-8 px-4 shadow-xl rounded-xl border border-brand-stone sm:px-10">
      {!success ? (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input 
            label="Username (Login ID)" 
            type="text" 
            placeholder="rajesh_patel"
            {...register('login_id')} 
            error={errors.login_id?.message} 
            className="border-brand-stone focus:ring-brand-tan"
          />
          <Input 
            label="Email address" 
            type="email" 
            placeholder="rajesh@patel.com"
            {...register('email')} 
            error={errors.email?.message} 
            className="border-brand-stone focus:ring-brand-tan"
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••"
            {...register('password')} 
            error={errors.password?.message} 
            className="border-brand-stone focus:ring-brand-tan"
          />
          <Input 
            label="Re-enter Password" 
            type="password" 
            placeholder="••••••••"
            {...register('confirm_password')} 
            error={errors.confirm_password?.message} 
            className="border-brand-stone focus:ring-brand-tan"
          />

          {error && (
            <div className="text-sm bg-red-50 text-red-600 border border-red-200 p-3 rounded-md font-medium shadow-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full shadow-md mt-6" isLoading={loading}>
            Create GoodStock Account
          </Button>
        </form>
      ) : (
        <div className="space-y-4 text-center">
          <div className="bg-brand-cream text-brand-brown border border-brand-tan p-6 rounded-xl shadow-inner">
            <h3 className="font-bold text-xl mb-2 uppercase tracking-tight">Check your email!</h3>
            <p className="text-sm font-medium">{success}</p>
          </div>
          <Button onClick={() => navigate('/login')} className="w-full mt-4">
            Go to Login
          </Button>
        </div>
      )}

      {!success && (
        <div className="mt-6 text-center text-sm border-t border-brand-stone/40 pt-6">
          <span className="text-gray-500 font-medium">Already have an account? </span>
          <Link to="/login" className="font-bold text-brand-tan hover:text-brand-brown transition-colors">
            Sign in here
          </Link>
        </div>
      )}
    </div>
  )
}
