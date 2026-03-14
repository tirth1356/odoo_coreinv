import { Calendar, Filter } from 'lucide-react'
import { Button } from './ui/Button'
import { useDashboardStore } from '../store/dashboardStore'
import type { OperationType, OperationStatus } from '../store/dashboardStore'

export const DashboardFilters = () => {
  const { type, setType, status, setStatus, timeRange, setTimeRange } = useDashboardStore()

  const types: OperationType[] = ['All', 'Receipts', 'Deliveries', 'Transfers', 'Adjustments']

  return (
    <div className="bg-white p-4 rounded-xl border border-brand-stone shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
        {types.map((t) => (
          <Button
            key={t}
            variant={type === t ? "primary" : "ghost"}
            size="sm"
            onClick={() => setType(t)}
            className={type === t ? "bg-brand-tan text-brand-brown" : "text-gray-500 hover:text-brand-brown"}
          >
            {t}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-brand-stone rounded-md text-sm text-brand-brown">
          <Filter className="w-4 h-4 text-brand-tan" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OperationStatus)}
            className="bg-transparent border-none focus:ring-0 text-sm outline-none text-brand-brown"
          >
            <option value="All Statuses">All</option>
            <option value="Draft">Draft</option>
            <option value="Waiting">Waiting</option>
            <option value="Ready">Ready</option>
            <option value="Done">Done</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 border border-brand-stone rounded-md text-sm text-brand-brown cursor-pointer hover:bg-brand-cream transition-colors">
          <Calendar className="w-4 h-4 text-brand-tan" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-transparent border-none focus:ring-0 text-sm outline-none text-brand-brown cursor-pointer"
          >
            <option value="All Time">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>
    </div>
  )
}
