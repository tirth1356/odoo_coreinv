import { create } from 'zustand'

export type OperationType = 'All' | 'Receipts' | 'Deliveries' | 'Transfers' | 'Adjustments'
export type OperationStatus = 'All Statuses' | 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled'

interface DashboardState {
  type: OperationType
  status: OperationStatus
  timeRange: 'Today' | 'This Week' | 'This Month' | 'All Time'
  setType: (type: OperationType) => void
  setStatus: (status: OperationStatus) => void
  setTimeRange: (range: 'Today' | 'This Week' | 'This Month' | 'All Time') => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  type: 'All',
  status: 'All Statuses',
  timeRange: 'All Time',
  setType: (type) => set({ type }),
  setStatus: (status) => set({ status }),
  setTimeRange: (timeRange) => set({ timeRange }),
}))
