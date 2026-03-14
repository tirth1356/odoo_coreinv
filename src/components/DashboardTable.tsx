import { useEffect, useState } from 'react'
import { Badge } from './ui/Badge'
import { ArrowLeftRight, PackagePlus, PackageMinus, Shuffle, SlidersHorizontal, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../store/dashboardStore'

export const DashboardTable = () => {
  const navigate = useNavigate()
  const { type, status, timeRange } = useDashboardStore()
  const [operations, setOperations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOperations = async () => {
      setLoading(true)

      const [r, d, t, a] = await Promise.all([
        supabase.from('receipts').select('id, reference, status, scheduled_date, created_at, supplier_name, receipt_lines(id)'),
        supabase.from('deliveries').select('id, reference, status, scheduled_date, created_at, customer_name, delivery_lines(id)'),
        supabase.from('transfers').select('id, reference, status, scheduled_date, created_at, transfer_lines(id)'),
        supabase.from('adjustments').select('id, reference, status, created_at, adjustment_lines(id)')
      ])

      const mappedReceips = (r.data || []).map(x => ({ ...x, type: 'Receipt', source: x.supplier_name, dest: 'Warehouse', products: x.receipt_lines?.length || 0, date: x.scheduled_date || x.created_at, status: x.status, navBase: 'receipts' }))
      const mappedDeliveries = (d.data || []).map(x => ({ ...x, type: 'Delivery', source: 'Warehouse', dest: x.customer_name, products: x.delivery_lines?.length || 0, date: x.scheduled_date || x.created_at, status: x.status, navBase: 'deliveries' }))
      const mappedTransfers = (t.data || []).map(x => ({ ...x, type: 'Transfer', source: 'Internal', dest: 'Internal', products: x.transfer_lines?.length || 0, date: x.scheduled_date || x.created_at, status: x.status, navBase: 'transfers' }))
      const mappedAdjustments = (a.data || []).map(x => ({ ...x, type: 'Adjustment', source: 'Location', dest: '-', products: x.adjustment_lines?.length || 0, date: x.created_at, status: x.status, navBase: 'adjustments' }))

      let combined = [...mappedReceips, ...mappedDeliveries, ...mappedTransfers, ...mappedAdjustments]

      // Filter by Type
      if (type !== 'All') {
        const typeMap: Record<string, string> = {
          'Receipts': 'Receipt',
          'Deliveries': 'Delivery',
          'Transfers': 'Transfer',
          'Adjustments': 'Adjustment'
        }
        combined = combined.filter(op => op.type === typeMap[type])
      }

      // Filter by Status
      if (status !== 'All Statuses') {
        combined = combined.filter(op => op.status.toLowerCase() === status.toLowerCase())
      }

      // Filter by Time Range
      if (timeRange !== 'All Time') {
        combined = combined.filter(op => {
          const d = parseISO(op.date)
          if (timeRange === 'Today') return isToday(d)
          if (timeRange === 'This Week') return isThisWeek(d)
          if (timeRange === 'This Month') return isThisMonth(d)
          return true
        })
      }

      combined = combined
        .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
        .slice(0, 10)

      setOperations(combined)
      setLoading(false)
    }

    fetchOperations()
  }, [type, status, timeRange])

  const getIcon = (type: string) => {
    switch (type) {
      case 'Receipt': return <PackagePlus className="w-4 h-4 text-brand-tan" />
      case 'Delivery': return <PackageMinus className="w-4 h-4 text-[#8b5e3c]" />
      case 'Transfer': return <Shuffle className="w-4 h-4 text-brand-brown" />
      case 'Adjustment': return <SlidersHorizontal className="w-4 h-4 text-brand-tan" />
      default: return <ArrowLeftRight className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, "warning" | "default" | "success" | "danger" | "info"> = {
      draft: 'default',
      waiting: 'warning',
      ready: 'info',
      done: 'success',
      canceled: 'danger'
    }
    return <Badge variant={map[status] || 'default'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  return (
    <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-beige/50 border-b border-brand-stone text-xs uppercase tracking-wider text-brand-brown/70 font-bold">
              <th className="p-4">Reference</th>
              <th className="p-4">Type</th>
              <th className="p-4">From / To</th>
              <th className="p-4">Products</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-stone/40 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">Loading activity...</td>
              </tr>
            ) : operations.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">No matching activity found.</td>
              </tr>
            ) : (
              operations.map((op) => (
                <tr key={`${op.type}-${op.id}`} onClick={() => navigate(`/operations/${op.navBase}/${op.id}`)} className="hover:bg-brand-cream/50 transition-colors cursor-pointer group">
                  <td className="p-4 font-mono font-bold text-brand-tan uppercase">{op.reference}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getIcon(op.type)}
                      <span className="text-brand-brown font-medium">{op.type}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">
                    <div className="flex flex-col">
                      <span className="text-xs text-brand-tan">From: {op.source}</span>
                      <span className="text-brand-brown">To: {op.dest}</span>
                    </div>
                  </td>
                  <td className="p-4 text-brand-brown font-medium">{op.products} items</td>
                  <td className="p-4 text-gray-500">{format(new Date(op.date), 'MMM dd, yyyy')}</td>
                  <td className="p-4">{getStatusBadge(op.status)}</td>
                  <td className="p-4 text-right">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-tan transition-colors ml-auto" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
