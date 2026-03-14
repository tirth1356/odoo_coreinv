import { DashboardKpis } from '../components/DashboardKpis'
import { DashboardFilters } from '../components/DashboardFilters'
import { DashboardTable } from '../components/DashboardTable'
import { DashboardProductStock } from '../components/DashboardProductStock'

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-brown sm:text-3xl m-0 mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Overview of inventory and operations.
        </p>
      </div>

      <DashboardKpis />
      <DashboardProductStock />
      <DashboardFilters />
      <DashboardTable />
    </div>
  )
}
