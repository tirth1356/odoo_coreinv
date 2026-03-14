import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, AlertTriangle, PackageX, PackagePlus, PackageMinus, X, ExternalLink, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from './ui/Button'

interface KpiCardProps {
  label: string
  value: number | string
  icon: any
  variant?: 'default' | 'amber' | 'red' | 'blue' | 'green'
  onClick?: () => void
}

const variants = {
  default: 'bg-white border-brand-stone text-brand-brown hover:shadow-md hover:border-brand-tan/50',
  amber: 'bg-[#fff8e1] border-[#ffecb3] text-[#f57f17] hover:shadow-md hover:border-[#f57f17]/30',
  red: 'bg-[#ffebee] border-[#ffcdd2] text-[#c62828] hover:shadow-md hover:border-[#c62828]/30',
  blue: 'bg-[#e3f2fd] border-[#bbdefb] text-[#1565c0] hover:shadow-md hover:border-[#1565c0]/30',
  green: 'bg-[#e7f5e9] border-[#c8e6c9] text-[#2e7d32] hover:shadow-md hover:border-[#2e7d32]/30',
}

const iconColors = {
  default: 'text-brand-tan',
  amber: 'text-[#f57f17]',
  red: 'text-[#c62828]',
  blue: 'text-[#1565c0]',
  green: 'text-[#2e7d32]',
}

const KpiCard = ({ label, value, icon: Icon, variant = 'default', onClick }: KpiCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        `p-6 rounded-xl border ${variants[variant]} shadow-sm flex items-center justify-between transition-all duration-200 cursor-pointer group active:scale-[0.98]`,
      )}
    >
      <div>
        <p className="text-sm font-semibold text-brand-brown/60 mb-1 uppercase tracking-tight group-hover:text-brand-brown transition-colors">{label}</p>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
      </div>
      <div className={cn(
        `p-3 rounded-lg bg-white/80 shadow-inner ${iconColors[variant]} transition-transform duration-200 group-hover:scale-110`,
      )}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  )
}

