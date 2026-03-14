import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, CheckCircle, Printer, ArrowRight, Plus, Trash2, Truck, MapPin, Calendar, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button, cn } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'

const receiptSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required'),
  destination_location_id: z.string().min(1, 'Destination is required'),
  scheduled_date: z.string().optional(),
  note: z.string().optional(),
  lines: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity: z.preprocess((val) => Number(val), z.number().min(0.01, 'Quantity must be > 0'))
  }))
})

type ReceiptForm = z.infer<typeof receiptSchema>

export const ReceiptFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const { user } = useAuthStore()
  
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [receipt, setReceipt] = useState<any>(null)
  const [stockSummary, setStockSummary] = useState<any[]>([])
  const [globalStock, setGlobalStock] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<ReceiptForm>({
    resolver: zodResolver(receiptSchema) as any,
    defaultValues: {
      lines: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  })

  const selectedLocationId = watch('destination_location_id')
  const watchLines = watch('lines')

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
      const fetchReceipt = async () => {
        const { data: r } = await supabase.from('receipts').select('*, receipt_lines(*)').eq('id', id).single()
        if (r) {
          setReceipt(r)
          reset({
            supplier_name: r.supplier_name,
            destination_location_id: r.destination_location_id,
            scheduled_date: r.scheduled_date || '',
            note: r.note || '',
            lines: r.receipt_lines.map((l: any) => ({
              product_id: l.product_id,
              quantity: l.quantity
            }))
          })
        }
      }
      fetchReceipt()
    }
  }, [id, isNew, reset])

  const generateRef = async (locationId: string) => {
    const loc = locations.find(l => l.id === locationId)
    const whCode = loc?.warehouses?.short_code || 'WH'
    
    // Get count for this specific warehouse/operation type
    const { count } = await supabase
      .from('receipts')
      .select('*', { count: 'exact', head: true })
      .filter('reference', 'ilike', `${whCode}/IN/%`)
    
    const nextId = String((count || 0) + 1).padStart(3, '0')
    return `${whCode}/IN/${nextId}`
  }

  const onSubmit = async (data: ReceiptForm) => {
    setLoading(true)
    let receiptId = id

    if (isNew) {
      const reference = await generateRef(data.destination_location_id)
      const { data: newReceipt, error: rError } = await supabase
        .from('receipts')
        .insert([{
          reference,
          supplier_name: data.supplier_name,
          destination_location_id: data.destination_location_id,
          scheduled_date: data.scheduled_date || null,
          note: data.note,
          status: 'draft',
          created_by: user?.id
        }])
        .select()
        .single()
      
      if (!rError && newReceipt) {
        receiptId = newReceipt.id
        const lines = data.lines.map(l => ({
          receipt_id: receiptId,
          product_id: l.product_id,
          quantity: l.quantity
        }))
        await supabase.from('receipt_lines').insert(lines)
        navigate(`/operations/receipts/${receiptId}`)
      }
    } else {
      await supabase.from('receipts').update({
        supplier_name: data.supplier_name,
        destination_location_id: data.destination_location_id,
        scheduled_date: data.scheduled_date || null,
        note: data.note
      }).eq('id', id)

      await supabase.from('receipt_lines').delete().eq('receipt_id', id)
      const lines = data.lines.map(l => ({
        receipt_id: id,
        product_id: l.product_id,
        quantity: l.quantity
      }))
      await supabase.from('receipt_lines').insert(lines)
      
      const { data: r } = await supabase.from('receipts').select('*, receipt_lines(*)').eq('id', id).single()
      if (r) setReceipt(r)
    }
    setLoading(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!id || isNew) return
    setLoading(true)
    await supabase.from('receipts').update({ status: newStatus }).eq('id', id)
    setReceipt({ ...receipt, status: newStatus })
    setLoading(false)
  }

  const handleValidate = async () => {
    if (!id || isNew || receipt?.status !== 'ready') return
    setLoading(true)
    
    await supabase.from('receipts').update({ 
      status: 'done', 
      validated_at: new Date().toISOString() 
    }).eq('id', id)
    
    const ledgerEntries = receipt.receipt_lines.map((l: any) => ({
      product_id: l.product_id,
      location_id: receipt.destination_location_id,
      to_location_id: receipt.destination_location_id,
      is_internal: false,
      quantity_change: l.quantity,
      operation_type: 'receipt',
      reference_id: id,
      note: `Receipt ${receipt.reference}`
    }))
    
    await supabase.from('stock_ledger').insert(ledgerEntries)
    
    // Refresh stock counts
    const { data: updatedStock } = await supabase
      .from('stock_summary')
      .select('*')
      .eq('location_id', receipt.destination_location_id)
    if (updatedStock) setStockSummary(updatedStock)

    setReceipt({ ...receipt, status: 'done' })
    setLoading(false)
  }

  const handleDelete = async () => {
    console.log('Delete Receipt requested for ID:', id)
    if (isNew || !id) return
    
    if (!window.confirm('Are you sure you want to delete this receipt?')) {
      console.log('Delete cancelled by user')
      return
    }
    
    setLoading(true)
    console.log('Deleting receipt lines and history...')
    // Delete lines first
    await supabase.from('receipt_line_history').delete().eq('receipt_id', id)
    await supabase.from('receipt_lines').delete().eq('receipt_id', id)
    
    console.log('Deleting receipt header...')
    const { error } = await supabase.from('receipts').delete().eq('id', id)
    
    if (error) {
      console.error('Delete error:', error)
      alert('Cannot delete receipt: It might have associations in the ledger.')
    } else {
      console.log('Delete successful, navigating...')
      navigate('/operations/receipts')
    }
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const status = isNew ? 'draft' : receipt?.status

  // Handle auto-adding product from query params
  const { search: querySearch } = useLocation()
  useEffect(() => {
    if (isNew && products.length > 0) {
      const params = new URLSearchParams(querySearch)
      const preselectId = params.get('product_id')
      if (preselectId && fields.length === 0) {
        append({ product_id: preselectId, quantity: 1 })
      }
    }
  }, [isNew, products, querySearch, fields.length, append])

  const steps = [
    { id: 'draft', label: 'Draft' },
    { id: 'ready', label: 'Ready' },
    { id: 'done', label: 'Done' }
  ]

  const getStepColor = (stepId: string) => {
    if (status === stepId) {
      if (stepId === 'draft') return "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
      if (stepId === 'ready') return "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
      if (stepId === 'done') return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
    }
    return "text-brand-brown/30"
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Print Branding */}
      <div className="print-header">
        <h1>GoodStock</h1>
        <p>Goods Receipt Note</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white p-4 rounded-xl border border-brand-stone shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/operations/receipts')} className="p-2 h-auto text-brand-tan hover:bg-brand-cream hover:text-brand-brown transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black text-brand-brown uppercase tracking-tighter">
            Receipt
          </h1>
        </div>

        {!isNew && (
          <div className="flex items-center gap-2">
            {status === 'draft' && (
              <Button variant="primary" onClick={() => handleStatusChange('ready')} isLoading={loading} className="bg-brand-tan hover:bg-brand-tan/90">
                To DO <ArrowRight className="w-4 h-4 ml-2" />
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
            {status !== 'done' && (
              <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            {status !== 'done' && status !== 'canceled' && (
              <Button variant="ghost" onClick={() => handleStatusChange('canceled')} className="text-gray-400 hover:bg-gray-50">
                Cancel
              </Button>
            )}
          </div>
        )}
        
        {isNew && (
          <Button type="button" onClick={handleSubmit(onSubmit)} isLoading={loading} className="bg-brand-tan hover:bg-brand-tan/90 border-brand-tan shadow-md">
            <Save className="w-4 h-4 mr-2" />
            Save Receipt
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-brand-stone shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        {/* Card Header with Status Bar */}
        <div className="p-4 sm:p-6 border-b border-brand-stone/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-cream/5">
           <div>
              <h2 className="text-2xl font-mono font-bold text-brand-tan tracking-widest mb-1 underline decoration-brand-tan/30 decoration-4 underline-offset-8 uppercase">
                {isNew ? 'WH/IN/____' : receipt?.reference}
              </h2>
           </div>
           <div className="flex items-center gap-1 bg-brand-cream/10 p-1 rounded-xl border border-brand-stone/20">
             {steps.map((step, idx) => (
               <div key={step.id} className="flex items-center">
                 <div className={cn(
                   "px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                   getStepColor(step.id)
                 )}>
                   {step.label}
                 </div>
                 {idx < steps.length - 1 && (
                   <div className="flex items-center mx-1">
                     <div className={cn(
                       "h-px w-4 transition-colors duration-300",
                       steps.findIndex(s => s.id === status) > idx ? "bg-brand-tan" : "bg-brand-stone/20"
                     )} />
                   </div>
                 )}
               </div>
             ))}
           </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-10 bg-white shrink-0">
            {/* Left Column: Supplier & Description */}
            <div className="md:col-span-7 space-y-6">
              <div className="relative group">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-tan rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <label className="block text-[10px] font-black text-brand-tan uppercase tracking-[0.2em] mb-2 px-1">Supplier / Source</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Truck className="h-5 w-5 text-brand-tan/40" />
                  </div>
                  <input
                    {...register('supplier_name')}
                    disabled={status === 'done' || status === 'canceled'}
                    className="block w-full pl-12 pr-4 py-4 bg-brand-cream/5 border border-brand-stone/30 rounded-2xl text-lg font-bold text-brand-brown placeholder:text-brand-brown/20 focus:outline-none focus:ring-4 focus:ring-brand-tan/10 focus:border-brand-tan transition-all"
                    placeholder="e.g. Harsiddhi Enterprises"
                  />
                </div>
                {errors.supplier_name && <p className="mt-2 text-[10px] text-red-500 font-bold uppercase tracking-wider">{errors.supplier_name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="block text-[10px] font-black text-brand-tan uppercase tracking-[0.2em] px-1">Responsible</label>
                   <div className="flex items-center gap-3 px-4 py-3 bg-brand-cream/10 border border-brand-stone/20 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-brand-tan/20 flex items-center justify-center text-brand-tan font-black text-xs uppercase">
                        {user?.email?.[0]}
                      </div>
                      <span className="text-sm font-bold text-brand-brown/60 truncate">{user?.email}</span>
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="block text-[10px] font-black text-brand-tan uppercase tracking-[0.2em] px-1 px-1">Reference ID</label>
                   <div className="px-4 py-3 bg-gray-50 border border-brand-stone/20 rounded-xl text-sm font-mono font-bold text-brand-brown/40">
                      {isNew ? 'PENDING' : receipt?.id.split('-')[0]}
                   </div>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-brand-tan uppercase tracking-[0.2em] px-1 px-1 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Memo / Notes
                </label>
                <textarea
                  {...register('note')}
                  disabled={status === 'done' || status === 'canceled'}
                  className="w-full px-4 py-3 bg-brand-cream/5 border border-brand-stone/30 rounded-xl text-sm font-medium text-brand-brown placeholder:text-brand-brown/20 focus:outline-none focus:ring-4 focus:ring-brand-tan/10 focus:border-brand-tan transition-all resize-none h-20"
                  placeholder="Internal notes or observations..."
                />
              </div>
            </div>

            {/* Right Column: Destination & Date */}
            <div className="md:col-span-5 space-y-6">
              <div className="p-6 bg-brand-brown/5 rounded-3xl border border-brand-stone/20 space-y-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-brand-tan uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Destination Hub
                  </label>
                  <select 
                    {...register('destination_location_id')}
                    disabled={status === 'done' || status === 'canceled'}
                    className="w-full h-14 px-4 bg-white border-2 border-brand-stone/30 rounded-2xl text-sm font-bold text-brand-brown focus:outline-none focus:ring-4 focus:ring-brand-tan/10 focus:border-brand-tan transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Target Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.short_code})</option>
                    ))}
                  </select>
                  {errors.destination_location_id && <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{errors.destination_location_id.message}</p>}
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-brand-tan uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Scheduled Arrival
                  </label>
                  <input
                    type="date"
                    {...register('scheduled_date')}
                    disabled={status === 'done' || status === 'canceled'}
                    className="w-full h-14 px-4 bg-white border-2 border-brand-stone/30 rounded-2xl text-sm font-bold text-brand-brown focus:outline-none focus:ring-4 focus:ring-brand-tan/10 focus:border-brand-tan transition-all"
                  />
                </div>

                {status === 'done' && receipt?.validated_at && (
                  <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-tight">Successfully Validated</p>
                      <p className="text-xs font-bold text-emerald-700/60 mt-0.5">{new Date(receipt.validated_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
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
                    <th className="p-4 text-right">Current Stock</th>
                    <th className="p-4 w-40">Quantity (Units)</th>
                    <th className="p-4 w-20 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-stone/10">
                  {fields.map((field, index) => {
                    const line = watchLines?.[index]
                    const stockItem = stockSummary.find(s => s.product_id === line?.product_id)
                    const onHand = stockItem ? Number(stockItem.on_hand) : 0
                    
                    return (
                      <tr key={field.id} className="group hover:bg-brand-cream/10 transition-colors">
                        <td className="p-3 pl-6">
                          <select
                            {...register(`lines.${index}.product_id`)}
                            disabled={status === 'done' || status === 'canceled'}
                            className="flex h-10 w-full rounded-lg border border-brand-stone/30 bg-transparent px-3 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-tan disabled:opacity-50 text-brand-brown appearance-none"
                          >
                            <option value="">Select Product...</option>
                            {products
                              .map(p => {
                                const local = (stockSummary || []).find(s => s.product_id === p.id)?.on_hand || 0
                                const global = (globalStock || [])
                                  .filter(s => s.product_id === p.id)
                                  .reduce((acc, curr) => acc + Number(curr.on_hand), 0)
                                return { ...p, localAvailable: Number(local), globalAvailable: global }
                              })
                              .sort((a, b) => b.localAvailable - a.localAvailable)
                              .map(p => (
                                <option key={p.id} value={p.id}>
                                  [{p.sku}] {p.name} {p.localAvailable > 0 ? `(${p.localAvailable} here)` : '(0 here)'} | Global: {p.globalAvailable}
                                </option>
                              ))}
                          </select>
                          {line?.product_id && (
                            <div className="mt-2 space-y-1">
                               {globalStock
                                 .filter(s => s.product_id === line.product_id && s.on_hand > 0 && s.location_id !== selectedLocationId)
                                 .map((s, i) => (
                                   <p key={i} className="text-[10px] text-blue-600 font-medium">
                                     💡 Also in: <span className="font-bold">{s.location_name}</span> ({s.on_hand})
                                   </p>
                                 ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-bold text-sm px-2 py-1 rounded text-brand-brown bg-brand-cream/30">
                            {onHand}
                          </span>
                        </td>
                        <td className="p-3">
                        <Input 
                          type="number" 
                          step="0.01"
                          {...register(`lines.${index}.quantity`)} 
                          disabled={status === 'done' || status === 'canceled'}
                          className="h-10 font-black text-center text-lg bg-transparent border-brand-stone/30"
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
                  <p className="text-gray-400 text-sm italic font-medium">Add products to this receipt to begin.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-brand-stone/20 bg-brand-cream/5 no-print flex items-center justify-between">
              {(status === 'draft' || status === 'ready') && (
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
              
              {!isNew && (status === 'draft' || status === 'ready') && (
                  <Button type="submit" isLoading={loading} className="bg-brand-brown hover:bg-brand-brown/90 shadow-md">
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
