'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Dumbbell,
  Filter,
  X,
  ChevronRight,
  User,
  ClipboardList,
  PlusCircle,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

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
  studentId: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}

interface Student {
  id: string;
  name: string;
}

const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Ana Souza' },
  { id: '2', name: 'Lucas Pereira' },
  { id: '3', name: 'Carla Mendes' },
  { id: '4', name: 'João Lima' },
  { id: '5', name: 'Mariana Silva' },
];

const INITIAL_WORKOUTS: Workout[] = [
  {
    id: '1',
    title: 'Treino A - Inferiores',
    description: 'Foco em quadríceps e glúteos',
    studentId: '1',
    exercises: [
      { id: 'e1', name: 'Agachamento Livre', sets: '4', reps: '12', rest: '60s', notes: 'Foco na amplitude' },
      { id: 'e2', name: 'Leg Press 45', sets: '3', reps: '15', rest: '45s' },
    ],
    createdAt: '10/03/2024',
    updatedAt: '10/03/2024'
  },
  {
    id: '2',
    title: 'Treino B - Superiores',
    description: 'Foco em costas e bíceps',
    studentId: '2',
    exercises: [
      { id: 'e3', name: 'Puxada Aberta', sets: '4', reps: '10', rest: '60s' },
      { id: 'e4', name: 'Remada Baixa', sets: '3', reps: '12', rest: '45s' },
    ],
    createdAt: '12/03/2024',
    updatedAt: '12/03/2024'
  }
];

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = React.useState<Workout[]>(INITIAL_WORKOUTS);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editingWorkout, setEditingWorkout] = React.useState<Workout | null>(null);
  const [viewingWorkout, setViewingWorkout] = React.useState<Workout | null>(null);

  // Form State
  const [formExercises, setFormExercises] = React.useState<Exercise[]>([]);

  const filteredWorkouts = workouts.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    MOCK_STUDENTS.find(s => s.id === w.studentId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (workout?: Workout) => {
    if (workout) {
      setEditingWorkout(workout);
      setFormExercises(workout.exercises);
    } else {
      setEditingWorkout(null);
      setFormExercises([{ id: Math.random().toString(36).substr(2, 9), name: '', sets: '', reps: '', rest: '', notes: '' }]);
    }
    setIsModalOpen(true);
  };

  const handleAddExercise = () => {
    setFormExercises([...formExercises, { id: Math.random().toString(36).substr(2, 9), name: '', sets: '', reps: '', rest: '', notes: '' }]);
  };

  const handleRemoveExercise = (id: string) => {
    setFormExercises(formExercises.filter(e => e.id !== id));
  };

  const handleExerciseChange = (id: string, field: keyof Exercise, value: string) => {
    setFormExercises(formExercises.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newWorkout: Workout = {
      id: editingWorkout ? editingWorkout.id : Math.random().toString(36).substr(2, 9),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      studentId: formData.get('studentId') as string,
      exercises: formExercises.filter(ex => ex.name.trim() !== ''),
      createdAt: editingWorkout ? editingWorkout.createdAt : new Date().toLocaleDateString('pt-BR'),
      updatedAt: new Date().toLocaleDateString('pt-BR'),
    };

    if (editingWorkout) {
      setWorkouts(workouts.map(w => w.id === editingWorkout.id ? newWorkout : w));
    } else {
      setWorkouts([newWorkout, ...workouts]);
    }
    
    setIsModalOpen(false);
    setEditingWorkout(null);
    setFormExercises([]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este treino?')) {
      setWorkouts(workouts.filter(w => w.id !== id));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestão de Treinos</h1>
              <p className="text-gray-500 text-sm">Crie e atribua treinos personalizados para suas alunas.</p>
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus size={20} />
              Novo Treino
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 bg-[#1a1d26] px-4 py-3 rounded-xl border border-white/5">
              <Search size={18} className="text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar por título ou aluna..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600"
              />
            </div>
            <button className="flex items-center gap-2 bg-[#1a1d26] px-4 py-3 rounded-xl border border-white/5 text-gray-400 hover:text-white transition-colors">
              <Filter size={18} />
              Filtros
            </button>
          </div>

          {/* Workouts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <motion.div 
                key={workout.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1d26] rounded-2xl border border-white/5 p-6 space-y-4 hover:border-orange-500/30 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                    <Dumbbell size={24} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(workout)}
                      className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(workout.id)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold">{workout.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{workout.description || 'Sem descrição'}</p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                      <User size={14} />
                    </div>
                    <span className="text-xs font-medium text-gray-400">
                      {MOCK_STUDENTS.find(s => s.id === workout.studentId)?.name || 'Não atribuído'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setViewingWorkout(workout)}
                    className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    Ver Detalhes
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-[#1a1d26] rounded-3xl border border-white/10 shadow-2xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1a1d26] z-10">
                <h2 className="text-xl font-bold">{editingWorkout ? 'Editar Treino' : 'Novo Treino'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Título do Treino</label>
                      <input 
                        name="title"
                        required
                        defaultValue={editingWorkout?.title}
                        placeholder="Ex: Treino A - Inferiores"
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Descrição (Opcional)</label>
                      <textarea 
                        name="description"
                        defaultValue={editingWorkout?.description}
                        placeholder="Foco em quadríceps e glúteos..."
                        rows={3}
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Atribuir à Aluna</label>
                      <select 
                        name="studentId"
                        required
                        defaultValue={editingWorkout?.studentId || ''}
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none"
                      >
                        <option value="" disabled>Selecione uma aluna</option>
                        {MOCK_STUDENTS.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Exercícios</label>
                      <button 
                        type="button"
                        onClick={handleAddExercise}
                        className="text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1"
                      >
                        <PlusCircle size={14} />
                        Adicionar
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {formExercises.map((exercise, index) => (
                        <div key={exercise.id} className="p-4 bg-[#0f1117] rounded-xl border border-white/5 space-y-3 relative group/ex">
                          <button 
                            type="button"
                            onClick={() => handleRemoveExercise(exercise.id)}
                            className="absolute top-2 right-2 p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover/ex:opacity-100 transition-opacity"
                          >
                            <Trash size={14} />
                          </button>
                          
                          <div className="space-y-2">
                            <input 
                              placeholder="Nome do Exercício"
                              value={exercise.name}
                              onChange={(e) => handleExerciseChange(exercise.id, 'name', e.target.value)}
                              className="w-full bg-transparent border-b border-white/10 py-1 text-sm font-bold focus:border-orange-500 outline-none transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase">Séries</label>
                              <input 
                                placeholder="4"
                                value={exercise.sets}
                                onChange={(e) => handleExerciseChange(exercise.id, 'sets', e.target.value)}
                                className="w-full bg-white/5 rounded-lg px-2 py-1 text-xs outline-none focus:bg-white/10"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase">Reps</label>
                              <input 
                                placeholder="12"
                                value={exercise.reps}
                                onChange={(e) => handleExerciseChange(exercise.id, 'reps', e.target.value)}
                                className="w-full bg-white/5 rounded-lg px-2 py-1 text-xs outline-none focus:bg-white/10"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-gray-500 uppercase">Descanso</label>
                              <input 
                                placeholder="60s"
                                value={exercise.rest}
                                onChange={(e) => handleExerciseChange(exercise.id, 'rest', e.target.value)}
                                className="w-full bg-white/5 rounded-lg px-2 py-1 text-xs outline-none focus:bg-white/10"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/5 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
                  >
                    {editingWorkout ? 'Salvar Alterações' : 'Criar Treino'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {viewingWorkout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingWorkout(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#1a1d26] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-orange-500">
                <div>
                  <h2 className="text-xl font-bold text-white">{viewingWorkout.title}</h2>
                  <p className="text-white/80 text-sm">
                    Aluna: {MOCK_STUDENTS.find(s => s.id === viewingWorkout.studentId)?.name}
                  </p>
                </div>
                <button onClick={() => setViewingWorkout(null)} className="text-white/80 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {viewingWorkout.description && (
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-gray-400 text-sm italic">&quot;{viewingWorkout.description}&quot;</p>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <ClipboardList size={14} />
                    Lista de Exercícios
                  </h3>
                  
                  <div className="space-y-3">
                    {viewingWorkout.exercises.map((ex, idx) => (
                      <div key={ex.id} className="flex items-center gap-4 p-4 bg-[#0f1117] rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm">{ex.name}</h4>
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
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-[#0f1117]/50 flex justify-between items-center">
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                  Última atualização: {viewingWorkout.updatedAt}
                </span>
                <button 
                  onClick={() => setViewingWorkout(null)}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
