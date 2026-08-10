import type { Ionicons } from '@expo/vector-icons';

export type AdminSection =
  | 'dashboard'
  | 'mesa'
  | 'associados'
  | 'broadcast'
  | 'alertas'
  | 'contratos'
  | 'relatorios'
  | 'monitor'
  | 'noticias'
  | 'eventos'
  | 'solicitacoes'
  | 'recuperacao';

export interface AdminNavItem {
  key: AdminSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  badge?: 'mesa' | 'alertas' | 'recuperacao';
}

export const ADMIN_NAV: AdminNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', title: 'Dashboard', subtitle: 'Visão geral do sistema AMAS' },
  { key: 'mesa', label: 'Mesa de Operações', icon: 'file-tray-full-outline', title: 'Mesa de Operações', subtitle: 'Validar comprovantes enviados pelos associados', badge: 'mesa' },
  { key: 'associados', label: 'Associados', icon: 'people-outline', title: 'Associados', subtitle: 'Gerencie todos os membros da associação' },
  { key: 'broadcast', label: 'Broadcast', icon: 'megaphone-outline', title: 'Broadcast', subtitle: 'Envie mensagens para grupos de usuários' },
  { key: 'alertas', label: 'Alertas', icon: 'notifications-outline', title: 'Alertas de Empresários', subtitle: 'Comunicados urgentes dos parceiros', badge: 'alertas' },
  { key: 'contratos', label: 'Parcerias', icon: 'people-circle-outline', title: 'Catálogo de Parcerias', subtitle: 'Gerencie os convênios e benefícios para associados' },
  { key: 'relatorios', label: 'Relatórios', icon: 'bar-chart-outline', title: 'Relatórios', subtitle: 'Dados e exportação do sistema' },
  { key: 'monitor', label: 'Monitor', icon: 'pulse-outline', title: 'Monitor de Atividades', subtitle: 'Log de ações realizadas no sistema' },
  { key: 'noticias', label: 'Notícias', icon: 'newspaper-outline', title: 'Notícias', subtitle: 'Publique e gerencie as notícias da AMAS' },
  { key: 'eventos', label: 'Eventos', icon: 'calendar-outline', title: 'Eventos', subtitle: 'Organize os eventos da associação' },
  { key: 'solicitacoes', label: 'Solicitações', icon: 'person-add-outline', title: 'Solicitações', subtitle: 'Novos pedidos de associação' },
  { key: 'recuperacao', label: 'Recuperação', icon: 'key-outline', title: 'Recuperação de Acesso', subtitle: 'Resets de senha solicitados pelos usuários', badge: 'recuperacao' },
];
