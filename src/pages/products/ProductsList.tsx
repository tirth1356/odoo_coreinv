import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Package as PackageIcon, ArrowUpCircle, SortAsc, SortDesc, Calendar, Tag, Hash, Box } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button, cn } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useUIStore } from '../../store/uiStore'

export const ProductsList = () => {
  const navigate = useNavigate()
  const { viewMode } = useUIStore()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'total_stock' | 'created_at'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const fetchProducts = async () => {
    setLoading(true)
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('*, categories(name)')

    if (prodError) {
      console.error('Error fetching products:', prodError)
    }

    const { data: stockData, error: stockError } = await supabase
      .from('stock_summary')
      .select('product_id, on_hand')

    if (stockError) {
      console.error('Error fetching stock:', stockError)
    }

    if (prodData) {
      const merged = prodData.map((p: any) => {
        const stockItems = stockData?.filter((s) => s.product_id === p.id) || []
        const totalStock = stockItems.reduce((acc, curr) => acc + Number(curr.on_hand), 0)
        return {
          ...p,
          total_stock: totalStock,
          category_name: p.categories?.name || 'Uncategorized',
        }
      })
      setProducts(merged)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const filtered = products
    .filter((p) => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'total_stock') {
        comparison = a.total_stock - b.total_stock
      } else if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else {
        comparison = String(a[sortBy]).localeCompare(String(b[sortBy]))
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const getStatusBadge = (stock: number, reorder: number) => {
    if (stock <= 0) return <Badge variant="danger">Out of Stock</Badge>
    if (stock <= reorder) return <Badge variant="warning">Low Stock</Badge>
    return <Badge variant="success">In Stock</Badge>
  }

  const renderKanban = () => {
    const categories = Array.from(new Set(filtered.map(p => p.category_name)))
    if (categories.length === 0 && !loading) return <div className="text-center py-12 text-gray-400">No products found.</div>

    return (
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {categories.map(cat => {
          const catItems = filtered.filter(item => item.category_name === cat)
          return (
            <div key={cat} className="flex-1 min-w-[300px] bg-white/40 backdrop-blur-sm rounded-xl p-4 flex flex-col gap-3 border border-brand-tan/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-brand-brown underline decoration-brand-tan/30 decoration-2 underline-offset-4">{cat}</h3>
                <span className="bg-brand-tan text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">{catItems.length}</span>
              </div>
              
              {catItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => navigate(`/products/${item.id}`)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-brand-stone hover:shadow-md cursor-pointer transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-brand-tan uppercase">{item.sku}</span>
                    {getStatusBadge(item.total_stock, item.reorder_point)}
                  </div>
                  <div className="font-medium text-brand-brown mb-2 line-clamp-2">
                    {item.name}
                  </div>
                  <div className="text-sm text-gray-500 flex justify-between items-center mt-4 pt-4 border-t border-brand-cream">
                    <div className="flex items-center gap-1">
                      <PackageIcon className="w-3 h-3 text-brand-tan" />
                      <span className="font-bold text-brand-brown">{item.total_stock}</span>
                      <span className="text-xs uppercase">{item.unit_of_measure}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-[10px] border-brand-tan text-brand-tan hover:bg-brand-tan hover:text-white transition-all font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/operations/receipts/new?product_id=${item.id}`);
                        }}
                      >
                        <ArrowUpCircle className="w-3 h-3 mr-1" /> Replenish
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
              <th className="p-4">SKU</th>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Unit</th>
              <th className="p-4 text-right">On Hand</th>
              <th className="p-4 text-right">Reorder Point</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-stone/40 text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">Loading products...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400">No products found.</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-brand-cream/50 cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                  <td className="p-4 font-mono text-brand-tan font-bold uppercase">{p.sku}</td>
                  <td className="p-4 font-medium text-brand-brown">{p.name}</td>
                  <td className="p-4 text-gray-500">{p.category_name}</td>
                  <td className="p-4 text-gray-500">{p.unit_of_measure}</td>
                  <td className="p-4 text-right font-bold text-brand-brown">{p.total_stock}</td>
                  <td className="p-4 text-right text-gray-500">{p.reorder_point}</td>
                  <td className="p-4">{getStatusBadge(p.total_stock, p.reorder_point)}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-[10px] border-brand-tan text-brand-tan hover:bg-brand-tan hover:text-white transition-all font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/operations/receipts/new?product_id=${p.id}`);
                      }}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5 mr-1" /> Replenish
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/products/${p.id}`); }}>
                      <Edit className="w-4 h-4 text-gray-500" />
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
          <h1 className="text-2xl font-bold text-brand-brown">Products</h1>
          <p className="text-sm text-gray-500">Manage your inventory catalog</p>
        </div>
        <Button onClick={() => navigate('/products/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Product
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-brand-stone shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-tan" />
          <Input 
            placeholder="Search SKU or name..." 
            className="pl-9 border-brand-stone focus:ring-brand-tan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-brown/40 mr-1 hidden sm:block">Sort By:</span>
          <div className="flex items-center gap-1 bg-brand-cream/30 p-1 rounded-lg border border-brand-stone/30 w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'name', label: 'Name', icon: Tag },
              { id: 'sku', label: 'SKU', icon: Hash },
              { id: 'total_stock', label: 'Stock', icon: Box },
              { id: 'created_at', label: 'Date', icon: Calendar },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (sortBy === option.id) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  } else {
                    setSortBy(option.id as any)
                    setSortOrder('asc')
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                  sortBy === option.id 
                    ? "bg-brand-brown text-white shadow-sm" 
                    : "text-brand-brown/60 hover:bg-brand-cream"
                )}
              >
                <option.icon className="w-3 h-3" />
                {option.label}
                {sortBy === option.id && (
                  sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-0.5" /> : <SortDesc className="w-3 h-3 ml-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {viewMode === 'list' ? renderList() : renderKanban()}
      </div>
    </div>
  )
}
