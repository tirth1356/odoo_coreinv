import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  short_code: z.string().min(1, 'Short Code is required').max(5, 'Code too long'),
  address: z.string().optional()
})

type WarehouseForm = z.infer<typeof warehouseSchema>

export const WarehouseFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WarehouseForm>({
    resolver: zodResolver(warehouseSchema)
  })

  useEffect(() => {
    if (!isNew && id) {
      const fetchWarehouse = async () => {
        const { data } = await supabase.from('warehouses').select('*').eq('id', id).single()
        if (data) {
          reset({
            name: data.name,
            short_code: data.short_code,
            address: data.address || ''
          })
        }
      }
      fetchWarehouse()
    }
  }, [id, isNew, reset])

  const onSubmit = async (data: WarehouseForm) => {
    setLoading(true)
    
    if (isNew) {
      const { data: newWh, error } = await supabase.from('warehouses').insert([data]).select().single()
      if (!error && newWh) {
        navigate('/settings/warehouses')
      }
    } else {
      await supabase.from('warehouses').update(data).eq('id', id)
      navigate('/settings/warehouses')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    console.log('Delete Warehouse requested for ID:', id)
    if (isNew || !id) return
    
    if (!window.confirm('Are you sure you want to delete this warehouse?')) {
      console.log('Delete cancelled by user')
      return
    }
    
    setLoading(true)
    console.log('Deleting warehouse from database...')
    const { error } = await supabase.from('warehouses').delete().eq('id', id)
    
    if (error) {
      console.error('Delete error:', error)
      alert('Cannot delete warehouse: It might have associations with locations or stock.')
    } else {
      console.log('Delete successful, navigating...')
      navigate('/settings/warehouses')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/settings/warehouses')} className="p-2 h-auto text-brand-brown hover:bg-brand-cream">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-brown">
              {isNew ? 'New Warehouse' : 'Edit Warehouse'}
            </h1>
            <p className="text-sm text-gray-500">Settings {'>'} <span className="text-brand-tan uppercase">Warehouses</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            <Input 
              label="Warehouse Name" 
              {...register('name')} 
              error={errors.name?.message} 
              placeholder="e.g. Main Distribution Center"
            />
            
            <Input 
              label="Short Code" 
              {...register('short_code')} 
              error={errors.short_code?.message} 
              placeholder="e.g. WH"
              className="font-mono uppercase font-bold text-brand-tan"
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-brand-brown">Address</label>
              <textarea
                {...register('address')}
                rows={3}
                className="w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan text-brand-brown placeholder:text-gray-400"
                placeholder="Full address details..."
              />
            </div>
          </div>

          <div className="flex justify-between p-6 border-t border-brand-stone/40 bg-brand-beige/20">
            <div>
              {!isNew && (
                <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Warehouse
                </Button>
              )}
            </div>
            <Button type="submit" isLoading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Warehouse
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
