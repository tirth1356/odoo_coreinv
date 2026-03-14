import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { BoxLoadingScreen } from './components/BoxLoadingScreen'
import { Layout } from './components/Layout'
import { AuthLayout } from './components/AuthLayout'

import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Landing } from './pages/Landing'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { ProductsList } from './pages/products/ProductsList'
import { ProductFormPage } from './pages/products/ProductForm'
import { ReceiptsList } from './pages/operations/ReceiptsList'
import { ReceiptFormPage } from './pages/operations/ReceiptForm'
import { DeliveriesList } from './pages/operations/DeliveriesList'
import { DeliveryFormPage } from './pages/operations/DeliveryForm'
import { TransfersList } from './pages/operations/TransfersList'
import { TransferFormPage } from './pages/operations/TransferForm'
import { AdjustmentsList } from './pages/operations/AdjustmentsList'
import { AdjustmentFormPage } from './pages/operations/AdjustmentForm'

import { MoveHistory } from './pages/MoveHistory'
import { ProfilePage } from './pages/settings/Profile'
import { WarehousesList } from './pages/settings/WarehousesList'
import { WarehouseFormPage } from './pages/settings/WarehouseForm'
import { LocationsList } from './pages/settings/LocationsList'
import { LocationFormPage } from './pages/settings/LocationForm'

function App() {
  const { initialize, loading, user } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return <BoxLoadingScreen />
  }

  return (
    <BrowserRouter>
      <Routes>
        {user ? (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/products/:id" element={<ProductFormPage />} />
            <Route path="/operations/receipts" element={<ReceiptsList />} />
            <Route path="/operations/receipts/:id" element={<ReceiptFormPage />} />
            <Route path="/operations/deliveries" element={<DeliveriesList />} />
            <Route path="/operations/deliveries/:id" element={<DeliveryFormPage />} />
            <Route path="/operations/transfers" element={<TransfersList />} />
            <Route path="/operations/transfers/:id" element={<TransferFormPage />} />
            <Route path="/operations/adjustments" element={<AdjustmentsList />} />
            <Route path="/operations/adjustments/:id" element={<AdjustmentFormPage />} />
            <Route path="/move-history" element={<MoveHistory />} />
            <Route path="/settings/profile" element={<ProfilePage />} />
            <Route path="/settings/warehouses" element={<WarehousesList />} />
            <Route path="/settings/warehouses/:id" element={<WarehouseFormPage />} />
            <Route path="/settings/locations" element={<LocationsList />} />
            <Route path="/settings/locations/:id" element={<LocationFormPage />} />
            {/* Catch all redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/" element={<Landing />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Catch all redirect to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