export const DashboardKpis = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0
  })
  
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null)
  const [details, setDetails] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      const [prodRes, stockRes, recRes, delRes] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('stock_summary').select('on_hand, reorder_point'),
        supabase.from('receipts').select('*', { count: 'exact', head: true }).in('status', ['draft', 'waiting', 'ready']),
        supabase.from('deliveries').select('*', { count: 'exact', head: true }).in('status', ['draft', 'waiting', 'ready'])
      ])

      let low = 0
      let out = 0

      stockRes.data?.forEach(s => {
        const onHand = Number(s.on_hand)
        const reorder = Number(s.reorder_point)
        if (onHand <= 0) out++
        else if (onHand <= reorder) low++
      })

      setStats({
        totalProducts: prodRes.count || 0,
        lowStock: low,
        outOfStock: out,
        pendingReceipts: recRes.count || 0,
        pendingDeliveries: delRes.count || 0
      })
    }
    fetchStats()
  }, [])

  useEffect(() => {
    if (selectedKpi) {
      fetchDetails(selectedKpi)
    } else {
      setDetails([])
    }
  }, [selectedKpi])

  const fetchDetails = async (kpi: string) => {
    setLoadingDetails(true)
    try {
      if (kpi === 'Total Products') {
        const { data } = await supabase.from('products').select('id, name, sku, category:categories(name)').limit(20)
        setDetails(data || [])
      } else if (kpi === 'Low Stock Items' || kpi === 'Out of Stock') {
        const { data } = await supabase.from('stock_summary').select('product_id, product_name, product_sku, on_hand, reorder_point')
        const filtered = data?.filter(s => {
          const oh = Number(s.on_hand)
          const rp = Number(s.reorder_point)
          return kpi === 'Out of Stock' ? oh <= 0 : (oh > 0 && oh <= rp)
        }) || []
        setDetails(filtered)
      } else if (kpi === 'Pending Receipts') {
        const { data } = await supabase.from('receipts').select('id, reference, scheduled_date, supplier_name').in('status', ['draft', 'waiting', 'ready'])
        setDetails(data || [])
      } else if (kpi === 'Pending Deliveries') {
        const { data } = await supabase.from('deliveries').select('id, reference, scheduled_date, customer_name').in('status', ['draft', 'waiting', 'ready'])
        setDetails(data || [])
      }
    } catch (error) {
      console.error('Error fetching details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  return (
    <div className="mb-6 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total Products" value={stats.totalProducts} icon={Package} onClick={() => setSelectedKpi('Total Products')} />
        <KpiCard label="Low Stock Items" value={stats.lowStock} icon={AlertTriangle} variant="amber" onClick={() => setSelectedKpi('Low Stock Items')} />
        <KpiCard label="Out of Stock" value={stats.outOfStock} icon={PackageX} variant="red" onClick={() => setSelectedKpi('Out of Stock')} />
        <KpiCard label="Pending Receipts" value={stats.pendingReceipts} icon={PackagePlus} variant="blue" onClick={() => setSelectedKpi('Pending Receipts')} />
        <KpiCard label="Pending Deliveries" value={stats.pendingDeliveries} icon={PackageMinus} variant="green" onClick={() => setSelectedKpi('Pending Deliveries')} />
      </div>

      {/* Detail Modal */}
      {selectedKpi && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-brand-brown/40 backdrop-blur-sm" onClick={() => setSelectedKpi(null)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-4 sm:p-6 flex items-center justify-between border-b ${
              selectedKpi === 'Out of Stock' ? 'bg-red-50 border-red-100' :
              selectedKpi === 'Low Stock Items' ? 'bg-amber-50 border-amber-100' :
              selectedKpi === 'Pending Receipts' ? 'bg-blue-50 border-blue-100' :
              selectedKpi === 'Pending Deliveries' ? 'bg-green-50 border-green-100' :
              'bg-brand-cream/30 border-brand-stone/30'
            }`}>
              <div>
                <h3 className="text-xl font-bold text-brand-brown">{selectedKpi}</h3>
                <p className="text-sm text-brand-brown/60">Showing {details.length} items</p>
              </div>
              <button 
                onClick={() => setSelectedKpi(null)}
                className="p-2 rounded-full hover:bg-black/5 transition-colors text-brand-brown/60 hover:text-brand-brown"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 text-brand-tan animate-spin mb-4" />
                  <p className="text-brand-brown/60 font-medium">Crunching details...</p>
                </div>
              ) : details.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-brand-stone/30 mx-auto mb-4" />
                  <p className="text-brand-brown/60 italic">No details available for this category</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {details.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      className="group flex items-center justify-between p-4 rounded-xl border border-brand-stone/20 hover:border-brand-tan/50 hover:bg-brand-cream/10 transition-all duration-200 bg-white shadow-sm hover:shadow"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-brand-brown truncate">
                            {item.product_name || item.name || item.reference || item.product_sku || item.sku || 'Unknown Item'}
                          </span>
                          {item.on_hand !== undefined && (
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-bold",
                              Number(item.on_hand) <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {item.on_hand} {item.unit_of_measure || 'units'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-brand-tan/80">
                          {(item.product_sku || item.sku) && <span>SKU: {item.product_sku || item.sku}</span>}
                          {(item.scheduled_date || item.date) && <span>Date: {new Date(item.scheduled_date || item.date).toLocaleDateString()}</span>}
                          {item.category?.name && <span>• {item.category.name}</span>}
                          {item.supplier_name && <span>• {item.supplier_name}</span>}
                          {item.customer_name && <span>• {item.customer_name}</span>}
                        </div>
                      </div>
                      <div 
                        className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedKpi === 'Low Stock Items' || selectedKpi === 'Out of Stock' || selectedKpi === 'Total Products') {
                            navigate(`/products/${item.product_id || item.id}`);
                          } else if (selectedKpi === 'Pending Receipts') {
                            navigate(`/operations/receipts/${item.id}`);
                          } else if (selectedKpi === 'Pending Deliveries') {
                            navigate(`/operations/deliveries/${item.id}`);
                          }
                          setSelectedKpi(null);
                        }}
                      >
                         <div className="p-2 rounded-lg bg-brand-cream text-brand-tan hover:bg-brand-tan hover:text-white transition-colors">
                            <ExternalLink className="w-4 h-4" />
                         </div>
                      </div>
                    </div>
                  ))}
                  {selectedKpi === 'Total Products' && stats.totalProducts > 20 && (
                    <p className="text-center text-xs text-brand-brown/40 pt-2 italic">Showing first 20 products. Visit Products page for full list.</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedKpi(null)}
                className="px-6 py-2 rounded-lg bg-brand-brown text-white font-bold hover:bg-brand-brown/90 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
