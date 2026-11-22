export function fmtKz(valor: number | null | undefined): string {
  const n = Number(valor ?? 0)
  return `${n.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Kz`
}

export function fmtData(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-AO')
}

export function fmtDataHora(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Converte ISO/datetime para o formato aceite por <input type="datetime-local"> */
export function paraInputDateTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

/** Data/hora por defeito: agora + n dias, no formato datetime-local */
export function inputDateTimeDaquiA(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return paraInputDateTime(d.toISOString())
}

export function badgeEstado(estado: string): string {
  switch (estado) {
    case 'Disponível':
    case 'Aceite':
      return 'bg-green-100 text-green-700'
    case 'Em Trânsito':
      return 'bg-sky-100 text-sky-700'
    case 'Em Preparação':
      return 'bg-orange-100 text-orange-700'
    case 'Reservado':
    case 'Pendente':
      return 'bg-amber-100 text-amber-700'
    case 'Vendido':
    case 'Convertida':
      return 'bg-slate-200 text-slate-700'
    case 'Recusada':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/** Data de hoje para <input type="date">. */
export function hojeInput(): string {
  return new Date().toLocaleDateString('sv-SE')
}
