import {
  Activity,
  BarChart3,
  ClipboardList,
  DollarSign,
  Dumbbell,
  FileStack,
  Home,
  Settings,
  Target,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const ROLE_ACCESS: Record<UserRole, string[]> = {
  admin: ['home', 'alunos', 'financeiro', 'planos', 'treinos', 'anamnese', 'avaliacao', 'protocolo-alimentar', 'desafio', 'relatorios', 'configuracoes', 'avatar'],
  professor: ['home', 'alunos', 'treinos', 'avaliacao', 'anamnese', 'protocolo-alimentar', 'desafio', 'avatar'],
  aluno: [],
};

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  admin: '/dashboard',
  professor: '/dashboard',
  aluno: '/aluno',
};

export const allMenuItems: MenuItem[] = [
  { id: 'home', label: 'Inicio', icon: Home, path: '/dashboard' },
  { id: 'alunos', label: 'Alunos', icon: Users, path: '/dashboard/alunos' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, path: '/dashboard/financeiro' },
  { id: 'planos', label: 'Planos', icon: ClipboardList, path: '/dashboard/planos' },
  { id: 'treinos', label: 'Treinos', icon: Dumbbell, path: '/dashboard/treinos' },
  { id: 'anamnese', label: 'Anamnese', icon: Utensils, path: '/dashboard/anamnese' },
  { id: 'avaliacao', label: 'Avaliacao Fisica', icon: Activity, path: '/dashboard/avaliacao' },
  { id: 'protocolo-alimentar', label: 'Protocolo Alimentar', icon: FileStack, path: '/dashboard/protocolo-alimentar' },
  { id: 'desafio', label: 'Desafio', icon: Target, path: '/dashboard/desafio' },
  { id: 'relatorios', label: 'Relatorios', icon: BarChart3, path: '/dashboard/relatorios' },
  { id: 'configuracoes', label: 'Configuracoes', icon: Settings, path: '/dashboard/configuracoes' },
];

export function getMenuItemsForRole(role: UserRole): MenuItem[] {
  return allMenuItems.filter((item) => ROLE_ACCESS[role].includes(item.id));
}

export function getDefaultRouteForRole(role: UserRole | null): string {
  if (!role) return '/auth';
  return ROLE_HOME_PATH[role];
}

export function getActiveIdFromPath(pathname: string): string {
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'home';
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  return match ? match[1] : 'home';
}
