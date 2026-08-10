// Paleta e tokens visuais da AMAS — espelham as CSS variables de css/style.css
// (tema claro; o app mobile não implementa dark mode nesta primeira etapa)

export const colors = {
  azulDeep: '#232850',
  azulMid: '#cf941d',
  azulBright: '#1a1e3d',
  douradoClaro: '#e8a82a',
  douradoEscuro: '#a87215',
  navyMid: '#2e3566',
  cinzaAzul: '#4a4060',
  cinzaSoft: '#6C6E84',
  cinzaDark: '#2A2A33',

  bg: '#F5F6FA',
  bgCard: '#FFFFFF',
  surface: '#f2ead8',
  border: 'rgba(207,148,29,0.18)',

  textPrimary: '#232850',
  textSecondary: '#4a4060',
  textMuted: '#6C6E84',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.75)',

  statusRegular: '#22c55e',
  statusInadimplente: '#ef4444',
  statusAnalise: '#f59e0b',
  statusRevisao: '#f97316',
  statusPendente: '#6C6E84',
  statusAprovado: '#22c55e',
  statusRecusado: '#ef4444',

  white: '#FFFFFF',
  success: '#16a34a',
  danger: '#ef4444',
  warning: '#f59e0b',
} as const;

export const gradients = {
  hero: ['#232850', '#2e3566', '#1a1e3d'],
  accent: ['#cf941d', '#e8a82a'],
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 24,
  xl: 40,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#232850',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#232850',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#232850',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 10,
  },
} as const;

export const typography = {
  h1: { fontSize: 30, fontWeight: '800' as const, lineHeight: 36 },
  h2: { fontSize: 24, fontWeight: '800' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '700' as const, lineHeight: 24 },
  h4: { fontSize: 15, fontWeight: '700' as const, lineHeight: 20 },
  body: { fontSize: 14.5, fontWeight: '400' as const, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '700' as const, lineHeight: 16, letterSpacing: 0.4 },
};
