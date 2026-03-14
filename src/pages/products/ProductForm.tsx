import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category_id: z.string().optional(),
  unit_of_measure: z.string().min(1, 'Unit is required'),
  reorder_point: z.preprocess((val) => Number(val), z.number().min(0)),
})

export type ProductForm = z.infer<typeof productSchema>

export const ProductFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [stockSummary, setStockSummary] = useState<any[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      unit_of_measure: 'pcs',
      reorder_point: 0
    }
  })

  useEffect(() => {
    const fetchSelectData = async () => {
      const { data } = await supabase.from('categories').select('*')
      if (data) setCategories(data)
    }
    fetchSelectData()

    if (!isNew && id) {
      const fetchProduct = async () => {
        const { data: p } = await supabase.from('products').select('*').eq('id', id).single()
        if (p) {
          reset({
            name: p.name,
            sku: p.sku,
            category_id: p.category_id || '',
            unit_of_measure: p.unit_of_measure,
            reorder_point: p.reorder_point
          })
        }

        const { data: stock } = await supabase.from('stock_summary').select('*').eq('product_id', id)
        if (stock) setStockSummary(stock)
      }
      fetchProduct()
    }
  }, [id, isNew, reset])

  const onSubmit = async (data: ProductForm) => {
    setLoading(true)
    const payload = {
      ...data,
      category_id: data.category_id || null
    }

    if (isNew) {
      const { error } = await supabase.from('products').insert([payload])
      if (!error) navigate('/products')
    } else {
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      if (!error) navigate('/products')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (isNew || !id || !window.confirm('Are you sure you want to delete this product?')) return
    setLoading(true)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      alert('Cannot delete product: It might have associations with movements or ledger entries.')
    } else {
      navigate('/products')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/products')} className="p-2 h-auto text-brand-brown hover:bg-brand-cream">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">
            {isNew ? 'New Product' : 'Edit Product'}
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Product Name" {...register('name')} error={errors.name?.message} />
            <Input label="SKU / Code" {...register('sku')} error={errors.sku?.message} className="uppercase font-bold text-brand-tan" />
            
            <div className="w-full">
              <label className="block text-sm font-medium text-brand-brown mb-1">Category</label>
              <select 
                {...register('category_id')}
                className="flex h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan text-brand-brown"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-brand-brown mb-1">Unit of Measure</label>
              <select 
                {...register('unit_of_measure')}
                className="flex h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan text-brand-brown"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ltr">Liters (ltr)</option>
                <option value="box">Box</option>
                <option value="m">Meters (m)</option>
              </select>
            </div>

            <Input 
              type="number" 
              label="Reorder Point" 
              {...register('reorder_point')} 
              error={errors.reorder_point?.message} 
              className="font-bold"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-brand-stone/40">
            <div>
              {!isNew && (
                <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </Button>
              )}
            </div>
            <div className="flex">
              <Button type="button" variant="ghost" onClick={() => navigate('/products')} className="mr-3 text-gray-500 hover:text-brand-brown hover:bg-brand-cream">
                Cancel
              </Button>
              <Button type="submit" isLoading={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Product
              </Button>
            </div>
          </div>
        </form>
      </div>

      {!isNew && (
        <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden">
          <div className="p-4 border-b border-brand-stone/40 bg-brand-beige/20">
            <h3 className="font-bold text-brand-brown uppercase tracking-tight text-sm">Stock by Location</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-stone/40 text-brand-brown/60 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Warehouse</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-right">On Hand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-stone/20">
              {stockSummary.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-400">No stock history</td>
                </tr>
              ) : (
                stockSummary.map((s, i) => (
                  <tr key={i} className="hover:bg-brand-cream/30 transition-colors">
                    <td className="p-4 font-bold text-brand-brown">{s.warehouse_name}</td>
                    <td className="p-4 text-gray-500 font-medium">{s.location_name}</td>
                    <td className="p-4 text-right font-bold text-brand-brown">{s.on_hand}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
