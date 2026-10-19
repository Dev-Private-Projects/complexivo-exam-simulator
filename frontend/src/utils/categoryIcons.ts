import {
  Atom,
  Boxes,
  Code,
  Cpu,
  Database,
  GitBranch,
  Globe,
  GraduationCap,
  Percent,
  Radio,
  ShieldCheck,
  Sigma,
  Terminal,
  Zap,
} from '@lucide/vue'

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'CALCULO I': { bg: '#dbeafe', text: '#1e40af' },
  'CALCULO II': { bg: '#e0e7ff', text: '#3730a3' },
  'ENTORNO VIRTUAL DE APRENDIZAJE': { bg: '#fef3c7', text: '#92400e' },
  'ARQUITECTURA DEL COMPUTADOR': { bg: '#f3e8ff', text: '#6b21a8' },
  ELECTROTECNIA: { bg: '#dcfce7', text: '#166534' },
  'ESTRUCTURA DE DATOS': { bg: '#ccfbf1', text: '#115e59' },
  FISICA: { bg: '#fee2e2', text: '#991b1b' },
  'FUNDAMENTOS DE BASE DE DATOS': { bg: '#fce7f3', text: '#9d174d' },
  'FUNDAMENTOS DE PROGRAMACION': { bg: '#e0f2fe', text: '#075985' },
  'PROGRAMACION ORIENTADA A OBJETOS': { bg: '#cffafe', text: '#155e75' },
  'REDES DE DATOS': { bg: '#fef9c3', text: '#854d0e' },
  'SEGURIDAD DE APLICACIONES': { bg: '#ffe4e6', text: '#9f1239' },
  'SISTEMAS OPERATIVOS': { bg: '#ede9fe', text: '#5b21b6' },
  'TECNOLOGIA DE TELECOMUNICACIONES': { bg: '#d1fae5', text: '#065f46' },
  'INGENIERIA DE SOFTWARE': { bg: '#f1f5f9', text: '#334155' },
}

export const CATEGORY_ICONS: Record<string, unknown> = {
  'CALCULO I': Percent,
  'CALCULO II': Sigma,
  'ENTORNO VIRTUAL DE APRENDIZAJE': GraduationCap,
  'ARQUITECTURA DEL COMPUTADOR': Cpu,
  ELECTROTECNIA: Zap,
  'ESTRUCTURA DE DATOS': Boxes,
  FISICA: Atom,
  'FUNDAMENTOS DE BASE DE DATOS': Database,
  'FUNDAMENTOS DE PROGRAMACION': Code,
  'PROGRAMACION ORIENTADA A OBJETOS': Boxes,
  'REDES DE DATOS': Globe,
  'SEGURIDAD DE APLICACIONES': ShieldCheck,
  'SISTEMAS OPERATIVOS': Terminal,
  'TECNOLOGIA DE TELECOMUNICACIONES': Radio,
  'INGENIERIA DE SOFTWARE': GitBranch,
}

export const badgeIconColor = (name: string) => {
  const color = CATEGORY_COLORS[name] ?? { bg: '#f3f4f6', text: '#374151' }
  return { color: color.text }
}

export const categoryAccent = (name: string) => {
  const color = CATEGORY_COLORS[name] ?? { bg: '#f3f4f6', text: '#374151' }
  return color.text
}

const FILLED_BADGES = new Set<string>(['CALCULO I'])

export const badgeIconFill = (name: string): string =>
  FILLED_BADGES.has(name) ? 'currentColor' : 'none'

export const badgeIcon = (name: string) => CATEGORY_ICONS[name] ?? Code

const MINOR_WORDS = new Set([
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'y',
  'e',
  'o',
  'u',
  'en',
  'para',
  'con',
  'por',
  'a',
  'un',
  'una',
])

export const formatCategoryName = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase()
      if (index > 0 && MINOR_WORDS.has(lower)) return lower
      if (/^[IVXLCDM]+$/.test(word)) return word
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
