import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Veiculos from './pages/Veiculos'
import Clientes from './pages/Clientes'
import Alugueres from './pages/Alugueres'
import Pagamentos from './pages/Pagamentos'

function RotaProtegida() {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm">A carregar sessão...</p>
        </div>
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />
  return <Layout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route index element={<Dashboard />} />
        <Route path="/veiculos" element={<Veiculos />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/alugueres" element={<Alugueres />} />
        <Route path="/pagamentos" element={<Pagamentos />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
