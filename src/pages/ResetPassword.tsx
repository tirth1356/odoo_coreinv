import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const resetSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type ResetForm = z.infer<typeof resetSchema>

export const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  // If accessed directly without email state, redirect back
  if (!email) {
    navigate('/forgot-password', { replace: true })
    return null
  }

  const onSubmit = async (data: ResetForm) => {
    setLoading(true)
    setError('')
    
    // 1. Verify OTP
    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: data.otp,
      type: 'recovery'
    })

    if (otpError) {
      setError(otpError.message)
      setLoading(false)
      return
    }

    // 2. Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.password
    })

    setLoading(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  if (success) {
    return (
      <div className="bg-white py-12 px-8 shadow-xl rounded-xl border border-brand-stone text-center max-w-sm mx-auto">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-brand-brown uppercase tracking-tight">Success!</h3>
        <p className="mt-2 text-sm font-medium text-gray-500">
          Your password has been reset. Redirecting to login...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white py-8 px-4 shadow-xl rounded-xl border border-brand-stone sm:px-10">
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-brand-brown uppercase tracking-tight">Verify OTP</h3>
        <p className="mt-2 text-sm font-medium text-gray-500">
          Enter the 6-digit code sent to <span className="font-bold text-brand-tan tracking-wide">{email}</span>
        </p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Input 
          label="6-Digit OTP" 
          {...register('otp')} 
          error={errors.otp?.message} 
          placeholder="123456" 
          className="border-brand-stone focus:ring-brand-tan font-mono text-center text-lg tracking-[1em]"
        />
        <Input 
          label="New Password" 
          type="password" 
          {...register('password')} 
          error={errors.password?.message} 
          className="border-brand-stone focus:ring-brand-tan"
        />

        {error && (
          <div className="text-sm border border-red-200 bg-red-50 text-red-600 p-3 rounded-md font-medium">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full shadow-md" isLoading={loading}>
          Confirm New Password
        </Button>
      </form>
      <div className="mt-8 text-center text-sm border-t border-brand-stone/40 pt-6">
        <Link to="/forgot-password" className="font-bold text-brand-tan hover:text-brand-brown transition-colors">
          Didn't receive code? Try again
        </Link>
      </div>
    </div>
  )
}
