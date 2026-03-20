'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Activity, TrendingUp, CreditCard, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: student } = await supabase
          .from('students')
          .select('*, assessments(*), workouts(*)')
          .eq('user_id', user.id)
          .single();
        
        setStudentData(student);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Olá, {user?.user_metadata?.full_name || 'Aluna'}!</h1>
            <p className="text-gray-400">Bem-vinda à sua área exclusiva.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold">{studentData?.plan_name || 'Plano Ativo'}</p>
              <p className="text-xs text-[#FF6B00]">Status: {studentData?.status || 'Ativo'}</p>
            </div>
            <div className="w-12 h-12 bg-[#FF6B00] rounded-full flex items-center justify-center font-bold text-xl">
              {user?.user_metadata?.full_name?.[0] || 'A'}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Meu Treino</CardTitle>
              <Dumbbell className="h-4 w-4 text-[#FF6B00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentData?.workouts?.length || 0}</div>
              <p className="text-xs text-gray-400">Treinos ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Última Avaliação</CardTitle>
              <Activity className="h-4 w-4 text-[#FF6B00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentData?.assessments?.[0]?.date ? format(new Date(studentData.assessments[0].date), 'dd/MM') : '--/--'}
              </div>
              <p className="text-xs text-gray-400">Data da última medição</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Evolução</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#FF6B00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--%</div>
              <p className="text-xs text-gray-400">Progresso corporal</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
              <CreditCard className="h-4 w-4 text-[#FF6B00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Em dia</div>
              <p className="text-xs text-gray-400">Próximo vencimento: --/--</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader>
              <CardTitle>Meu Treino Atual</CardTitle>
            </CardHeader>
            <CardContent>
              {studentData?.workouts?.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-[#FF6B00]">{studentData.workouts[0].title}</h3>
                  <p className="text-sm text-gray-400">{studentData.workouts[0].description}</p>
                  <div className="pt-4">
                    <button className="w-full bg-[#FF6B00] hover:bg-[#e65a00] text-white font-bold py-3 rounded-xl">
                      Ver Exercícios
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Nenhum treino atribuído ainda.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">{user?.user_metadata?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-[#333] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Objetivo:</span>
                  <span>{studentData?.objectives?.[0] || 'Não definido'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Peso Desejado:</span>
                  <span>{studentData?.desired_weight ? `${studentData.desired_weight}kg` : '--'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
