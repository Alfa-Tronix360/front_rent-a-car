import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { botaoPub, campoPub, sobretitulo } from '../publico/componentes'
import { BotaoTema, Logotipo, useTema } from '../publico/tema'

const rotulo = 'mb-1.5 block font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-tinta/50'

export default function Login() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()
  const [tema, mudarTema] = useTema()

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
    <div className={`tema-${tema} flex min-h-screen flex-col bg-base-950 text-tinta/80 transition-colors duration-300`}>
      {/* Barra superior, como no site */}
      <header className="relative z-20 border-b border-tinta/[0.06] bg-base-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 lg:px-8">
          <Logotipo />
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden items-center gap-2 px-3 font-display text-xs font-semibold uppercase tracking-[0.18em] text-tinta/60 hover:text-tinta sm:flex">
              <ArrowLeft className="h-4 w-4" /> Voltar ao site
            </Link>
            <BotaoTema tema={tema} onMudar={mudarTema} />
          </div>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* Palco de estúdio com o Jetour (nada aqui cria grupo de empilhamento, para o «multiply» fundir o fundo branco) */}
        <section className="palco-exterior relative isolate hidden overflow-hidden lg:block" aria-hidden="true">
          <p className="pointer-events-none absolute -left-[2vw] bottom-[4%] select-none font-display text-[13vw] font-bold uppercase leading-none tracking-tighter text-tinta/[0.04]">
            Jetour
          </p>
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 45% 50% at 50% 62%, rgb(224 38 47 / 0.22), transparent 70%)' }} />
          <div className="linha-luz absolute inset-x-0 top-0" />
          <div className="foco-estudio pointer-events-none absolute -inset-x-[10%] top-[18%] -bottom-[10%]" />
          <div className="pointer-events-none absolute bottom-[14%] left-1/2 aspect-square w-[78%] origin-bottom"
            style={{ transform: 'translateX(-50%) perspective(900px) rotateX(78deg)' }}>
            <div className="plataforma plataforma-gira absolute inset-0" />
          </div>
          <div className="pedestal pointer-events-none absolute inset-x-[16%] bottom-[16%] h-16" />
          <img src="/showroom/hero-jetour-vermelho.webp" alt="" draggable={false}
            className="imagem-estudio balanco absolute left-[6%] top-[40%] h-[48%] w-[88%] object-contain"
            style={{ transform: 'perspective(1400px) rotateY(var(--balanco))' }} />

          <div className="banner-entrada relative px-12 pt-14 xl:px-16">
            <p className={sobretitulo}>Área reservada</p>
            <h1 className="mt-4 max-w-xl font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-tinta xl:text-6xl">
              Do porto ao cliente, cada viatura controlada.
            </h1>
            <div className="mt-6 flex max-w-xl flex-wrap gap-2">
              {['Stock e preparação', 'Custos e margem', 'Clientes e propostas', 'Vendas e recibos'].map((item) => (
                <span key={item} className="vidro rounded-full px-4 py-1.5 text-xs font-medium text-tinta/75">{item}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Formulário */}
        <section className="relative isolate flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="palco-exterior absolute inset-0 -z-10 lg:hidden" />
          <div className="w-full max-w-md">
            <p className={sobretitulo}>Bem-vindo</p>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-tinta">Iniciar sessão</h2>
            <span className="mt-4 block h-0.5 w-12 bg-acento" />
            <p className="mt-4 text-sm text-tinta/55">Entre com a sua conta para aceder à gestão do stand.</p>

            {erro && (
              <div role="alert" className="mt-6 rounded-xl border border-acento/30 bg-acento/10 px-4 py-3 text-sm text-acento-claro">
                {erro}
              </div>
            )}

            <form onSubmit={submeter} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className={rotulo}>Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta/35" />
                  <input id="email" type="email" required autoComplete="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} className={`${campoPub} pl-10`} placeholder="nome@empresa.ao" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={rotulo}>Palavra-passe</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta/35" />
                  <input id="password" type={mostrarPassword ? 'text' : 'password'} required autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)} className={`${campoPub} pl-10 pr-11`} placeholder="••••••••" />
                  <button type="button" onClick={() => setMostrarPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-tinta/40 transition hover:bg-tinta/10 hover:text-tinta"
                    aria-label={mostrarPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}>
                    {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={aEntrar} className={`${botaoPub} w-full`}>
                {aEntrar && <Loader2 className="h-4 w-4 animate-spin" />}
                {aEntrar ? 'A entrar...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-tinta/[0.08] bg-base-900/70 p-5 text-xs text-tinta/55">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-tinta/70">Credenciais de demonstração</p>
              <dl className="mt-3 space-y-1.5">
                {[['Administrador', 'admin@stand.ao', 'admin123'], ['Vendedor', 'vendedor@stand.ao', 'vendedor123'], ['Stock', 'stock@stand.ao', 'stock123']].map(([p, e, s]) => (
                  <div key={p} className="flex flex-wrap justify-between gap-x-3">
                    <dt>{p}</dt>
                    <dd className="font-mono text-tinta/75">{e} / {s}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-8 text-center text-xs text-tinta/35">© {new Date().getFullYear()} AV Stand Automóvel · Luanda, Angola</p>
          </div>
        </section>
      </div>
    </div>
  )
}
