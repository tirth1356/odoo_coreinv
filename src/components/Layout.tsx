import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-brand-cream flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col min-h-screen mx-auto w-full max-w-screen-2xl">
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
