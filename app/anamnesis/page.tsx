'use client';

import React from 'react';
import { AnamnesisList } from '@/components/anamnesis/AnamnesisList';
import { AnamnesisForm } from '@/components/anamnesis/AnamnesisForm';
import { AnamnesisDetails } from '@/components/anamnesis/AnamnesisDetails';
import { type Anamnesis, type AnamnesisData } from '@/lib/anamnesis-schema';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ConfirmModal } from '@/components/ConfirmModal';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';

export default function AnamnesisPage() {
  const [anamnesis, setAnamnesis] = React.useState<Anamnesis[]>([]);
  const [students, setStudents] = React.useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAnamnesis, setEditingAnamnesis] = React.useState<Anamnesis | null>(null);
  const [viewingAnamnesis, setViewingAnamnesis] = React.useState<Anamnesis | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [anamnesisToDelete, setAnamnesisToDelete] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .order('name');
      
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch anamnesis
      const { data: anamnesisData, error: anamnesisError } = await supabase
        .from('anamnesis')
        .select(`
          *,
          students (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (anamnesisError) throw anamnesisError;

      const formattedAnamnesis: Anamnesis[] = (anamnesisData || []).map(item => ({
        id: item.id,
        studentId: item.student_id,
        studentName: item.students?.name || 'Aluna Desconhecida',
        createdAt: item.created_at,
        ...item.data
      }));

      setAnamnesis(formattedAnamnesis);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingAnamnesis(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Anamnesis) => {
    setEditingAnamnesis(item);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setAnamnesisToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!anamnesisToDelete) return;
    
    try {
      const { error } = await supabase
        .from('anamnesis')
        .delete()
        .eq('id', anamnesisToDelete);

      if (error) throw error;

      setAnamnesis(prev => prev.filter(a => a.id !== anamnesisToDelete));
      toast.success('Anamnese excluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir anamnese:', error);
      toast.error('Erro ao excluir anamnese: ' + error.message);
    } finally {
      setIsDeleteModalOpen(false);
      setAnamnesisToDelete(null);
    }
  };

  const handleView = (item: Anamnesis) => {
    setViewingAnamnesis(item);
  };

  const handleSubmit = async (data: AnamnesisData) => {
    try {
      const anamnesisPayload = {
        student_id: data.studentId,
        data: {
          objective: data.objective,
          medicalHistory: data.medicalHistory,
          medications: data.medications,
          surgeries: data.surgeries,
          injuries: data.injuries,
          lifestyle: data.lifestyle,
          physicalActivityLevel: data.physicalActivityLevel,
          sleepQuality: data.sleepQuality,
          stressLevel: data.stressLevel,
          observations: data.observations,
        },
        updated_at: new Date().toISOString(),
      };

      if (editingAnamnesis) {
        const { error } = await supabase
          .from('anamnesis')
          .update(anamnesisPayload)
          .eq('id', editingAnamnesis.id);
        
        if (error) throw error;
        toast.success('Anamnese atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('anamnesis')
          .insert([anamnesisPayload]);
        
        if (error) throw error;
        toast.success('Nova anamnese cadastrada!');
      }
      
      fetchData();
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar anamnese:', error);
      toast.error('Erro ao salvar anamnese: ' + error.message);
    }
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
            students={students}
          />
        )}
        {viewingAnamnesis && (
          <AnamnesisDetails 
            anamnesis={viewingAnamnesis}
            onClose={() => setViewingAnamnesis(null)}
          />
        )}
        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Excluir Anamnese"
          message="Tem certeza que deseja excluir esta anamnese? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
        />
      </AnimatePresence>
    </div>
  );
}
