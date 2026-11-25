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
import SiteAdmin from './pages/SiteAdmin'
import Pedidos from './pages/Pedidos'
import { SiteProvider } from './publico/SiteContext'
import LayoutPublico from './publico/LayoutPublico'
import Home from './publico/Home'
import { Compramos, Contactos, Empresa, Intermediacao, ViaturasPublico } from './publico/Paginas'
import ViaturaDetalhe from './publico/Showroom'
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
  if (!pode(usuario, rota)) return <Navigate to="/admin" replace state={{ de: pathname }} />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Site público */}
      <Route element={<SiteProvider><LayoutPublico /></SiteProvider>}>
        <Route index element={<Home />} />
        <Route path="/empresa" element={<Empresa />} />
        <Route path="/viaturas" element={<ViaturasPublico />} />
        <Route path="/viaturas/:id" element={<ViaturaDetalhe />} />
        <Route path="/intermediacao" element={<Intermediacao />} />
        <Route path="/compramos" element={<Compramos />} />
        <Route path="/contactos" element={<Contactos />} />
      </Route>

      {/* Área reservada */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<RotaProtegida />}>
        <Route index element={<Dashboard />} />
        <Route path="viaturas" element={<Viaturas />} />
        <Route path="clientes" element={<ComAcesso rota="/clientes"><Clientes /></ComAcesso>} />
        <Route path="propostas" element={<ComAcesso rota="/propostas"><Propostas /></ComAcesso>} />
        <Route path="vendas" element={<ComAcesso rota="/vendas"><Vendas /></ComAcesso>} />
        <Route path="pedidos" element={<ComAcesso rota="/pedidos"><Pedidos /></ComAcesso>} />
        <Route path="site" element={<ComAcesso rota="/site"><SiteAdmin /></ComAcesso>} />
        <Route path="utilizadores" element={<ComAcesso rota="/utilizadores"><Utilizadores /></ComAcesso>} />
      </Route>
      {/* O recibo abre sem o menu, pronto a imprimir */}
      <Route path="/admin/vendas/:id/recibo" element={<Recibo />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
