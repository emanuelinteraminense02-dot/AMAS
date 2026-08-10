import type { Ionicons } from '@expo/vector-icons';

export type AssociadoSection =
  | 'perfil'
  | 'mensagens'
  | 'financeiro'
  | 'enviar'
  | 'historico'
  | 'carteirinha'
  | 'parceiros'
  | 'eventos';

export interface AssociadoNavItem {
  key: AssociadoSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  badge?: 'mensagens';
}

export const ASSOC_NAV: AssociadoNavItem[] = [
  { key: 'perfil',      label: 'Meu Perfil',     icon: 'person-outline',        title: 'Meu Perfil',           subtitle: 'Seus dados cadastrais' },
  { key: 'mensagens',   label: 'Mensagens',       icon: 'mail-outline',          title: 'Central de Mensagens', subtitle: 'Avisos e comunicados da AMAS', badge: 'mensagens' },
  { key: 'financeiro',  label: 'Financeiro',      icon: 'cash-outline',          title: 'Situação Financeira',  subtitle: 'Acompanhe sua contribuição' },
  { key: 'enviar',      label: 'Enviar Comp.',    icon: 'cloud-upload-outline',  title: 'Enviar Comprovante',   subtitle: 'Registre sua contribuição mensal' },
  { key: 'historico',   label: 'Histórico',       icon: 'time-outline',          title: 'Histórico',            subtitle: 'Todas as suas contribuições' },
  { key: 'carteirinha', label: 'Carteirinha',     icon: 'card-outline',          title: 'Carteirinha Digital',  subtitle: 'Sua identificação de associado' },
  { key: 'parceiros',   label: 'Parceiros',       icon: 'storefront-outline',    title: 'Empresas Parceiras',   subtitle: 'Descontos e benefícios exclusivos' },
  { key: 'eventos',     label: 'Eventos',         icon: 'calendar-outline',      title: 'Meus Eventos',         subtitle: 'Inscrições e eventos da AMAS' },
];
