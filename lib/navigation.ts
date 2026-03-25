// Configuração centralizada de navegação
// Usado por Sidebar, MobileMenu e Layout
import {
  Users, DollarSign, ClipboardList, Dumbbell, Utensils,
  Activity, BarChart3, Settings, Home, type LucideIcon,
} from 'lucide-react';

export type UserRole = 'admin' | 'professor' | 'aluno';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

/** Acesso por role — quais IDs cada role pode acessar */
export const ROLE_ACCESS: Record<UserRole, string[]> = {
  admin: ['home', 'alunos', 'financeiro', 'planos', 'treinos', 'anamnese', 'avaliacao', 'relatorios', 'configuracoes'],
  professor: ['home', 'alunos', 'treinos', 'avaliacao', 'anamnese'],
  aluno: ['home', 'treinos', 'avaliacao'],
};

/** Todos os itens do menu com rotas reais */
export const allMenuItems: MenuItem[] = [
  { id: 'home', label: 'Início', icon: Home, path: '/dashboard' },
  { id: 'alunos', label: 'Alunos', icon: Users, path: '/dashboard/alunos' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, path: '/dashboard/financeiro' },
  { id: 'planos', label: 'Planos', icon: ClipboardList, path: '/dashboard/planos' },
  { id: 'treinos', label: 'Treinos', icon: Dumbbell, path: '/dashboard/treinos' },
  { id: 'anamnese', label: 'Anamnese', icon: Utensils, path: '/dashboard/anamnese' },
  { id: 'avaliacao', label: 'Avaliação Física', icon: Activity, path: '/dashboard/avaliacao' },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, path: '/dashboard/relatorios' },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/dashboard/configuracoes' },
];

/** Filtra menu items com base no role do usuário */
export function getMenuItemsForRole(role: UserRole): MenuItem[] {
  const allowedIds = ROLE_ACCESS[role] || ROLE_ACCESS.aluno;
  return allMenuItems.filter(item => allowedIds.includes(item.id));
}

/** Retorna o ID ativo com base no pathname atual */
export function getActiveIdFromPath(pathname: string): string {
  // /dashboard → home
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'home';
  // /dashboard/alunos → alunos
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  return match ? match[1] : 'home';
}
