import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  Activity, 
  Dumbbell, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  FileText, 
  Settings 
} from 'lucide-react';

export const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', href: '/' },
  { icon: Users, label: 'Alunos', id: 'students', href: '/students' },
  { icon: ClipboardCheck, label: 'Anamnese', id: 'anamnesis', href: '/anamnesis' },
  { icon: Activity, label: 'Avaliação Física', id: 'evaluation', href: '/assessments' },
  { icon: Dumbbell, label: 'Treinos', id: 'workouts', href: '/workouts' },
  { icon: CreditCard, label: 'Planos', id: 'plans', href: '/plans' },
  { icon: Wallet, label: 'Pagamentos', id: 'payments', href: '/financial' },
  { icon: TrendingUp, label: 'Financeiro', id: 'financial', href: '/financial' },
  { icon: FileText, label: 'Relatórios', id: 'reports', href: '/reports' },
  { icon: Settings, label: 'Configurações', id: 'settings', href: '/settings' },
];

export const STATS = [
  { label: 'Total de Alunos', value: '124', icon: Users, color: 'orange' },
  { label: 'Alunos Ativos', value: '98', icon: ClipboardCheck, color: 'green' },
  { label: 'Pagamentos Pendentes', value: '12', icon: Activity, color: 'red' },
  { label: 'Receita Mensal', value: 'R$ 15.400', icon: TrendingUp, color: 'orange' },
  { label: 'Vencimentos Próximos', value: '5', icon: CreditCard, color: 'orange' },
];

export const REVENUE_DATA = [
  { month: 'Jan', revenue: 6000 },
  { month: 'Fev', revenue: 9000 },
  { month: 'Mar', revenue: 11000 },
  { month: 'Abr', revenue: 10000 },
  { month: 'Mai', revenue: 13000 },
  { month: 'Jun', revenue: 12000 },
  { month: 'Jul', revenue: 16000 },
];

export const PAYMENT_REMINDERS = [
  { name: 'Ana Souza', date: 'Vence Amanhã', amount: 'R$ 300,00', status: 'atrasado' },
  { name: 'Lucas Pereira', date: 'Atrasado', amount: 'R$ 250,00', status: 'atrasado' },
  { name: 'Carla Mendes', date: 'Vence em 3 Dias', amount: 'R$ 180,00', status: 'pendente' },
  { name: 'João Lima', date: 'Vence em 5 Dias', amount: 'R$ 150,00', status: 'pendente' },
];

export const UPCOMING_EXPIRATIONS = [
  { name: 'Mariana Silva', date: 'Expira: 25 Mai, 2024' },
  { name: 'Rafael Costa', date: 'Expira: 27 Mai, 2024' },
  { name: 'Fernanda Oliveira', date: 'Expira: 29 Mai, 2024' },
];

export const RECENT_SIGNUPS = [
  { name: 'Beatrix Gomes', date: 'Entrou: 20 Abr, 2024' },
  { name: 'Daniel Rocha', date: 'Entrou: 18 Abr, 2024' },
  { name: 'Juliana Martins', date: 'Entrou: 15 Abr, 2024' },
];
