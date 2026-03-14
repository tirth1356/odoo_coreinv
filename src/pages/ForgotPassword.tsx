import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const forgotSchema = z.object({
  email: z.string().email(),
})

type ForgotForm = z.infer<typeof forgotSchema>

export const ForgotPassword = () => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: undefined
    })
    
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      // Navigate to reset password page passing the email
      navigate('/reset-password', { state: { email: data.email } })
    }
  }

  return (
    <div className="bg-white py-8 px-4 shadow-xl rounded-xl border border-brand-stone sm:px-10">
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-bold text-brand-brown uppercase tracking-tight">Reset Password</h3>
        <p className="mt-2 text-sm font-medium text-gray-500">
          Enter your email to receive a 6-digit OTP code
        </p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Input 
          label="Email address" 
          type="email" 
          {...register('email')} 
          error={errors.email?.message} 
          className="border-brand-stone focus:ring-brand-tan"
        />

        {error && (
          <div className="text-sm border border-red-200 bg-red-50 text-red-600 p-3 rounded-md font-medium">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full shadow-md" isLoading={loading}>
          Send OTP Verification
        </Button>
      </form>
      <div className="mt-8 text-center text-sm border-t border-brand-stone/40 pt-6">
        <Link to="/login" className="font-bold text-brand-tan hover:text-brand-brown transition-colors">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
