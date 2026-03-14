import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, User as UserIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../store/authStore'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export const ProfilePage = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema)
  })

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        if (data) {
          reset({
            full_name: data.full_name || '',
            role: data.role || 'user'
          })
        }
      }
      fetchProfile()
    }
  }, [user, reset])

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return
    setLoading(true)
    setMessage('')
    const { error } = await supabase.from('users').update({
      full_name: data.full_name
    }).eq('id', user.id)

    if (!error) {
      setMessage('Profile updated successfully.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">Profile Settings</h1>
          <p className="text-sm text-gray-500 font-medium">Manage your account information</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-brand-stone/40">
              <div className="w-16 h-16 bg-brand-beige rounded-full flex items-center justify-center text-brand-tan shadow-inner border border-brand-stone/30">
                <UserIcon className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-brand-brown">{user?.email}</p>
                <p className="text-sm text-brand-tan font-bold uppercase tracking-wider">Account Owner</p>
              </div>
            </div>

            {message && (
              <div className="p-3 bg-brand-cream text-brand-brown border border-brand-tan rounded-md text-sm font-medium">
                {message}
              </div>
            )}

            <Input 
              label="Full Name" 
              placeholder="e.g. Rajeshbhai Patel" 
              {...register('full_name')} 
              error={errors.full_name?.message} 
            />
            
            <Input 
              label="Role" 
              {...register('role')} 
              disabled
              className="bg-brand-cream/50 cursor-not-allowed font-bold text-brand-tan uppercase"
            />
          </div>

          <div className="flex justify-end p-6 border-t border-brand-stone/40 bg-brand-beige/20">
            <Button type="submit" isLoading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
