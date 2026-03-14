import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useUIStore } from '../../store/uiStore'

export const ReceiptsList = () => {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { viewMode } = useUIStore()

  const fetchReceipts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('receipts')
      .select('*, locations(name), receipt_lines(id)')
      .order('created_at', { ascending: false })

    if (data) {
      const formatted = data.map((r: any) => ({
        ...r,
        destination: r.locations?.name || '-',
        products_count: r.receipt_lines?.length || 0
      }))
      setReceipts(formatted)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReceipts()
  }, [])

  const filtered = receipts.filter((r) => 
    r.reference.toLowerCase().includes(search.toLowerCase()) || 
    r.supplier_name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    if (!status) return null
    const map: Record<string, "warning" | "default" | "success" | "danger" | "info"> = {
      draft: 'default',
      waiting: 'warning',
      ready: 'info',
      done: 'success',
      canceled: 'danger'
    }
    return <Badge variant={map[status] || 'default'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const renderKanban = () => {
    const columns = ['draft', 'waiting', 'ready', 'done']
    const columnTitles: Record<string, string> = {
      draft: 'Draft',
      waiting: 'Waiting',
      ready: 'Ready',
      done: 'Done'
    }

    return (
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {columns.map(col => {
          const colItems = filtered.filter(item => item.status === col)
          return (
              <div key={col} className="flex-1 min-w-[300px] bg-white/40 backdrop-blur-sm rounded-xl p-4 flex flex-col gap-3 border border-brand-tan/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-brand-brown underline decoration-brand-tan/30 decoration-2 underline-offset-4">{columnTitles[col]}</h3>
                  <span className="bg-brand-tan text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">{colItems.length}</span>
                </div>
                
                {colItems.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => navigate(`/operations/receipts/${item.id}`)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-brand-stone hover:shadow-md cursor-pointer transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono font-medium text-brand-tan uppercase">{item.reference}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="font-medium text-brand-brown mb-2">
                      {item.supplier_name}
                    </div>
                    <div className="text-sm text-gray-500 flex justify-between items-center mt-4">
                      <span>{item.scheduled_date || 'No Date'}</span>
                      <span className="bg-brand-cream px-2 py-1 rounded text-xs border border-brand-stone/50">{item.products_count} Items</span>
                    </div>
                  </div>
                ))}
              {colItems.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400 border border-dashed border-brand-stone/50 rounded-lg">
                  No receipts
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderList = () => (
    <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-beige/50 border-b border-brand-stone text-xs uppercase tracking-wider text-brand-brown/70 font-bold">
              <th className="p-4">Reference</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Destination</th>
              <th className="p-4">Scheduled Date</th>
              <th className="p-4 text-center">Products</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-stone/40 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">Loading receipts...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">No receipts found.</td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-brand-cream/50 cursor-pointer" onClick={() => navigate(`/operations/receipts/${r.id}`)}>
                  <td className="p-4 font-mono text-brand-tan font-bold uppercase">{r.reference}</td>
                  <td className="p-4 font-medium text-brand-brown">{r.supplier_name}</td>
                  <td className="p-4 text-gray-500">{r.destination}</td>
                  <td className="p-4 text-gray-500">{r.scheduled_date || '-'}</td>
                  <td className="p-4 text-center font-medium">{r.products_count}</td>
                  <td className="p-4">{getStatusBadge(r.status)}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" className="hover:bg-brand-cream">
                      <Edit className="w-4 h-4 text-brand-tan" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
 
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">Receipts</h1>
          <p className="text-sm text-gray-500">Population of purchase orders added to manufacturing order</p>
        </div>
        <Button onClick={() => navigate('/operations/receipts/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Receipt
        </Button>
      </div>
 
      <div className="bg-white p-4 rounded-xl border border-brand-stone shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-tan" />
          <Input 
            placeholder="Search reference or supplier..." 
            className="pl-9 border-brand-stone focus:ring-brand-tan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {viewMode === 'list' ? renderList() : renderKanban()}
      </div>
    </div>
  )
}
