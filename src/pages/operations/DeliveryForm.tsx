import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, CheckCircle, Printer, XCircle, ArrowRight, Plus, Trash2, User, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button, cn } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'

const deliverySchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  source_location_id: z.string().min(1, 'Source location is required'),
  delivery_type: z.string(),
  scheduled_date: z.string().optional(),
  note: z.string().optional(),
  lines: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity: z.preprocess((val) => Number(val), z.number().min(0.01, 'Quantity must be > 0'))
  }))
})

type DeliveryForm = z.infer<typeof deliverySchema>

export const DeliveryFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const { user } = useAuthStore()
  
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [delivery, setDelivery] = useState<any>(null)
  const [stockSummary, setStockSummary] = useState<any[]>([])
  const [globalStock, setGlobalStock] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<DeliveryForm>({
    resolver: zodResolver(deliverySchema) as any,
    defaultValues: {
      delivery_type: 'standard',
      lines: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  })

  const selectedLocationId = watch('source_location_id')
  const watchLines = watch('lines')

  useEffect(() => {
    const fetchSelects = async () => {
      const [locRes, prodRes, stockRes] = await Promise.all([
        supabase.from('locations').select('*, warehouses(short_code)'),
        supabase.from('products').select('*'),
        supabase.from('stock_summary').select('*')
      ])
      if (locRes.data) setLocations(locRes.data)
      if (prodRes.data) setProducts(prodRes.data)
      if (stockRes.data) setGlobalStock(stockRes.data)
    }
    fetchSelects()

    if (!isNew && id) {
      const fetchDelivery = async () => {
        const { data: d } = await supabase.from('deliveries').select('*, delivery_lines(*)').eq('id', id).single()
        if (d) {
          setDelivery(d)
          reset({
            customer_name: d.customer_name,
            source_location_id: d.source_location_id,
            delivery_type: d.delivery_type,
            scheduled_date: d.scheduled_date || '',
            note: d.note || '',
            lines: d.delivery_lines.map((l: any) => ({
              product_id: l.product_id,
              quantity: l.quantity
            }))
          })
        }
      }
      fetchDelivery()
    }
  }, [id, isNew, reset])

  useEffect(() => {
    if (selectedLocationId) {
      const fetchStock = async () => {
        const { data } = await supabase
          .from('stock_summary')
          .select('*')
          .eq('location_id', selectedLocationId)
        if (data) setStockSummary(data)
      }
      fetchStock()
    }
  }, [selectedLocationId])

  const generateRef = async (locationId: string) => {
    const loc = locations.find(l => l.id === locationId)
    const whCode = loc?.warehouses?.short_code || 'WH'
    
    // Get count for this specific warehouse/operation type
    const { count } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .filter('reference', 'ilike', `${whCode}/OUT/%`)
    
    const nextId = String((count || 0) + 1).padStart(3, '0')
    return `${whCode}/OUT/${nextId}`
  }

  const onSubmit = async (data: DeliveryForm) => {
    setLoading(true)
    setErrorMsg('')
    let deliveryId = id

    if (isNew) {
      const reference = await generateRef(data.source_location_id)
      const { data: newDel, error: dError } = await supabase
        .from('deliveries')
        .insert([{
          reference,
          customer_name: data.customer_name,
          source_location_id: data.source_location_id,
          delivery_type: data.delivery_type,
          scheduled_date: data.scheduled_date || null,
          note: data.note,
          status: 'draft',
          created_by: user?.id
        }])
        .select()
        .single()
      
      if (!dError && newDel) {
        deliveryId = newDel.id
        const lines = data.lines.map(l => ({
          delivery_id: deliveryId,
          product_id: l.product_id,
          quantity: l.quantity
        }))
        await supabase.from('delivery_lines').insert(lines)
        navigate(`/operations/deliveries/${deliveryId}`)
      }
    } else {
      await supabase.from('deliveries').update({
        customer_name: data.customer_name,
        source_location_id: data.source_location_id,
        delivery_type: data.delivery_type,
        scheduled_date: data.scheduled_date || null,
        note: data.note
      }).eq('id', id)

      await supabase.from('delivery_lines').delete().eq('delivery_id', id)
      const lines = data.lines.map(l => ({
        delivery_id: id,
        product_id: l.product_id,
        quantity: l.quantity
      }))
      await supabase.from('delivery_lines').insert(lines)
      
      const { data: d } = await supabase.from('deliveries').select('*, delivery_lines(*)').eq('id', id).single()
      if (d) setDelivery(d)
    }
    setLoading(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!id || isNew) return
    setLoading(true)
    await supabase.from('deliveries').update({ status: newStatus }).eq('id', id)
    setDelivery({ ...delivery, status: newStatus })
    setLoading(false)
  }

  const handleValidate = async () => {
    if (!id || isNew || delivery?.status !== 'ready') return
    setLoading(true)
    setErrorMsg('')
    
    // Check stock availability
    const stockMap = new Map((stockSummary || []).map(s => [s.product_id, Number(s.on_hand)]))
    const nameMap = new Map(products.map(p => [p.id, p.name]))

    for (const line of delivery.delivery_lines) {
      const available = stockMap.get(line.product_id) || 0
      if (available < line.quantity) {
        const prodName = nameMap.get(line.product_id) || 'Unknown Product'
        setErrorMsg(`Insufficient stock for ${prodName}. Available: ${available}, Required: ${line.quantity}`)
        setLoading(false)
        return
      }
    }

    // 1. Update status
    await supabase.from('deliveries').update({ 
      status: 'done', 
      validated_at: new Date().toISOString() 
    }).eq('id', id)
    
    // 2. Insert stock ledger entries (negative for delivery)
    const ledgerEntries = delivery.delivery_lines.map((l: any) => ({
      product_id: l.product_id,
      location_id: delivery.source_location_id,
      from_location_id: delivery.source_location_id,
      is_internal: false,
      quantity_change: -Math.abs(l.quantity),
      operation_type: 'delivery',
      reference_id: id,
      note: `Delivery ${delivery.reference}`
    }))
    
    await supabase.from('stock_ledger').insert(ledgerEntries)
    
    // Refresh stock counts
    const { data: updatedStock } = await supabase
      .from('stock_summary')
      .select('*')
      .eq('location_id', delivery.source_location_id)
    if (updatedStock) setStockSummary(updatedStock)

    setDelivery({ ...delivery, status: 'done' })
    setLoading(false)
  }

  const status = isNew ? 'draft' : delivery?.status

  const StatusBar = () => {
    const steps = [
      { id: 'draft', label: 'Draft' },
      { id: 'waiting', label: 'Waiting' },
      { id: 'ready', label: 'Ready' },
      { id: 'done', label: 'Done' }
    ]
    
    return (
      <div className="flex items-center gap-2 bg-brand-cream/20 p-1 rounded-full border border-brand-stone/30">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors",
              status === step.id 
                ? "bg-brand-tan text-white shadow-sm" 
                : "text-brand-brown/40"
            )}>
              {step.label}
            </div>
            {idx < steps.length - 1 && <span className="text-brand-stone/40 mx-1 font-bold">{'>'}</span>}
          </div>
        ))}
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const checkStock = (productId: string, qty: number) => {
    if (!productId || qty <= 0) return true
    const stock = stockSummary.find(s => s.product_id === productId)
    return (stock?.on_hand || 0) >= qty
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Print Branding */}
      <div className="print-header">
        <h1>GoodStock</h1>
        <p>Delivery Order Receipt</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white p-4 rounded-xl border border-brand-stone shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/operations/deliveries')} className="p-2 h-auto text-brand-tan hover:bg-brand-cream hover:text-brand-brown transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black text-brand-brown uppercase tracking-tighter">
            Delivery
          </h1>
        </div>

        {!isNew && (
          <div className="flex items-center gap-2">
            {status === 'draft' && (
              <Button variant="primary" onClick={() => handleStatusChange('waiting')} isLoading={loading} className="bg-brand-tan hover:bg-brand-tan/90">
                To DO <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {status === 'waiting' && (
              <Button variant="primary" onClick={() => handleStatusChange('ready')} isLoading={loading} className="bg-brand-tan hover:bg-brand-tan/90">
                Check Stock <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {status === 'ready' && (
              <Button variant="primary" onClick={handleValidate} isLoading={loading} className="bg-brand-brown hover:bg-brand-brown/90 shadow-lg scale-105">
                <CheckCircle className="w-4 h-4 mr-2" />
                Validate
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint} className="border-brand-stone text-brand-brown hover:bg-brand-cream shadow-sm">
              <Printer className="w-4 h-4 mr-2 text-brand-tan" />
              Print
            </Button>
            {status !== 'done' && status !== 'canceled' && (
              <Button variant="ghost" onClick={() => handleStatusChange('canceled')} className="text-red-500 hover:bg-red-50">
                Cancel
              </Button>
            )}
          </div>
        )}
        
        {isNew && (
          <Button type="button" onClick={handleSubmit(onSubmit)} isLoading={loading} className="bg-brand-tan hover:bg-brand-tan/90 border-brand-tan shadow-md">
            <Save className="w-4 h-4 mr-2" />
            Save Delivery
          </Button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl no-print flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">{errorMsg}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-brand-stone shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        {/* Card Header with Status Bar */}
        <div className="p-4 sm:p-6 border-b border-brand-stone/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-cream/5">
           <div>
              <h2 className="text-2xl font-mono font-bold text-brand-tan tracking-widest mb-1 underline decoration-brand-tan/30 decoration-4 underline-offset-8 uppercase">
                {isNew ? 'WH/OUT/____' : delivery?.reference}
              </h2>
           </div>
           <StatusBar />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white shrink-0">
            <div className="space-y-4">
              <Input label="Deliver To (Customer)" {...register('customer_name')} error={errors.customer_name?.message} disabled={status === 'done' || status === 'canceled'} placeholder="e.g. Rajeshbhai Patel & Sons" />
              
              <div className="w-full">
                <label className="block text-xs font-black text-brand-tan uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> Responsible
                </label>
                <div className="h-10 w-full rounded-lg border border-brand-stone bg-gray-50 px-3 py-2 text-sm text-brand-brown/60 font-bold flex items-center">
                   {user?.email}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input type="date" label="Schedule Date" {...register('scheduled_date')} disabled={status === 'done' || status === 'canceled'} />
              
              <div className="w-full">
                <label className="block text-xs font-black text-brand-tan uppercase tracking-widest mb-1.5">Source Location</label>
                <select 
                  {...register('source_location_id')}
                  disabled={status === 'done' || status === 'canceled'}
                  className="flex h-10 w-full rounded-lg border border-brand-stone bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-tan disabled:bg-gray-50 disabled:text-brand-brown/40 text-brand-brown transition-all"
                >
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.short_code})</option>
                  ))}
                </select>
                {errors.source_location_id && <p className="mt-1 text-xs text-red-500 font-bold no-print">{errors.source_location_id.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="px-6 py-4 bg-brand-beige/20 border-y border-brand-stone/40">
              <h3 className="text-xs font-black text-brand-brown uppercase tracking-[0.2em]">Operations / Products</h3>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-stone/40 text-[10px] uppercase tracking-widest text-brand-brown/40 font-black">
                    <th className="p-4 pl-6">Product Item</th>
                    <th className="p-4 text-right">Available</th>
                    <th className="p-4 w-40">Quantity (Units)</th>
                    <th className="p-4 w-20 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-stone/10">
                  {fields.map((field, index) => {
                    const line = watchLines[index]
                    const stockItem = stockSummary.find(s => s.product_id === line?.product_id)
                    const onHand = stockItem ? Number(stockItem.on_hand) : 0
                    const hasStock = onHand >= (line?.quantity || 0)
                    
                    return (
                      <tr key={field.id} className={cn(
                        "group transition-colors",
                        (line?.quantity > 0 && !hasStock) ? "bg-red-50/50" : "hover:bg-brand-cream/10"
                      )}>
                        <td className="p-3 pl-6">
                          <select
                            {...register(`lines.${index}.product_id`)}
                            disabled={status === 'done' || status === 'canceled'}
                            className="flex h-10 w-full rounded-lg border border-brand-stone/30 bg-transparent px-3 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-tan disabled:opacity-50 text-brand-brown appearance-none"
                          >
                            <option value="">Select Product...</option>
                            {products
                              .map(p => {
                                const local = stockSummary.find(s => s.product_id === p.id)?.on_hand || 0
                                return { ...p, localAvailable: Number(local) }
                              })
                              .sort((a, b) => b.localAvailable - a.localAvailable)
                              .map(p => (
                                <option key={p.id} value={p.id}>
                                  [{p.sku}] {p.name} {p.localAvailable > 0 ? `(${p.localAvailable} available here)` : '(Out of Stock here)'}
                                </option>
                              ))}
                          </select>
                          {line?.product_id && !hasStock && (
                            <div className="mt-2 space-y-1">
                               <p className="text-[10px] text-red-600 font-bold animate-pulse">Insufficient stock in {locations.find(l => l.id === selectedLocationId)?.name || 'source'}</p>
                               {globalStock
                                 .filter(s => s.product_id === line.product_id && s.on_hand > 0 && s.location_id !== selectedLocationId)
                                 .map((s, i) => (
                                   <p key={i} className="text-[10px] text-blue-600 font-medium">
                                     💡 Available at: <span className="font-bold">{s.location_name}</span> ({s.on_hand} {products.find(p => p.id === s.product_id)?.unit_of_measure})
                                   </p>
                                 ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <span className={cn(
                            "font-bold text-sm px-2 py-1 rounded",
                            onHand > 0 ? "text-brand-brown bg-brand-cream/30" : "text-red-500 bg-red-50"
                          )}>
                            {onHand}
                          </span>
                        </td>
                        <td className="p-3">
                          <Input 
                            type="number" 
                            step="0.01"
                            {...register(`lines.${index}.quantity`)} 
                            disabled={status === 'done' || status === 'canceled'}
                            className={cn(
                              "h-10 font-black text-center text-lg bg-transparent border-brand-stone/30",
                              !hasStock && "text-red-700 border-red-200"
                            )}
                          />
                        </td>
                        <td className="p-3 text-right pr-6 no-print">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => remove(index)}
                            disabled={status === 'done' || status === 'canceled'}
                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <Badge variant="default" className="mb-4">No lines found</Badge>
                  <p className="text-gray-400 text-sm italic font-medium">Add products to this delivery order.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-brand-stone/20 bg-brand-cream/5 no-print flex items-center justify-between">
              {(status === 'draft' || status === 'waiting' || status === 'ready') && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => append({ product_id: '', quantity: 1 })}
                  className="border-brand-tan text-brand-tan hover:bg-brand-tan hover:text-white transition-all font-bold px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Button>
              )}
              
              {!isNew && (status !== 'done' && status !== 'canceled') && (
                  <Button type="submit" onClick={handleSubmit(onSubmit)} isLoading={loading} className="bg-brand-brown hover:bg-brand-brown/90 shadow-md">
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                  </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="print-footer mt-auto no-print border-t border-brand-stone/40 pt-4 text-center">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Generated by {user?.email} | Modern Operations Hub © 2026</p>
      </div>
    </div>
  )
}
