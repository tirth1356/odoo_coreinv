import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, CheckCircle, Printer, XCircle, ArrowRight, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button, cn } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'

const transferSchema = z.object({
  from_location_id: z.string().min(1, 'Source location is required'),
  to_location_id: z.string().min(1, 'Target location is required'),
  scheduled_date: z.string().optional(),
  note: z.string().optional(),
  lines: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity: z.preprocess((val) => Number(val), z.number().min(0.01, 'Quantity must be > 0'))
  }))
})

type TransferForm = z.infer<typeof transferSchema>

export const TransferFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const { user } = useAuthStore()
  
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [transfer, setTransfer] = useState<any>(null)
  const [stockSummary, setStockSummary] = useState<any[]>([])
  const [globalStock, setGlobalStock] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { register, control, handleSubmit, reset, watch } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema) as any,
    defaultValues: {
      lines: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines"
  })

  const watchFromLocation = watch('from_location_id')
  const watchLines = watch('lines')

  useEffect(() => {
    if (watchFromLocation) {
      const fetchStock = async () => {
        const { data } = await supabase
          .from('stock_summary')
          .select('*')
          .eq('location_id', watchFromLocation)
        if (data) setStockSummary(data)
      }
      fetchStock()
    }
  }, [watchFromLocation])

  useEffect(() => {
    const fetchSelects = async () => {
      const [locRes, prodRes, stockRes] = await Promise.all([
        supabase.from('locations').select('*'),
        supabase.from('products').select('*'),
        supabase.from('stock_summary').select('*')
      ])
      if (locRes.data) setLocations(locRes.data)
      if (prodRes.data) setProducts(prodRes.data)
      if (stockRes.data) setGlobalStock(stockRes.data)
    }
    fetchSelects()

    if (!isNew && id) {
      const fetchTransfer = async () => {
        const { data: t } = await supabase.from('transfers').select('*, transfer_lines(*)').eq('id', id).single()
        if (t) {
          setTransfer(t)
          reset({
            from_location_id: t.from_location_id,
            to_location_id: t.to_location_id,
            scheduled_date: t.scheduled_date || '',
            note: t.note || '',
            lines: t.transfer_lines.map((l: any) => ({
              product_id: l.product_id,
              quantity: l.quantity
            }))
          })
        }
      }
      fetchTransfer()
    }
  }, [id, isNew, reset])

  const generateRef = async () => {
    const year = new Date().getFullYear()
    const { count } = await supabase.from('transfers').select('*', { count: 'exact', head: true })
    const number = String((count || 0) + 1).padStart(6, '0')
    return `TRF/${year}/${number}`
  }

  const onSubmit = async (data: TransferForm) => {
    setLoading(true)
    setErrorMsg('')
    
    if (data.from_location_id === data.to_location_id) {
      setErrorMsg('Source and target locations must be different')
      setLoading(false)
      return
    }

    let transferId = id

    if (isNew) {
      const reference = await generateRef()
      const { data: newTrf, error: tError } = await supabase
        .from('transfers')
        .insert([{
          reference,
          from_location_id: data.from_location_id,
          to_location_id: data.to_location_id,
          scheduled_date: data.scheduled_date || null,
          note: data.note,
          status: 'draft',
          created_by: user?.id
        }])
        .select()
        .single()
      
      if (!tError && newTrf) {
        transferId = newTrf.id
        const lines = data.lines.map(l => ({
          transfer_id: transferId,
          product_id: l.product_id,
          quantity: l.quantity
        }))
        await supabase.from('transfer_lines').insert(lines)
        navigate(`/operations/transfers/${transferId}`)
      }
    } else {
      await supabase.from('transfers').update({
        from_location_id: data.from_location_id,
        to_location_id: data.to_location_id,
        scheduled_date: data.scheduled_date || null,
        note: data.note
      }).eq('id', id)

      await supabase.from('transfer_lines').delete().eq('transfer_id', id)
      const lines = data.lines.map(l => ({
        transfer_id: id,
        product_id: l.product_id,
        quantity: l.quantity
      }))
      await supabase.from('transfer_lines').insert(lines)
      
      const { data: t } = await supabase.from('transfers').select('*, transfer_lines(*)').eq('id', id).single()
      if (t) setTransfer(t)
    }
    setLoading(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!id || isNew) return
    setLoading(true)
    await supabase.from('transfers').update({ status: newStatus }).eq('id', id)
    setTransfer({ ...transfer, status: newStatus })
    setLoading(false)
  }

  const handleValidate = async () => {
    if (!id || isNew || transfer?.status !== 'ready') return
    setLoading(true)
    setErrorMsg('')
    
    // Check stock availability at source
    const { data: stockSummary } = await supabase
      .from('stock_summary')
      .select('product_id, on_hand, product_name')
      .eq('location_id', transfer.from_location_id)

    const stockMap = new Map((stockSummary || []).map(s => [s.product_id, Number(s.on_hand)]))
    const nameMap = new Map(products.map(p => [p.id, p.name]))

    for (const line of transfer.transfer_lines) {
      const available = stockMap.get(line.product_id) || 0
      if (available < line.quantity) {
        const prodName = nameMap.get(line.product_id) || 'Unknown Product'
        setErrorMsg(`Insufficient stock for ${prodName} at source. Available: ${available}, Required: ${line.quantity}`)
        setLoading(false)
        return
      }
    }

    // 1. Update status
    await supabase.from('transfers').update({ 
      status: 'done', 
      validated_at: new Date().toISOString() 
    }).eq('id', id)
    
    // 2. Insert two stock ledger entries per line
    const ledgerEntries: any[] = []
    
    transfer.transfer_lines.forEach((l: any) => {
      // Out from source
      ledgerEntries.push({
        product_id: l.product_id,
        location_id: transfer.from_location_id,
        from_location_id: transfer.from_location_id,
        to_location_id: transfer.to_location_id,
        is_internal: true,
        quantity_change: -Math.abs(l.quantity),
        operation_type: 'transfer_out',
        reference_id: id,
        note: `Transfer Out ${transfer.reference}`
      })
      // In to dest
      ledgerEntries.push({
        product_id: l.product_id,
        location_id: transfer.to_location_id,
        from_location_id: transfer.from_location_id,
        to_location_id: transfer.to_location_id,
        is_internal: true,
        quantity_change: Math.abs(l.quantity),
        operation_type: 'transfer_in',
        reference_id: id,
        note: `Transfer In ${transfer.reference}`
      })
    })
    
    await supabase.from('stock_ledger').insert(ledgerEntries)
    
    setTransfer({ ...transfer, status: 'done' })
    setLoading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  const status = isNew ? 'draft' : transfer?.status

  const getStatusBadge = (status: string) => {
    if (!status) return null
    const map: Record<string, "warning" | "default" | "success" | "danger" | "info"> = {
      draft: 'default',
      waiting: 'warning',
      ready: 'info',
      done: 'success',
      canceled: 'danger'
    }
    return <Badge variant={map[status] || 'default'} className="text-sm px-3 py-1">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const AdvanceButton = () => {
    if (status === 'draft') return <Button variant="outline" onClick={() => handleStatusChange('waiting')} isLoading={loading}>Mark as Waiting <ArrowRight className="w-4 h-4 ml-2" /></Button>
    if (status === 'waiting') return <Button variant="outline" onClick={() => handleStatusChange('ready')} isLoading={loading}>Mark as Ready <ArrowRight className="w-4 h-4 ml-2" /></Button>
    if (status === 'ready') return (
      <Button variant="primary" onClick={handleValidate} isLoading={loading}>
        <CheckCircle className="w-4 h-4 mr-2" />
        Validate
      </Button>
    )
    return null
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/operations/transfers')} className="p-2 h-auto">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-brown">
                {isNew ? 'New Transfer' : transfer?.reference}
              </h1>
              {!isNew && getStatusBadge(status)}
            </div>
            <p className="text-sm text-gray-500 font-medium">Operations {'>'} Transfers {'>'} <span className="text-brand-tan uppercase">{isNew ? 'New' : transfer?.reference}</span></p>
          </div>
        </div>

        {!isNew && (
          <div className="flex items-center gap-2">
            <AdvanceButton />
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
              <label className="block text-sm font-medium text-brand-brown mb-1">Source Location</label>
              <select 
                {...register('from_location_id')}
                disabled={status === 'done' || status === 'canceled'}
                className="flex h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan disabled:opacity-50 text-brand-brown"
              >
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.short_code})</option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-brand-brown mb-1">Target Location</label>
              <select 
                {...register('to_location_id')}
                disabled={status === 'done' || status === 'canceled'}
                className="flex h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan disabled:opacity-50 text-brand-brown"
              >
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.short_code})</option>
                ))}
              </select>
            </div>

            <Input type="date" label="Scheduled Date" {...register('scheduled_date')} disabled={status === 'done' || status === 'canceled'} />
            <Input label="Note" {...register('note')} disabled={status === 'done' || status === 'canceled'} />
          </div>

          <div className="p-6">
            <h3 className="text-lg font-bold text-brand-brown mb-4">Products</h3>
            <table className="w-full text-left border-collapse mb-4">
              <thead>
                <tr className="border-b border-brand-stone/40 text-[10px] uppercase tracking-wider text-brand-brown/60 font-black">
                  <th className="pb-2">Product Item</th>
                  <th className="pb-2 text-right">Source Stock</th>
                  <th className="pb-2 w-32">Quantity</th>
                  <th className="pb-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-stone/20">
                {fields.map((field, index) => {
                  const line = watchLines?.[index]
                  const stockItem = stockSummary.find(s => s.product_id === line?.product_id)
                  const onHand = stockItem ? Number(stockItem.on_hand) : 0
                  const hasStock = onHand >= (line?.quantity || 0)

                  return (
                    <tr key={field.id} className={cn(
                      "transition-colors",
                      (line?.quantity > 0 && !hasStock) ? "bg-red-50/50" : "hover:bg-brand-cream/5"
                    )}>
                      <td className="py-2">
                        <select
                          {...register(`lines.${index}.product_id`)}
                          disabled={status === 'done' || status === 'canceled'}
                          className="flex h-9 w-full rounded-md border border-brand-stone bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan disabled:opacity-50 text-brand-brown"
                        >
                          {products
                            .map(p => {
                              const local = (stockSummary || []).find(s => s.product_id === p.id)?.on_hand || 0
                              return { ...p, localAvailable: Number(local) }
                            })
                            .sort((a, b) => b.localAvailable - a.localAvailable)
                            .map(p => (
                              <option key={p.id} value={p.id}>
                                [{p.sku}] {p.name} {p.localAvailable > 0 ? `(${p.localAvailable} at source)` : '(Out of Stock at source)'}
                              </option>
                            ))}
                        </select>
                        {line?.product_id && !hasStock && (
                          <div className="mt-2 space-y-1">
                              <p className="text-[10px] text-red-600 font-bold animate-pulse">Insufficient stock at source</p>
                              {globalStock
                                .filter(s => s.product_id === line.product_id && s.on_hand > 0 && s.location_id !== watchFromLocation)
                                .map((s, i) => (
                                  <p key={i} className="text-[10px] text-blue-600 font-medium">
                                    💡 Available at: <span className="font-bold">{s.location_name}</span> ({s.on_hand} {products.find(p => p.id === s.product_id)?.unit_of_measure})
                                  </p>
                                ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <span className={cn(
                          "font-bold text-sm px-2 py-1 rounded",
                          onHand > 0 ? "text-brand-brown bg-brand-cream/30" : "text-red-500 bg-red-50"
                        )}>
                          {onHand}
                        </span>
                      </td>
                      <td className="py-2 pl-2">
                      <Input 
                        type="number" 
                        step="0.01"
                        {...register(`lines.${index}.quantity`)} 
                        disabled={status === 'done' || status === 'canceled'}
                        className="h-9 font-bold"
                      />
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

            {status !== 'done' && status !== 'canceled' && (
              <Button type="button" variant="outline" size="sm" onClick={() => append({ product_id: '', quantity: 1 })} className="border-brand-stone text-brand-brown hover:bg-brand-cream">
                <Plus className="w-4 h-4 mr-2 text-brand-tan" /> Add Product
              </Button>
            )}
          </div>

          {(status === 'draft' || status === 'waiting') && (
            <div className="flex justify-end p-6 border-t border-brand-stone/40 bg-brand-beige/20">
              <Button type="submit" isLoading={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Transfer
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
