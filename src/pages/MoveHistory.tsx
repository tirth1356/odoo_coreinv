import { useEffect, useState } from 'react'
import { Search, Filter, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { format } from 'date-fns'

export const MoveHistory = () => {
  const [moves, setMoves] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [movementType, setMovementType] = useState('all')

  const fetchMoves = async () => {
    setLoading(true)
    const { data: movesData } = await supabase
      .from('stock_ledger')
      .select(`
        *,
        products (name, sku),
        from_location:from_location_id (name, short_code),
        to_location:to_location_id (name, short_code)
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    const { data: locsData } = await supabase.from('locations').select('id, name, short_code')

    if (movesData) {
      setMoves(movesData)
    }
    if (locsData) {
      setLocations(locsData)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMoves()
  }, [])

  const filtered = moves.filter((m) => {
    const matchSearch = 
      m.products?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.products?.sku?.toLowerCase().includes(search.toLowerCase()) ||
      m.reference_id?.toLowerCase().includes(search.toLowerCase())
    
    const matchLocation = sourceFilter === 'all' || m.location_id === sourceFilter
    
    const matchType = movementType === 'all' || 
      (movementType === 'internal' && m.is_internal) ||
      (movementType === 'external' && !m.is_internal)
    
    return matchSearch && matchLocation && matchType
  })

  const getOperationBadge = (type: string) => {
    const map: Record<string, "warning" | "default" | "success" | "danger" | "info"> = {
      receipt: 'success',
      delivery: 'danger',
      transfer_in: 'info',
      transfer_out: 'warning',
      adjustment: 'default',
      initial: 'default'
    }
    const labelMap: Record<string, string> = {
      receipt: 'Receipt',
      delivery: 'Delivery',
      transfer_in: 'Internal (Entry)',
      transfer_out: 'Internal (Exit)',
      adjustment: 'Adjustment',
      initial: 'Initial Stock'
    }
    return <Badge variant={map[type] || 'default'}>{labelMap[type] || type}</Badge>
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown uppercase tracking-tight">Move History</h1>
          <p className="text-sm text-gray-500 font-medium">Detailed tracking of all physical inventory movements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-brand-stone text-brand-brown hover:bg-brand-cream">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-brand-stone shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-tan" />
          <Input 
            placeholder="Search product, SKU or reference..." 
            className="pl-9 border-brand-stone focus:ring-brand-tan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            clearable
            onClear={() => setSearch('')}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-tan hidden lg:block" />
          <select 
            className="h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan text-brand-brown"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">Main Location (Filter)</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select 
            className="h-10 w-full rounded-md border border-brand-stone bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-tan text-brand-brown"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
          >
            <option value="all">All Movements</option>
            <option value="internal">Internal Only</option>
            <option value="external">External Only</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden flex-1 min-h-0">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-brand-beige z-10">
              <tr className="bg-brand-beige/50 border-b border-brand-stone text-[10px] uppercase tracking-wider text-brand-brown/70 font-black">
                <th className="p-4">Date / Time</th>
                <th className="p-4">Product Info</th>
                <th className="p-4">Source (From)</th>
                <th className="p-4">Destination (To)</th>
                <th className="p-4 text-center">Operation</th>
                <th className="p-4 text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-stone/40 text-sm font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">Loading history...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">No stock moves found.</td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const isPositive = Number(m.quantity_change) > 0
                  const isNegative = Number(m.quantity_change) < 0
                  
                  return (
                    <tr key={m.id} className="hover:bg-brand-cream/50 transition-colors group">
                      <td className="p-4 text-gray-400 whitespace-nowrap text-xs">
                        {format(new Date(m.created_at), 'MMM dd, HH:mm')}
                      </td>
                      <td className="p-4">
                        <div className="font-black text-brand-brown">{m.products?.name}</div>
                        <div className="text-[10px] text-brand-tan font-mono uppercase tracking-tighter">{m.products?.sku}</div>
                      </td>
                      <td className="p-4">
                        {m.from_location ? (
                          <div className="flex flex-col">
                            <span className="text-brand-brown font-bold text-xs">{m.from_location.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{m.from_location.short_code}</span>
                          </div>
                        ) : (
                          <Badge variant="default" className="bg-gray-100 text-gray-500 border-gray-200 opacity-60">External / Supplier</Badge>
                        )}
                      </td>
                      <td className="p-4">
                         {m.to_location ? (
                          <div className="flex flex-col">
                            <span className="text-brand-brown font-bold text-xs">{m.to_location.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{m.to_location.short_code}</span>
                          </div>
                        ) : (
                          <Badge variant="default" className="bg-gray-100 text-gray-500 border-gray-200 opacity-60">External / Customer</Badge>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {getOperationBadge(m.operation_type)}
                      </td>
                      <td className={`p-4 text-right font-black font-mono text-lg ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
                        {isPositive ? '+' : ''}{m.quantity_change}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
