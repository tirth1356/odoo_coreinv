import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm as useHookForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const loginSchema = z.object({
  login_id: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export const Login = () => {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useHookForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')
    
    // First, lookup the email associated with this login_id
    const { data: userEmail, error: rpcError } = await supabase.rpc('get_user_email', { p_login_id: data.login_id })
    
    if (rpcError || !userEmail) {
      setError('Invalid Login Id or Password')
      setLoading(false)
      return
    }

    // Sign in using the retrieved email
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: data.password,
    })
    
    if (authError) {
      setError('Invalid Login Id or Password')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="bg-white py-8 px-4 shadow-xl rounded-xl border border-brand-stone sm:px-10">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Login ID (Username)"
          type="text"
          placeholder="Enter your Login ID"
          {...register('login_id')}
          error={errors.login_id?.message}
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

        {error && (
          <div className="text-sm border border-red-200 bg-red-50 text-red-600 p-3 rounded-md font-medium shadow-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/forgot-password" className="font-bold text-brand-tan hover:text-brand-brown transition-colors">
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full shadow-md" isLoading={loading}>
          Sign in to GoodStock
        </Button>
      </form>
      <div className="mt-6 text-center text-sm border-t border-brand-stone/40 pt-6">
        <span className="text-gray-500 font-medium">Don't have an account? </span>
        <Link to="/signup" className="font-bold text-brand-tan hover:text-brand-brown transition-colors">
          Create Account
        </Link>
      </div>
    </div>
  )
}
