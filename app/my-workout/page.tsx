'use client';

import React from 'react';
import { 
  Dumbbell, 
  Calendar, 
  Clock, 
  ChevronRight, 
  CheckCircle2,
  Trophy,
  Activity,
  User,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import Image from 'next/image';

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes?: string;
}

interface Workout {
  id: string;
  title: string;
  description?: string;
  exercises: Exercise[];
  updatedAt: string;
}

// Simulating a logged-in student (Ana Souza)
const LOGGED_IN_STUDENT = {
  id: '1',
  name: 'Ana Souza',
  photo: 'https://picsum.photos/seed/ana/100/100'
};

const MY_WORKOUTS: Workout[] = [
  {
    id: '1',
    title: 'Treino A - Inferiores',
    description: 'Foco em quadríceps e glúteos. Mantenha a cadência 2-0-2.',
    exercises: [
      { id: 'e1', name: 'Agachamento Livre', sets: '4', reps: '12', rest: '60s', notes: 'Foco na amplitude' },
      { id: 'e2', name: 'Leg Press 45', sets: '3', reps: '15', rest: '45s' },
      { id: 'e3', name: 'Extensora', sets: '3', reps: '12+Falha', rest: '45s' },
      { id: 'e4', name: 'Afundo com Halteres', sets: '3', reps: '10 cada lado', rest: '60s' },
    ],
    updatedAt: '10/03/2024'
  },
  {
    id: '3',
    title: 'Treino C - Cardio & Core',
    description: 'Treino de alta intensidade para queima calórica.',
    exercises: [
      { id: 'e5', name: 'Prancha Abdominal', sets: '3', reps: '45s', rest: '30s' },
      { id: 'e6', name: 'Mountain Climbers', sets: '3', reps: '30s', rest: '30s' },
    ],
    updatedAt: '15/03/2024'
  }
];

export default function StudentWorkoutPage() {
  const [selectedWorkout, setSelectedWorkout] = React.useState<Workout | null>(MY_WORKOUTS[0]);
  const [completedExercises, setCompletedExercises] = React.useState<Set<string>>(new Set());

  const toggleExercise = (id: string) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedExercises(newCompleted);
  };

  const progress = selectedWorkout 
    ? Math.round((completedExercises.size / selectedWorkout.exercises.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0b10] text-white font-sans pb-20">
      {/* Header */}
      <header className="bg-[#1a1d26] p-6 border-b border-white/5 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 overflow-hidden border-2 border-orange-500/20 relative">
              <Image 
                src={LOGGED_IN_STUDENT.photo} 
                alt={LOGGED_IN_STUDENT.name} 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Bem-vinda de volta,</p>
              <h1 className="text-lg font-bold">{LOGGED_IN_STUDENT.name}</h1>
            </div>
          </div>
          <Link href="/" className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
            <LogOut size={20} />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1a1d26] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-1">
            <Activity className="text-orange-500 mb-1" size={20} />
            <span className="text-xl font-bold">12</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold">Treinos/Mês</span>
          </div>
          <div className="bg-[#1a1d26] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-1">
            <Trophy className="text-yellow-500 mb-1" size={20} />
            <span className="text-xl font-bold">85%</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold">Frequência</span>
          </div>
          <div className="bg-[#1a1d26] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-1">
            <Clock className="text-blue-500 mb-1" size={20} />
            <span className="text-xl font-bold">45m</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold">Tempo Médio</span>
          </div>
          <div className="bg-[#1a1d26] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-1">
            <CheckCircle2 className="text-emerald-500 mb-1" size={20} />
            <span className="text-xl font-bold">4</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold">Semanas</span>
          </div>
        </div>

        {/* Workout Selector */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Meus Treinos Atuais</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {MY_WORKOUTS.map((workout) => (
              <button
                key={workout.id}
                onClick={() => {
                  setSelectedWorkout(workout);
                  setCompletedExercises(new Set());
                }}
                className={cn(
                  "flex-shrink-0 px-6 py-4 rounded-2xl border transition-all text-left min-w-[200px]",
                  selectedWorkout?.id === workout.id 
                    ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/20" 
                    : "bg-[#1a1d26] border-white/5 text-gray-400 hover:border-white/10"
                )}
              >
                <Dumbbell size={20} className={cn("mb-2", selectedWorkout?.id === workout.id ? "text-white" : "text-orange-500")} />
                <h3 className={cn("font-bold text-sm", selectedWorkout?.id === workout.id ? "text-white" : "text-gray-200")}>
                  {workout.title}
                </h3>
                <p className={cn("text-[10px] uppercase font-bold mt-1", selectedWorkout?.id === workout.id ? "text-white/70" : "text-gray-500")}>
                  {workout.exercises.length} Exercícios
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Active Workout Details */}
        {selectedWorkout && (
          <motion.div 
            key={selectedWorkout.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#1a1d26] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-orange-500 to-orange-600">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedWorkout.title}</h2>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Hoje
                  </div>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">&quot;{selectedWorkout.description}&quot;</p>
                
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/70">
                    <span>Progresso do Treino</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {selectedWorkout.exercises.map((ex, idx) => (
                  <div 
                    key={ex.id}
                    onClick={() => toggleExercise(ex.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                      completedExercises.has(ex.id) 
                        ? "bg-emerald-500/5 border-emerald-500/20" 
                        : "bg-[#0f1117] border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                      completedExercises.has(ex.id)
                        ? "bg-emerald-500 text-white"
                        : "bg-white/5 text-gray-500 group-hover:bg-orange-500/10 group-hover:text-orange-500"
                    )}>
                      {completedExercises.has(ex.id) ? <CheckCircle2 size={20} /> : idx + 1}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={cn(
                        "font-bold text-sm transition-all",
                        completedExercises.has(ex.id) ? "text-emerald-500 line-through opacity-50" : "text-gray-200"
                      )}>
                        {ex.name}
                      </h4>
                      <div className="flex gap-4 mt-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                          <strong className="text-gray-300">{ex.sets}</strong> Séries
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                          <strong className="text-gray-300">{ex.reps}</strong> Reps
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                          <strong className="text-gray-300">{ex.rest}</strong> Descanso
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-gray-700" />
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95">
              Finalizar Treino
            </button>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation (Mobile Style) */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#1a1d26]/80 backdrop-blur-xl border-t border-white/5 p-4 flex justify-around items-center z-30">
        <button className="flex flex-col items-center gap-1 text-orange-500">
          <Dumbbell size={24} />
          <span className="text-[10px] font-bold uppercase">Treino</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
          <Calendar size={24} />
          <span className="text-[10px] font-bold uppercase">Agenda</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
          <Activity size={24} />
          <span className="text-[10px] font-bold uppercase">Evolução</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
          <User size={24} />
          <span className="text-[10px] font-bold uppercase">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
