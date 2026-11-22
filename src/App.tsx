import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Viaturas from './pages/Viaturas'
import Clientes from './pages/Clientes'
import Propostas from './pages/Propostas'
import Vendas from './pages/Vendas'
import Recibo from './pages/Recibo'
import Utilizadores from './pages/Utilizadores'
import { pode } from './lib/perfis'

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

/** Só mostra a página aos perfis que têm acesso; os outros voltam ao painel. */
function ComAcesso({ rota, children }: { rota: string; children: ReactNode }) {
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  if (!pode(usuario, rota)) return <Navigate to="/" replace state={{ de: pathname }} />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route index element={<Dashboard />} />
        <Route path="/viaturas" element={<Viaturas />} />
        <Route path="/clientes" element={<ComAcesso rota="/clientes"><Clientes /></ComAcesso>} />
        <Route path="/propostas" element={<ComAcesso rota="/propostas"><Propostas /></ComAcesso>} />
        <Route path="/vendas" element={<ComAcesso rota="/vendas"><Vendas /></ComAcesso>} />
        <Route path="/utilizadores" element={<ComAcesso rota="/utilizadores"><Utilizadores /></ComAcesso>} />
      </Route>
      {/* O recibo abre sem o menu, pronto a imprimir */}
      <Route path="/vendas/:id/recibo" element={<Recibo />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
