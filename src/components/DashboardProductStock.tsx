import { useEffect, useState } from 'react'
import { Search, Warehouse, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Input } from './ui/Input'

export const DashboardProductStock = () => {
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [stockDetail, setStockDetail] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('id, name, sku')
      if (data) setProducts(data)
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProductId) {
      const fetchStockDetail = async () => {
        setLoading(true)
        const { data } = await supabase
          .from('stock_summary')
          .select('*')
          .eq('product_id', selectedProductId)
        
        if (data) setStockDetail(data)
        setLoading(false)
      }
      fetchStockDetail()
    } else {
      setStockDetail([])
    }
  }, [selectedProductId])

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalStock = stockDetail.reduce((acc, curr) => acc + Number(curr.on_hand), 0)
  const selectedProduct = products.find(p => p.id === selectedProductId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Search and Select Card */}
      <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-brand-stone shadow-sm flex flex-col h-[350px]">
        <h3 className="text-lg font-bold text-brand-brown mb-4 flex items-center gap-2 shrink-0">
          <Search className="w-5 h-5 text-brand-tan" />
          Stock Lookup
        </h3>
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="shrink-0">
            <Input 
              placeholder="Search product..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                if (selectedProductId) setSelectedProductId('')
              }}
              clearable
              onClear={() => {
                setSearchTerm('')
                setSelectedProductId('')
              }}
              className="mb-2"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto border border-brand-stone/30 rounded-lg bg-brand-cream/10">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProductId(p.id)
                  setSearchTerm(p.name)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-brand-cream transition-colors border-b border-brand-stone/20 last:border-0 ${selectedProductId === p.id ? 'bg-brand-cream ring-1 ring-inset ring-brand-tan/30' : ''}`}
              >
                <div className="font-bold text-brand-brown text-sm leading-tight">{p.name}</div>
                <div className="text-[10px] text-brand-tan font-bold uppercase tracking-wider">{p.sku}</div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-gray-400 italic">No products found</div>
            )}
          </div>
        </div>
      </div>

      {/* Result Card */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-brand-stone shadow-sm overflow-hidden flex flex-col h-[350px]">
        {selectedProductId ? (
          <>
            <div className="p-4 bg-brand-beige/20 border-b border-brand-stone/40 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-brand-brown uppercase tracking-tight">{selectedProduct?.name}</h3>
                <p className="text-xs text-brand-tan font-mono font-bold tracking-widest">{selectedProduct?.sku}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Total Available</span>
                <span className="text-3xl font-bold text-brand-brown">{totalStock}</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[200px]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-stone/20 text-brand-brown/60 text-[10px] font-bold uppercase tracking-wider">
                    <th className="p-3 pl-6">Warehouse / Location</th>
                    <th className="p-3 pr-6 text-right">Available Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-stone/10">
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-gray-400 italic">Loading details...</td>
                    </tr>
                  ) : stockDetail.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-gray-400 italic">No stock in any location</td>
                    </tr>
                  ) : (
                    stockDetail.map((s, i) => (
                      <tr key={i} className="hover:bg-brand-cream/20 transition-colors group">
                        <td className="p-3 pl-6">
                          <div className="flex items-center gap-2">
                            <Warehouse className="w-3.5 h-3.5 text-brand-tan opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div>
                              <span className="font-bold text-brand-brown block leading-none mb-1">{s.warehouse_name || 'No Warehouse'}</span>
                              <span className="text-[10px] text-gray-500 uppercase tracking-wide">{s.location_name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 pr-6 text-right font-bold text-brand-brown">
                          {s.on_hand}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="p-4 rounded-full bg-brand-cream/50 mb-4">
              <Package className="w-12 h-12 text-brand-stone" />
            </div>
            <h4 className="font-bold text-brand-brown mb-2 text-lg">Quick Stock Overview</h4>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Select a product from the lookup to see real-time availability across all locations.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
