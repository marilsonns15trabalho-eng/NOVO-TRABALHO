'use client';

import React from 'react';
import { X, Save, Calculator } from 'lucide-react';
import { getAssessmentResults } from '@/lib/assessment-utils';
import { PhysicalAssessment } from '@/lib/types';

interface AssessmentFormProps {
  onClose: () => void;
  onSave: (assessment: Partial<PhysicalAssessment>) => void;
  initialData?: Partial<PhysicalAssessment>;
  students: { id: string; name: string }[];
}

export function AssessmentForm({ onClose, onSave, initialData, students }: AssessmentFormProps) {
  const [formData, setFormData] = React.useState({
    studentId: initialData?.studentId || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    weight: initialData?.weight || 0,
    height: initialData?.height || 0,
    skinfolds: {
      triceps: initialData?.skinfolds?.triceps || 0,
      subscapular: initialData?.skinfolds?.subscapular || 0,
      suprailiac: initialData?.skinfolds?.suprailiac || 0,
      abdominal: initialData?.skinfolds?.abdominal || 0,
    },
    perimeters: {
      neck: initialData?.perimeters?.neck || 0,
      shoulder: initialData?.perimeters?.shoulder || 0,
      chest: initialData?.perimeters?.chest || 0,
      waist: initialData?.perimeters?.waist || 0,
      abdomen: initialData?.perimeters?.abdomen || 0,
      hip: initialData?.perimeters?.hip || 0,
      rightArm: initialData?.perimeters?.rightArm || 0,
      leftArm: initialData?.perimeters?.leftArm || 0,
      rightThigh: initialData?.perimeters?.rightThigh || 0,
      leftThigh: initialData?.perimeters?.leftThigh || 0,
      rightCalf: initialData?.perimeters?.rightCalf || 0,
      leftCalf: initialData?.perimeters?.leftCalf || 0,
    },
    notes: initialData?.notes || '',
  });

  const results = React.useMemo(() => {
    if (formData.weight > 0 && formData.height > 0) {
      return getAssessmentResults(formData.weight, formData.height, formData.skinfolds);
    }
    return { bmi: 0, fatPercentage: 0, fatMass: 0, leanMass: 0 };
  }, [formData.weight, formData.height, formData.skinfolds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === formData.studentId);
    onSave({
      ...formData,
      studentName: student?.name || '',
      results,
    });
  };

  const handleSkinfoldChange = (name: keyof typeof formData.skinfolds, value: number) => {
    setFormData(prev => ({
      ...prev,
      skinfolds: { ...prev.skinfolds, [name]: value }
    }));
  };

  const handlePerimeterChange = (name: keyof typeof formData.perimeters, value: number) => {
    setFormData(prev => ({
      ...prev,
      perimeters: { ...prev.perimeters, [name]: value }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1d26] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl">
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1a1d26] z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Nova Avaliação Física</h2>
            <p className="text-gray-500 text-sm">Protocolo Faulkner (4 Dobras)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aluna</label>
              <select
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="">Selecione uma aluna</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Altura (cm)</label>
              <input
                type="number"
                required
                value={formData.height || ''}
                onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Results Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-orange-500/5 rounded-3xl border border-orange-500/10">
            <div className="text-center">
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">IMC</p>
              <p className="text-2xl font-bold text-white">{results.bmi || '--'}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">% Gordura</p>
              <p className="text-2xl font-bold text-white">{results.fatPercentage || '--'}%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Massa Gorda</p>
              <p className="text-2xl font-bold text-white">{results.fatMass || '--'} kg</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Massa Magra</p>
              <p className="text-2xl font-bold text-white">{results.leanMass || '--'} kg</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Skinfolds */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calculator size={20} className="text-orange-500" />
                Dobras Cutâneas (mm)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(formData.skinfolds).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {key === 'triceps' ? 'Tríceps' : 
                       key === 'subscapular' ? 'Subescapular' : 
                       key === 'suprailiac' ? 'Supra-ilíaca' : 'Abdominal'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={value || ''}
                      onChange={(e) => handleSkinfoldChange(key as any, parseFloat(e.target.value))}
                      className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Perimeters */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calculator size={20} className="text-orange-500" />
                Perímetros (cm)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: 'neck', label: 'Pescoço' },
                  { id: 'shoulder', label: 'Ombro' },
                  { id: 'chest', label: 'Tórax' },
                  { id: 'waist', label: 'Cintura' },
                  { id: 'abdomen', label: 'Abdômen' },
                  { id: 'hip', label: 'Quadril' },
                  { id: 'rightArm', label: 'Braço D' },
                  { id: 'leftArm', label: 'Braço E' },
                  { id: 'rightThigh', label: 'Coxa D' },
                  { id: 'leftThigh', label: 'Coxa E' },
                  { id: 'rightCalf', label: 'Pant. D' },
                  { id: 'leftCalf', label: 'Pant. E' },
                ].map((item) => (
                  <div key={item.id} className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(formData.perimeters as any)[item.id] || ''}
                      onChange={(e) => handlePerimeterChange(item.id as any, parseFloat(e.target.value))}
                      className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="Notas adicionais sobre a avaliação..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <Save size={20} />
              Salvar Avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
