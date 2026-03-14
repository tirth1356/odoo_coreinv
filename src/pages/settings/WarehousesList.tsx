import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export const WarehousesList = () => {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchWarehouses = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('warehouses')
      .select('*, locations(count)')
      .order('name')

    if (data) {
      const formatted = data.map((w: any) => ({
        ...w,
        locations_count: w.locations?.[0]?.count || 0
      }))
      setWarehouses(formatted)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const filtered = warehouses.filter((w) => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.short_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">Warehouses</h1>
          <p className="text-sm text-gray-500 font-medium">Manage physical buildings and facilities</p>
        </div>
        <Button onClick={() => navigate('/settings/warehouses/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Warehouse
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-brand-stone shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-tan" />
          <Input 
            placeholder="Search name or code..." 
            className="pl-9 border-brand-stone focus:ring-brand-tan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-beige/50 border-b border-brand-stone text-xs uppercase tracking-wider text-brand-brown/70 font-bold">
                <th className="p-4">Name</th>
                <th className="p-4">Short Code</th>
                <th className="p-4">Address</th>
                <th className="p-4 text-center">Locations</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-stone/40 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">Loading warehouses...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">No warehouses found.</td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-brand-cream/50 cursor-pointer" onClick={() => navigate(`/settings/warehouses/${w.id}`)}>
                    <td className="p-4 font-bold text-brand-brown">{w.name}</td>
                    <td className="p-4 font-mono text-brand-tan font-bold uppercase">{w.short_code}</td>
                    <td className="p-4 text-gray-500 font-medium">{w.address || '-'}</td>
                    <td className="p-4 text-center font-bold text-brand-brown">{w.locations_count}</td>
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
    </div>
  )
}
