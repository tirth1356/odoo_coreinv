import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  short_code: z.string().min(1, 'Short Code is required').max(10, 'Code too long'),
  type: z.string().min(1, 'Type is required'),
  warehouse_id: z.string().optional(),
  parent_location_id: z.string().optional()
})

type LocationForm = z.infer<typeof locationSchema>

export const LocationFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      type: 'internal'
    }
  })

  useEffect(() => {
    const fetchSelects = async () => {
      const [whRes, locRes] = await Promise.all([
        supabase.from('warehouses').select('id, name').order('name'),
        supabase.from('locations').select('id, name, short_code').order('name')
      ])
      if (whRes.data) setWarehouses(whRes.data)
      if (locRes.data) setLocations(locRes.data)
    }
    fetchSelects()

    if (!isNew && id) {
      const fetchLocation = async () => {
        const { data } = await supabase.from('locations').select('*').eq('id', id).single()
        if (data) {
          reset({
            name: data.name,
            short_code: data.short_code,
            type: data.type,
            warehouse_id: data.warehouse_id || '',
            parent_location_id: data.parent_location_id || ''
          })
        }
      }
      fetchLocation()
    }
  }, [id, isNew, reset])

  const onSubmit = async (data: LocationForm) => {
    setLoading(true)
    
    // Clean up empty strings to null for foreign keys
    const payload = {
      ...data,
      warehouse_id: data.warehouse_id || null,
      parent_location_id: data.parent_location_id || null
    }

    if (isNew) {
      const { data: newLoc, error } = await supabase.from('locations').insert([payload]).select().single()
      if (!error && newLoc) {
        navigate('/settings/locations')
      }
    } else {
      await supabase.from('locations').update(payload).eq('id', id)
      navigate('/settings/locations')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    console.log('Delete Location requested for ID:', id)
    if (isNew || !id) return
    
    if (!window.confirm('Are you sure you want to delete this location?')) {
      console.log('Delete cancelled by user')
      return
    }
    
    setLoading(true)
    console.log('Deleting location from database...')
    const { error } = await supabase.from('locations').delete().eq('id', id)
    
    if (error) {
      console.error('Delete error:', error)
      alert('Cannot delete location: It might be a parent to other locations or have stock records.')
    } else {
      console.log('Delete successful, navigating...')
      navigate('/settings/locations')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/settings/locations')} className="p-2 h-auto text-brand-brown hover:bg-brand-cream">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-brown">
              {isNew ? 'New Location' : 'Edit Location'}
            </h1>
            <p className="text-sm text-gray-500 font-medium">Settings {'>'} <span className="text-brand-tan uppercase">Locations</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Location Name" 
              {...register('name')} 
              error={errors.name?.message} 
              placeholder="e.g. Shelf A1"
              className="md:col-span-2"
            />
            
            <Input 
              label="Short Code" 
              {...register('short_code')} 
              error={errors.short_code?.message} 
              placeholder="e.g. A1"
              className="font-mono uppercase font-bold text-brand-tan"
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-brand-brown mb-1">Type</label>
              <select 
                {...register('type')}
                className="flex h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan text-brand-brown"
              >
                <option value="internal">Internal Location</option>
                <option value="vendor">Vendor Location</option>
                <option value="customer">Customer Location</option>
                <option value="inventory_loss">Inventory Loss</option>
                <option value="production">Production</option>
                <option value="transit">Transit</option>
              </select>
            </div>
            
            <div className="w-full">
              <label className="block text-sm font-medium text-brand-brown mb-1">Warehouse</label>
              <select 
                {...register('warehouse_id')}
                className="flex h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan text-brand-brown"
              >
                <option value="">None</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-brand-brown mb-1">Parent Location</label>
              <select 
                {...register('parent_location_id')}
                className="flex h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan text-brand-brown"
              >
                <option value="">None</option>
                {locations.filter(l => l.id !== id).map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.short_code})</option>
                ))}
              </select>
            </div>

          </div>

          <div className="flex justify-between p-6 border-t border-brand-stone/40 bg-brand-beige/20">
            <div>
              {!isNew && (
                <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Location
                </Button>
              )}
            </div>
            <Button type="submit" isLoading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Location
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
