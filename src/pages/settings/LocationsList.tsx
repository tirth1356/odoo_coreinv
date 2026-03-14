import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export const LocationsList = () => {
  const navigate = useNavigate()
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchLocations = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('locations')
      .select('*, warehouses(name), parent:locations!parent_location_id(name)')
      .order('name')

    if (data) {
      setLocations(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  const filtered = locations.filter((loc) => 
    loc.name.toLowerCase().includes(search.toLowerCase()) ||
    loc.short_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-brown">Locations</h1>
          <p className="text-sm text-gray-500 font-medium">Manage internal zones, shelves, and bins</p>
        </div>
        <Button onClick={() => navigate('/settings/locations/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Location
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
                <th className="p-4">Type</th>
                <th className="p-4">Warehouse</th>
                <th className="p-4">Parent Location</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-stone/40 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">Loading locations...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">No locations found.</td>
                </tr>
              ) : (
                filtered.map((loc) => (
                  <tr key={loc.id} className="hover:bg-brand-cream/50 cursor-pointer" onClick={() => navigate(`/settings/locations/${loc.id}`)}>
                    <td className="p-4 font-bold text-brand-brown">{loc.name}</td>
                    <td className="p-4 font-mono text-brand-tan font-bold uppercase">{loc.short_code}</td>
                    <td className="p-4 text-gray-500 font-medium capitalize">{loc.type.replace('_', ' ')}</td>
                    <td className="p-4 text-gray-500 font-medium">{loc.warehouses?.name || '-'}</td>
                    <td className="p-4 text-gray-500 font-medium">{loc.parent?.name || '-'}</td>
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
