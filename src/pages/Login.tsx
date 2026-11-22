import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Car, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { campoCls, labelCls } from '../components/ui'

export default function Login() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('admin@stand.ao')
  const [password, setPassword] = useState('admin123')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [erro, setErro] = useState('')
  const [aEntrar, setAEntrar] = useState(false)

  if (usuario) return <Navigate to="/admin" replace />

  async function submeter(evento: FormEvent) {
    evento.preventDefault()
    setErro('')
    setAEntrar(true)
    try {
      await login(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (error) {
      const mensagem =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível iniciar sessão. Verifique a ligação à API.'
      setErro(mensagem)
    } finally {
      setAEntrar(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Lado esquerdo — marca */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">Stand Automóvel</p>
            <p className="text-xs text-slate-400">Compra, gestão e venda de viaturas</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Do porto ao cliente,
            <br />
            cada viatura controlada.
          </h1>
          <p className="mt-4 text-slate-300">
            Registe a entrada das viaturas, os custos de desalfandegamento e preparação,
            as propostas e as vendas — e saiba o lucro de cada uma, em Kwanza.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {[
              'Stock e preparação',
              'Custos e margem',
              'Clientes e propostas',
              'Vendas e recibos',
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Stand Automóvel · Luanda, Angola
        </p>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex w-full items-center justify-center bg-slate-100 px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Stand Automóvel</p>
              <p className="text-xs text-slate-500">Compra, gestão e venda de viaturas</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Bem-vindo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Inicie sessão para aceder ao sistema.
            </p>

            {erro && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            <form onSubmit={submeter} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className={labelCls}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${campoCls} pl-10`}
                    placeholder="nome@empresa.ao"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={labelCls}>
                  Palavra-passe
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${campoCls} pl-10 pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-600"
                    aria-label={mostrarPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                  >
                    {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={aEntrar}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aEntrar && <Loader2 className="h-4 w-4 animate-spin" />}
                {aEntrar ? 'A entrar...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
              <p className="font-medium text-slate-600">Credenciais de demonstração</p>
              <p className="mt-1">
                Administrador: <span className="font-mono">admin@stand.ao</span> /{' '}
                <span className="font-mono">admin123</span>
              </p>
              <p>
                Vendedor: <span className="font-mono">vendedor@stand.ao</span> /{' '}
                <span className="font-mono">vendedor123</span>
              </p>
              <p>
                Stock: <span className="font-mono">stock@stand.ao</span> /{' '}
                <span className="font-mono">stock123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
