import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm as useHookForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const loginSchema = z.object({
  username: z.string().min(1, 'Login ID is required'),
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
    
    const { data: email, error: rpcError } = await supabase.rpc('get_user_email', {
      p_login_id: data.username
    })

    if (rpcError || !email) {
      console.error('RPC Error or User not found:', rpcError)
      setError('Invalid Login Id or Password')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email as string,
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
    <div
      className="py-8 px-6 sm:px-10 rounded-2xl border border-white/[0.08] shadow-2xl"
      style={{
        background: 'rgba(31, 29, 26, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
          <Input
            label="Login ID (Username)"
            placeholder="Enter your username"
            {...register('username')}
            error={errors.username?.message}
            labelClassName="text-[#D9D3C7]"
            className="bg-white/[0.06] border-white/[0.1] text-[#F8F6F1] placeholder:text-white/30 focus:ring-[#B8860B] focus:border-[#B8860B]/40"
          />
        </div>
        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
            showPasswordToggle
            labelClassName="text-[#D9D3C7]"
            className="bg-white/[0.06] border-white/[0.1] text-[#F8F6F1] placeholder:text-white/30 focus:ring-[#B8860B] focus:border-[#B8860B]/40"
          />
        </div>

        {error && (
          <div
            className="text-sm border border-red-500/20 bg-red-500/10 text-red-300 p-3 rounded-lg font-medium"
            style={{ animation: 'fadeInUp 0.3s ease-out both' }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-between" style={{ animation: 'fadeIn 0.5s ease-out 0.3s both' }}>
          <div className="text-sm">
            <Link to="/forgot-password" title="Recover Password" className="font-semibold text-[#B8860B] hover:text-[#D4A229] transition-colors">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.35s both' }}>
          <Button
            type="submit"
            className="w-full bg-[#B8860B] text-white hover:bg-[#D4A229] shadow-lg hover:shadow-xl transition-all duration-300 font-semibold border-none"
            isLoading={loading}
          >
            Sign in to GoodStock
          </Button>
        </div>
      </form>

      <div
        className="mt-6 text-center text-sm border-t border-white/[0.08] pt-6"
        style={{ animation: 'fadeIn 0.5s ease-out 0.5s both' }}
      >
        <span className="text-[#D9D3C7]/60 font-medium">Don't have an account? </span>
        <Link to="/signup" className="font-semibold text-[#B8860B] hover:text-[#D4A229] transition-colors">
          Create Account
        </Link>
      </div>
    </div>
  )
}
