'use client';

import React from 'react';
import { AnamnesisList } from '@/components/anamnesis/AnamnesisList';
import { AnamnesisForm } from '@/components/anamnesis/AnamnesisForm';
import { AnamnesisDetails } from '@/components/anamnesis/AnamnesisDetails';
import { type Anamnesis, type AnamnesisData } from '@/lib/anamnesis-schema';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { AnimatePresence } from 'motion/react';

// Mock data for initial state
const MOCK_STUDENTS = [
  { id: '1', name: 'Ana Souza' },
  { id: '2', name: 'Carla Mendes' },
  { id: '3', name: 'Fernanda Oliveira' },
  { id: '4', name: 'Mariana Silva' },
];

const MOCK_ANAMNESIS: Anamnesis[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Ana Souza',
    objective: 'Emagrecimento e melhora do condicionamento cardiovascular',
    medicalHistory: 'Hipotireoidismo controlado com medicação.',
    medications: 'Puran T4',
    surgeries: 'Nenhuma recente.',
    injuries: 'Dor lombar ocasional após longos períodos sentada.',
    lifestyle: 'Trabalha em escritório, 8h por dia sentada.',
    physicalActivityLevel: 'sedentary',
    sleepQuality: 'fair',
    stressLevel: 'high',
    observations: 'Aluna relata cansaço frequente no final do dia.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'Carla Mendes',
    objective: 'Hipertrofia e fortalecimento de membros inferiores',
    medicalHistory: 'Sem histórico de doenças crônicas.',
    medications: 'Nenhum.',
    surgeries: 'Apendicectomia em 2018.',
    injuries: 'Cirurgia de menisco no joelho esquerdo (2020). Recuperada.',
    lifestyle: 'Ativa, gosta de caminhadas aos finais de semana.',
    physicalActivityLevel: 'moderate',
    sleepQuality: 'good',
    stressLevel: 'low',
    observations: 'Foco em exercícios que não sobrecarreguem o joelho esquerdo inicialmente.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

export default function AnamnesisPage() {
  const [anamnesis, setAnamnesis] = React.useState<Anamnesis[]>(MOCK_ANAMNESIS);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAnamnesis, setEditingAnamnesis] = React.useState<Anamnesis | null>(null);
  const [viewingAnamnesis, setViewingAnamnesis] = React.useState<Anamnesis | null>(null);

  const handleAdd = () => {
    setEditingAnamnesis(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Anamnesis) => {
    setEditingAnamnesis(item);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta anamnese?')) {
      setAnamnesis(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleView = (item: Anamnesis) => {
    setViewingAnamnesis(item);
  };

  const handleSubmit = (data: AnamnesisData) => {
    const student = MOCK_STUDENTS.find(s => s.id === data.studentId);
    
    if (editingAnamnesis) {
      setAnamnesis(prev => prev.map(a => a.id === editingAnamnesis.id ? {
        ...a,
        ...data,
        studentName: student?.name || 'Aluna Desconhecida',
      } : a));
    } else {
      const newAnamnesis: Anamnesis = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        studentName: student?.name || 'Aluna Desconhecida',
        createdAt: new Date().toISOString(),
      };
      setAnamnesis(prev => [newAnamnesis, ...prev]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0a0b0f] overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Módulo Anamnese</h1>
                <p className="text-gray-500 mt-1">Gerencie o histórico de saúde e objetivos das suas alunas.</p>
              </div>
            </div>

            <AnamnesisList 
              anamnesis={anamnesis}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <AnamnesisForm 
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleSubmit}
            initialData={editingAnamnesis || undefined}
            students={MOCK_STUDENTS}
          />
        )}
        {viewingAnamnesis && (
          <AnamnesisDetails 
            anamnesis={viewingAnamnesis}
            onClose={() => setViewingAnamnesis(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
