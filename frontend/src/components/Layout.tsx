import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { UpdateBanner } from './UpdateBanner'

export function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <UpdateBanner />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Calculadora Eléctrica — DIgSILENT PowerFactory y más
      </footer>
    </div>
  )
}
