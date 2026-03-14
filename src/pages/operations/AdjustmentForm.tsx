import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, CheckCircle, Printer, XCircle, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'

const adjustmentSchema = z.object({
  location_id: z.string().min(1, 'Location is required'),
  note: z.string().optional(),
  lines: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    system_quantity: z.preprocess((val) => Number(val), z.number()),
    counted_quantity: z.preprocess((val) => Number(val), z.number())
  }))
})

type AdjustmentForm = z.infer<typeof adjustmentSchema>

export const AdjustmentFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const { user } = useAuthStore()
  
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [adjustment, setAdjustment] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [stockMap, setStockMap] = useState<Record<string, number>>({})

  const { register, control, handleSubmit, reset, watch, setValue } = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema) as any,
    defaultValues: {
      lines: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  })

  const watchLocation = watch('location_id')
  const watchLines = watch('lines')

  useEffect(() => {
    const fetchSelects = async () => {
      const [locRes, prodRes] = await Promise.all([
        supabase.from('locations').select('*'),
        supabase.from('products').select('*')
      ])
      if (locRes.data) setLocations(locRes.data)
      if (prodRes.data) setProducts(prodRes.data)
    }
    fetchSelects()

    if (!isNew && id) {
      const fetchAdjustment = async () => {
        const { data: a } = await supabase.from('adjustments').select('*, adjustment_lines(*)').eq('id', id).single()
        if (a) {
          setAdjustment(a)
          reset({
            location_id: a.location_id,
            note: a.note || '',
            lines: a.adjustment_lines.map((l: any) => ({
              product_id: l.product_id,
              system_quantity: l.system_quantity,
              counted_quantity: l.counted_quantity
            }))
          })
        }
      }
      fetchAdjustment()
    }
  }, [id, isNew, reset])

  useEffect(() => {
    if (watchLocation && isNew) {
      const fetchStock = async () => {
        const { data } = await supabase.from('stock_summary').select('product_id, on_hand').eq('location_id', watchLocation)
        const map: Record<string, number> = {}
        data?.forEach(s => {
          map[s.product_id] = Number(s.on_hand)
        })
        setStockMap(map)
      }
      fetchStock()
    }
  }, [watchLocation, isNew])

  const handleProductSelect = (index: number, productId: string) => {
    if (isNew) {
      const sysQty = stockMap[productId] || 0
      setValue(`lines.${index}.system_quantity`, sysQty)
      setValue(`lines.${index}.counted_quantity`, sysQty)
    }
  }

  const generateRef = async () => {
    const year = new Date().getFullYear()
    const { count } = await supabase.from('adjustments').select('*', { count: 'exact', head: true })
    const number = String((count || 0) + 1).padStart(6, '0')
    return `ADJ/${year}/${number}`
  }

  const onSubmit = async (data: AdjustmentForm) => {
    setLoading(true)
    let adjId = id

    if (isNew) {
      const reference = await generateRef()
      const { data: newAdj, error: aError } = await supabase
        .from('adjustments')
        .insert([{
          reference,
          location_id: data.location_id,
          note: data.note,
          status: 'draft',
          created_by: user?.id
        }])
        .select()
        .single()
      
      if (!aError && newAdj) {
        adjId = newAdj.id
        const lines = data.lines.map(l => ({
          adjustment_id: adjId,
          product_id: l.product_id,
          system_quantity: l.system_quantity,
          counted_quantity: l.counted_quantity
        }))
        await supabase.from('adjustment_lines').insert(lines)
        navigate(`/operations/adjustments/${adjId}`)
      }
    } else {
      await supabase.from('adjustments').update({
        location_id: data.location_id,
        note: data.note
      }).eq('id', id)

      await supabase.from('adjustment_lines').delete().eq('adjustment_id', id)
      const lines = data.lines.map(l => ({
        adjustment_id: id,
        product_id: l.product_id,
        system_quantity: l.system_quantity,
        counted_quantity: l.counted_quantity
      }))
      await supabase.from('adjustment_lines').insert(lines)
      
      const { data: a } = await supabase.from('adjustments').select('*, adjustment_lines(*)').eq('id', id).single()
      if (a) setAdjustment(a)
    }
    setLoading(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!id || isNew) return
    setLoading(true)
    await supabase.from('adjustments').update({ status: newStatus }).eq('id', id)
    setAdjustment({ ...adjustment, status: newStatus })
    setLoading(false)
  }

  const handleValidate = async () => {
    if (!id || isNew || adjustment?.status !== 'draft') return
    setLoading(true)
    
    // 1. Update status
    await supabase.from('adjustments').update({ 
      status: 'done', 
      validated_at: new Date().toISOString() 
    }).eq('id', id)
    
    // 2. Insert stock ledger entries for the differences
    const ledgerEntries: any[] = []
    
    adjustment.adjustment_lines.forEach((l: any) => {
      const diff = Number(l.counted_quantity) - Number(l.system_quantity)
      if (diff !== 0) {
        ledgerEntries.push({
          product_id: l.product_id,
          location_id: adjustment.location_id,
          from_location_id: adjustment.location_id,
          to_location_id: adjustment.location_id,
          is_internal: true,
          quantity_change: diff,
          operation_type: 'adjustment',
          reference_id: id,
          note: `Adjustment ${adjustment.reference}`
        })
      }
    })
    
    if (ledgerEntries.length > 0) {
      await supabase.from('stock_ledger').insert(ledgerEntries)
    }
    
    setAdjustment({ ...adjustment, status: 'done' })
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const status = isNew ? 'draft' : adjustment?.status

  const getStatusBadge = (status: string) => {
    if (!status) return null
    const map: Record<string, "warning" | "default" | "success" | "danger" | "info"> = {
      draft: 'default',
      done: 'success',
      canceled: 'danger'
    }
    return <Badge variant={map[status] || 'default'} className="text-sm px-3 py-1">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/operations/adjustments')} className="p-2 h-auto">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-brown">
                {isNew ? 'New Adjustment' : adjustment?.reference}
              </h1>
              {!isNew && getStatusBadge(status)}
            </div>
            <p className="text-sm text-gray-500 font-medium">Operations {'>'} Adjustments {'>'} <span className="text-brand-tan uppercase">{isNew ? 'New' : adjustment?.reference}</span></p>
          </div>
        </div>

        {!isNew && (
          <div className="flex items-center gap-2">
            {status === 'draft' && (
              <Button variant="primary" onClick={handleValidate} isLoading={loading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Validate Inventory
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint} className="border-brand-stone text-brand-brown hover:bg-brand-cream no-print">
              <Printer className="w-4 h-4 mr-2 text-brand-tan" />
              Print
            </Button>
            {status !== 'done' && status !== 'canceled' && (
              <Button variant="danger" onClick={() => handleStatusChange('canceled')}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-brand-stone/40">
            <div className="w-full">
              <label className="block text-sm font-medium text-brand-brown mb-1">Location</label>
              <select 
                {...register('location_id')}
                disabled={status === 'done' || status === 'canceled'}
                className="flex h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan disabled:opacity-50 text-brand-brown"
              >
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.short_code})</option>
                ))}
              </select>
            </div>

            <Input label="Note / Reason" {...register('note')} disabled={status === 'done' || status === 'canceled'} />
          </div>

          <div className="p-6">
            <h3 className="text-lg font-bold text-brand-brown mb-4">Count Lines</h3>
            <table className="w-full text-left border-collapse mb-4">
              <thead>
                <tr className="border-b border-brand-stone/40 text-xs uppercase tracking-wider text-brand-brown/60 font-bold">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 w-32">System Qty</th>
                  <th className="pb-2 w-32">Counted Qty</th>
                  <th className="pb-2 w-32 text-right">Difference</th>
                  <th className="pb-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-stone/20">
                {fields.map((field, index) => {
                  const sysQty = watchLines?.[index]?.system_quantity || 0
                  const cntQty = watchLines?.[index]?.counted_quantity || 0
                  const diff = Number(cntQty) - Number(sysQty)
                  const diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'

                  return (
                    <tr key={field.id}>
                      <td className="py-2">
                        <select
                          {...register(`lines.${index}.product_id`)}
                          disabled={status === 'done' || status === 'canceled' || (!isNew && !!field.id)}
                          onChange={(e) => {
                            register(`lines.${index}.product_id`).onChange(e)
                            handleProductSelect(index, e.target.value)
                          }}
                          className="flex h-9 w-full rounded-md border border-brand-stone bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan disabled:opacity-50 text-brand-brown"
                        >
                          <option value="">Select Product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              [{p.sku}] {p.name} (Now: {stockMap[p.id] || 0})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pl-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          {...register(`lines.${index}.system_quantity`)} 
                          disabled
                          className="h-9 bg-brand-cream/50 font-bold"
                        />
                      </td>
                      <td className="py-2 pl-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          {...register(`lines.${index}.counted_quantity`)} 
                          disabled={status === 'done' || status === 'canceled'}
                          className="h-9 font-bold"
                        />
                      </td>
                      <td className={`py-2 pl-2 text-right font-bold ${diffColor}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => remove(index)}
                          disabled={status === 'done' || status === 'canceled'}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {status === 'draft' && watchLocation && (
              <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', system_quantity: 0, counted_quantity: 0 })} className="border-brand-stone text-brand-brown hover:bg-brand-cream">
                <Plus className="w-4 h-4 mr-2 text-brand-tan" /> Add Product Line
              </Button>
            )}
            {status === 'draft' && !watchLocation && (
              <p className="text-sm text-gray-500 font-medium italic">Please select a location first to add products.</p>
            )}
          </div>

          {status === 'draft' && (
            <div className="flex justify-end p-6 border-t border-brand-stone/40 bg-brand-beige/20">
              <Button type="submit" isLoading={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Adjustment
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
