'use client';

import React, { useMemo } from 'react';
import {
  Activity,
  Apple,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileDown,
  HeartPulse,
  Loader2,
  Pencil,
  Plus,
  Ruler,
  Save,
  Search,
  Target,
  User,
  Weight,
} from 'lucide-react';
import { LoadingSpinner, Modal, Toast } from '@/components/ui';
import FormField, { inputClassName, selectClassName, textareaClassName } from '@/components/ui/FormField';
import {
  ModuleEmptyState,
  ModuleHero,
  ModuleHeroAction,
  ModuleSectionHeading,
  ModuleShell,
  ModuleStatCard,
  ModuleSurface,
} from '@/components/dashboard/ModulePrimitives';
import { useAnamneses, type AnamneseFormStep } from '@/hooks/useAnamneses';
import { formatDatePtBr, isSameMonthDate } from '@/lib/date';
import type { Anamnese, AnamneseFormData } from '@/types/anamnese';

type SelectOption = {
  value: string;
  label: string;
};

type DetailItem = {
  label: string;
  value?: string | number | null;
};

const FORM_STEPS: Array<{
  key: AnamneseFormStep;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { key: 'dados', label: 'Dados iniciais', description: 'Aluno, data, peso, altura e objetivo.', icon: User },
  { key: 'saude', label: 'Saude', description: 'Historico clinico e acompanhamentos.', icon: HeartPulse },
  { key: 'alimentacao', label: 'Alimentacao', description: 'Padrao alimentar e rotina de consumo.', icon: Apple },
  { key: 'rotina', label: 'Rotina', description: 'Treino, sono, estresse e comportamento.', icon: Activity },
  { key: 'metas', label: 'Metas', description: 'Medidas, prioridades e observacoes.', icon: Target },
];

const YES_NO_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Nao' },
];

const YES_NO_NA_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Nao' },
  { value: 'nao_se_aplica', label: 'Nao se aplica' },
];

const FREQUENCY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'nao_consume', label: 'Nao consome' },
  { value: 'raramente', label: 'Raramente' },
  { value: '1_a_2_vezes_semana', label: '1 a 2 vezes por semana' },
  { value: '3_a_4_vezes_semana', label: '3 a 4 vezes por semana' },
  { value: 'quase_todos_os_dias', label: 'Quase todos os dias' },
  { value: 'todos_os_dias', label: 'Todos os dias' },
];

const MEAL_FREQUENCY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: '1_a_2_refeicoes', label: '1 a 2 refeicoes por dia' },
  { value: '3_refeicoes', label: '3 refeicoes por dia' },
  { value: '4_a_5_refeicoes', label: '4 a 5 refeicoes por dia' },
  { value: '6_ou_mais', label: '6 ou mais refeicoes por dia' },
  { value: 'irregular', label: 'Sem rotina definida' },
];

const WATER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'menos_que_1l', label: 'Menos de 1 litro por dia' },
  { value: '1_a_2l', label: 'Entre 1 e 2 litros por dia' },
  { value: '2_a_3l', label: 'Entre 2 e 3 litros por dia' },
  { value: 'mais_que_3l', label: 'Mais de 3 litros por dia' },
];

const PHYSICAL_ACTIVITY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'sedentaria', label: 'Sedentaria' },
  { value: '1_a_2_vezes_semana', label: '1 a 2 vezes por semana' },
  { value: '3_a_4_vezes_semana', label: '3 a 4 vezes por semana' },
  { value: '5_ou_mais_vezes_semana', label: '5 ou mais vezes por semana' },
  { value: 'atividade_diaria', label: 'Atividade diaria' },
];

const STRESS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'baixo', label: 'Baixo' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'alto', label: 'Alto' },
  { value: 'muito_alto', label: 'Muito alto' },
];

const SLEEP_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'menos_que_5h', label: 'Menos de 5 horas' },
  { value: '5_a_6h', label: '5 a 6 horas' },
  { value: '7_a_8h', label: '7 a 8 horas' },
  { value: 'mais_que_8h', label: 'Mais de 8 horas' },
  { value: 'sono_irregular', label: 'Sono irregular' },
];

const SEDENTARY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'menos_que_4h', label: 'Menos de 4 horas por dia' },
  { value: '4_a_6h', label: '4 a 6 horas por dia' },
  { value: '6_a_8h', label: '6 a 8 horas por dia' },
  { value: 'mais_que_8h', label: 'Mais de 8 horas por dia' },
];

const CHANGE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'muito_alta', label: 'Muito alta' },
];

const FOLLOW_UP_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'nunca_fez', label: 'Nunca fez acompanhamento' },
  { value: 'ja_fez_e_parou', label: 'Ja fez e parou' },
  { value: 'faz_atualmente', label: 'Faz atualmente' },
];

const SUPPLEMENT_OPTIONS: SelectOption[] = [
  { value: '', label: 'Selecionar' },
  { value: 'nao', label: 'Nao usa' },
  { value: 'sim', label: 'Usa atualmente' },
  { value: 'ja_usou', label: 'Ja usou e parou' },
];

const SUGGESTIONS = {
  objetivo_nutricional: [
    'Emagrecimento',
    'Reducao de gordura corporal',
    'Ganho de massa muscular',
    'Melhora de rendimento',
    'Reeducacao alimentar',
    'Manutencao do peso',
  ],
  doencas_cronicas: ['Nenhuma', 'Hipertensao', 'Diabetes', 'Hipotireoidismo', 'SOP'],
  problemas_saude: ['Nenhum no momento', 'Dor lombar', 'Ansiedade', 'Gastrite', 'Enxaqueca'],
  cirurgias: ['Nenhuma', 'Cesarea', 'Abdominoplastia', 'Bariatrica', 'Histerectomia'],
  condicoes_hormonais: ['Nenhuma', 'SOP', 'Hipotireoidismo', 'Menopausa', 'Endometriose'],
  alergias: ['Nenhuma', 'Lactose', 'Gluten', 'Frutos do mar', 'Oleaginosas'],
  medicamentos: ['Nenhum uso continuo', 'Anticoncepcional', 'Levotiroxina', 'Ansiolitico'],
  historico_familiar: ['Nenhum relevante', 'Diabetes', 'Hipertensao', 'Obesidade', 'Doenca cardiaca'],
  restricoes_alimentares: ['Nenhuma', 'Intolerancia a lactose', 'Vegetariana', 'Sem gluten'],
  atividade_fisica: ['Musculacao', 'Caminhada', 'Corrida', 'Pilates', 'Funcional'],
  objetivos_treino: ['Melhorar condicionamento', 'Aumentar forca', 'Definir corpo', 'Ganhar massa muscular'],
  estrategias_controle_peso: ['Nunca fez dieta', 'Ja fez dieta restritiva', 'Faz acompanhamento esporadico'],
  meta_peso_medidas: ['Reduzir cintura', 'Perder gordura', 'Ganhar massa magra', 'Melhorar composicao corporal'],
  preferencia_dietas: ['Sem preferencia', 'Plano simples', 'Cardapio variado', 'Refeicoes rapidas'],
};

function formatNumber(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const normalized = Number(value.replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : null;
}

function formatGender(value?: string | null) {
  if (!value) {
    return '-';
  }

  const normalized = value.toLowerCase();
  if (normalized === 'female' || normalized === 'feminino' || normalized === 'f') {
    return 'Feminino';
  }
  if (normalized === 'male' || normalized === 'masculino' || normalized === 'm') {
    return 'Masculino';
  }

  return value;
}

function calculateAge(date?: string | null) {
  if (!date) {
    return null;
  }

  const birth = new Date(date);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const beforeBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate());

  if (beforeBirthday) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function resolveText(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function buildSectionRows(items: DetailItem[]) {
  return items
    .filter((item) => item.value !== null && item.value !== undefined && item.value !== '')
    .map((item) => [item.label, String(item.value)]);
}

async function exportAnamnesePdf(anamnese: Anamnese) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const studentName = anamnese.students?.nome || 'Aluno';

  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(20);
  doc.text('ANAMNESE NUTRICIONAL', 14, 20);
  doc.setFontSize(10);
  doc.text(`Aluno: ${studentName}`, 14, 28);

  const sections = [
    {
      title: 'Dados iniciais',
      rows: buildSectionRows([
        { label: 'Data', value: formatDatePtBr(anamnese.data) },
        { label: 'Objetivo nutricional', value: anamnese.objetivo_nutricional },
        { label: 'Peso', value: anamnese.peso ? `${formatNumber(anamnese.peso)} kg` : null },
        { label: 'Altura', value: anamnese.altura ? `${formatNumber(anamnese.altura, 2)} m` : null },
      ]),
    },
    {
      title: 'Saude',
      rows: buildSectionRows([
        { label: 'Doencas cronicas', value: anamnese.doencas_cronicas },
        { label: 'Problemas de saude', value: anamnese.problemas_saude },
        { label: 'Cirurgias', value: anamnese.cirurgias },
        { label: 'Condicoes hormonais', value: anamnese.condicoes_hormonais },
        { label: 'Alergias', value: anamnese.alergias },
        { label: 'Medicamentos', value: anamnese.medicamentos },
        { label: 'Historico familiar', value: anamnese.historico_familiar },
        { label: 'Acompanhamento psicologico', value: anamnese.acompanhamento_psicologico },
        { label: 'Disturbios alimentares', value: anamnese.disturbios_alimentares },
        { label: 'Gravida ou amamentando', value: anamnese.gravida_amamentando },
      ]),
    },
    {
      title: 'Alimentacao',
      rows: buildSectionRows([
        { label: 'Restricoes alimentares', value: anamnese.restricoes_alimentares },
        { label: 'Habitos alimentares', value: anamnese.habitos_alimentares },
        { label: 'Consumo de agua', value: anamnese.consumo_agua },
        { label: 'Frequencia de refeicoes', value: anamnese.frequencia_refeicoes },
        { label: 'Horarios das refeicoes', value: anamnese.horarios_refeicoes },
        { label: 'Fast food', value: anamnese.consumo_fastfood },
        { label: 'Doces', value: anamnese.consumo_doces },
        { label: 'Bebidas acucaradas', value: anamnese.consumo_bebidas_acucaradas },
        { label: 'Alcool', value: anamnese.consumo_alcool },
        { label: 'Gosta de cozinhar', value: anamnese.gosta_cozinhar },
        { label: 'Consumo de cafe', value: anamnese.consumo_cafe },
        { label: 'Suplementos', value: anamnese.uso_suplementos },
        { label: 'Lanches fora', value: anamnese.lanches_fora },
        { label: 'Preferencia alimentar geral', value: anamnese.preferencia_alimentos },
        { label: 'Alimentos preferidos', value: anamnese.alimentos_preferidos },
        { label: 'Alimentos evitados', value: anamnese.alimentos_evitados },
      ]),
    },
    {
      title: 'Rotina e comportamento',
      rows: buildSectionRows([
        { label: 'Atividade fisica', value: anamnese.atividade_fisica },
        { label: 'Frequencia atividade fisica', value: anamnese.frequencia_atividade_fisica },
        { label: 'Objetivos de treino', value: anamnese.objetivos_treino },
        { label: 'Rotina de sono', value: anamnese.rotina_sono },
        { label: 'Nivel de estresse', value: anamnese.nivel_estresse },
        { label: 'Tempo sentado', value: anamnese.tempo_sentado },
        { label: 'Come emocional', value: anamnese.come_emocional },
        { label: 'Beliscar', value: anamnese.beliscar },
        { label: 'Compulsao alimentar', value: anamnese.compulsao_alimentar },
        { label: 'Fome fora de horario', value: anamnese.fome_fora_horario },
      ]),
    },
    {
      title: 'Metas e observacoes',
      rows: buildSectionRows([
        { label: 'Circunferencia abdominal', value: anamnese.circunferencia_abdominal },
        { label: 'Circunferencia de quadril', value: anamnese.circunferencia_quadril },
        { label: 'Outras medidas', value: anamnese.medidas_corpo },
        { label: 'Controle de peso anterior', value: anamnese.estrategias_controle_peso },
        { label: 'Meta de peso e medidas', value: anamnese.meta_peso_medidas },
        { label: 'Disposicao para mudancas', value: anamnese.disposicao_mudancas },
        { label: 'Preferencia de dietas', value: anamnese.preferencia_dietas },
        { label: 'Expectativas', value: anamnese.expectativas },
        { label: 'Observacoes', value: anamnese.observacoes },
      ]),
    },
  ].filter((section) => section.rows.length > 0);

  let cursorY = 46;

  sections.forEach((section) => {
    if (cursorY > 250) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(section.title, 14, cursorY);
    cursorY += 4;

    (autoTable as any)(doc, {
      startY: cursorY,
      head: [['Campo', 'Registro']],
      body: section.rows,
      theme: 'grid',
      headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak' },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 52, fontStyle: 'bold' },
      },
    });

    cursorY = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save(`Anamnese_${studentName.replace(/\s+/g, '_')}_${anamnese.data}.pdf`);
}

function StepChip({
  label,
  description,
  active,
  completed,
  icon: Icon,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  completed: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-[180px] flex-1 items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
        active
          ? 'border-orange-500/40 bg-orange-500/10'
          : 'border-zinc-800 bg-black/30 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      <div
        className={`mt-0.5 rounded-2xl border p-2 ${
          active || completed
            ? 'border-orange-500/30 bg-orange-500/10 text-orange-400'
            : 'border-zinc-800 bg-zinc-950 text-zinc-500'
        }`}
      >
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
      </div>
    </button>
  );
}

function SuggestionInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  fullWidth = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  fullWidth?: boolean;
}) {
  const datalistId = useMemo(
    () => `datalist-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    [label],
  );

  return (
    <FormField label={label} fullWidth={fullWidth}>
      <>
        <input
          list={datalistId}
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          className={inputClassName}
          placeholder={placeholder}
        />
        <datalist id={datalistId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      </>
    </FormField>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  fullWidth = false,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  fullWidth?: boolean;
}) {
  return (
    <FormField label={label} fullWidth={fullWidth}>
      <select value={value || ''} onChange={(event) => onChange(event.target.value)} className={selectClassName}>
        {options.map((option) => (
          <option key={`${label}-${option.value || 'empty'}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

function DetailSection({ title, items }: { title: string; items: DetailItem[] }) {
  const populatedItems = items.filter((item) => item.value !== null && item.value !== undefined && item.value !== '');

  if (!populatedItems.length) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-[26px] border border-zinc-800 bg-black/20 p-5">
      <div>
        <h4 className="text-base font-bold text-white">{title}</h4>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {populatedItems.map((item) => (
          <div key={`${title}-${item.label}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">{item.label}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{resolveText(item.value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AnamneseModule() {
  const {
    anamneses,
    alunos,
    loading,
    searchTerm,
    setSearchTerm,
    showAddModal,
    openNewAnamneseModal,
    closeAddModal,
    showViewModal,
    setShowViewModal,
    selectedAnamnese,
    viewAnamnese,
    editingAnamnese,
    startEditAnamnese,
    newAnamnese,
    setNewAnamnese,
    studentContext,
    studentContextLoading,
    activeFormStep,
    setActiveFormStep,
    handleSave,
    notification,
    clearNotification,
  } = useAnamneses();

  const totalAnamneses = anamneses.length;
  const anamnesesNoMes = anamneses.filter((item) => isSameMonthDate(item.data)).length;
  const alunosComAnamnese = new Set(anamneses.map((item) => item.student_id).filter(Boolean)).size;
  const comObjetivoDefinido = anamneses.filter((item) => Boolean(item.objetivo_nutricional)).length;

  const currentStepIndex = FORM_STEPS.findIndex((step) => step.key === activeFormStep);
  const selectedStudent = useMemo(
    () => alunos.find((aluno) => aluno.id === newAnamnese.student_id),
    [alunos, newAnamnese.student_id],
  );

  const handleFieldChange = <K extends keyof AnamneseFormData>(field: K, value: AnamneseFormData[K]) => {
    setNewAnamnese((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const goToPreviousStep = () => {
    if (currentStepIndex <= 0) {
      return;
    }

    setActiveFormStep(FORM_STEPS[currentStepIndex - 1].key);
  };

  const goToNextStep = () => {
    if (currentStepIndex >= FORM_STEPS.length - 1) {
      return;
    }

    setActiveFormStep(FORM_STEPS[currentStepIndex + 1].key);
  };

  const renderFormStep = () => {
    switch (activeFormStep) {
      case 'dados':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Aluna" required fullWidth>
              <select
                value={newAnamnese.student_id || ''}
                onChange={(event) => handleFieldChange('student_id', event.target.value)}
                className={selectClassName}
              >
                <option value="">Selecione a aluna</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                    {aluno.plan_name ? ` - ${aluno.plan_name}` : ''}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Data da anamnese" required>
              <input
                type="date"
                value={newAnamnese.data || ''}
                onChange={(event) => handleFieldChange('data', event.target.value)}
                className={`${inputClassName} [color-scheme:dark]`}
              />
            </FormField>

            <FormField label="Peso atual (kg)">
              <input
                type="number"
                step="0.1"
                value={newAnamnese.peso ?? ''}
                onChange={(event) => handleFieldChange('peso', parseOptionalNumber(event.target.value) as AnamneseFormData['peso'])}
                className={inputClassName}
                placeholder="Ex.: 68.4"
              />
            </FormField>

            <FormField label="Altura (m)">
              <input
                type="number"
                step="0.01"
                value={newAnamnese.altura ?? ''}
                onChange={(event) => handleFieldChange('altura', parseOptionalNumber(event.target.value) as AnamneseFormData['altura'])}
                className={inputClassName}
                placeholder="Ex.: 1.65"
              />
            </FormField>

            <SuggestionInput
              label="Objetivo nutricional"
              value={newAnamnese.objetivo_nutricional || ''}
              onChange={(value) => handleFieldChange('objetivo_nutricional', value)}
              suggestions={SUGGESTIONS.objetivo_nutricional}
              placeholder="Ex.: Emagrecimento"
              fullWidth
            />

            <FormField label="Observacoes iniciais" fullWidth>
              <textarea
                value={newAnamnese.observacoes || ''}
                onChange={(event) => handleFieldChange('observacoes', event.target.value)}
                className={`${textareaClassName} min-h-[120px]`}
                placeholder="Registre contexto importante da consulta, queixa principal ou algo que ja precise ficar destacado."
              />
            </FormField>
          </div>
        );
      case 'saude':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <SuggestionInput
              label="Doencas cronicas"
              value={newAnamnese.doencas_cronicas || ''}
              onChange={(value) => handleFieldChange('doencas_cronicas', value)}
              suggestions={SUGGESTIONS.doencas_cronicas}
              placeholder="Ex.: Nenhuma"
            />
            <SuggestionInput
              label="Problemas de saude atuais"
              value={newAnamnese.problemas_saude || ''}
              onChange={(value) => handleFieldChange('problemas_saude', value)}
              suggestions={SUGGESTIONS.problemas_saude}
              placeholder="Ex.: Nenhum no momento"
            />
            <SuggestionInput
              label="Cirurgias"
              value={newAnamnese.cirurgias || ''}
              onChange={(value) => handleFieldChange('cirurgias', value)}
              suggestions={SUGGESTIONS.cirurgias}
              placeholder="Ex.: Nenhuma"
            />
            <SuggestionInput
              label="Condicoes hormonais"
              value={newAnamnese.condicoes_hormonais || ''}
              onChange={(value) => handleFieldChange('condicoes_hormonais', value)}
              suggestions={SUGGESTIONS.condicoes_hormonais}
              placeholder="Ex.: Nenhuma"
            />
            <SuggestionInput
              label="Alergias"
              value={newAnamnese.alergias || ''}
              onChange={(value) => handleFieldChange('alergias', value)}
              suggestions={SUGGESTIONS.alergias}
              placeholder="Ex.: Nenhuma"
            />
            <SuggestionInput
              label="Medicamentos"
              value={newAnamnese.medicamentos || ''}
              onChange={(value) => handleFieldChange('medicamentos', value)}
              suggestions={SUGGESTIONS.medicamentos}
              placeholder="Ex.: Nenhum uso continuo"
            />
            <SuggestionInput
              label="Historico familiar"
              value={newAnamnese.historico_familiar || ''}
              onChange={(value) => handleFieldChange('historico_familiar', value)}
              suggestions={SUGGESTIONS.historico_familiar}
              placeholder="Ex.: Diabetes"
            />
            <SelectField
              label="Acompanhamento psicologico"
              value={newAnamnese.acompanhamento_psicologico || ''}
              onChange={(value) => handleFieldChange('acompanhamento_psicologico', value)}
              options={YES_NO_OPTIONS}
            />
            <SelectField
              label="Disturbios alimentares"
              value={newAnamnese.disturbios_alimentares || ''}
              onChange={(value) => handleFieldChange('disturbios_alimentares', value)}
              options={YES_NO_OPTIONS}
            />
            <SelectField
              label="Gravida ou amamentando"
              value={newAnamnese.gravida_amamentando || ''}
              onChange={(value) => handleFieldChange('gravida_amamentando', value)}
              options={YES_NO_NA_OPTIONS}
            />
            <SelectField
              label="Acompanhamento nutricional previo"
              value={newAnamnese.acompanhamento_previo || ''}
              onChange={(value) => handleFieldChange('acompanhamento_previo', value)}
              options={FOLLOW_UP_OPTIONS}
            />
          </div>
        );
      case 'alimentacao':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <SuggestionInput
              label="Restricoes alimentares"
              value={newAnamnese.restricoes_alimentares || ''}
              onChange={(value) => handleFieldChange('restricoes_alimentares', value)}
              suggestions={SUGGESTIONS.restricoes_alimentares}
              placeholder="Ex.: Nenhuma"
            />
            <SelectField
              label="Consumo de agua"
              value={newAnamnese.consumo_agua || ''}
              onChange={(value) => handleFieldChange('consumo_agua', value)}
              options={WATER_OPTIONS}
            />
            <SelectField
              label="Frequencia de refeicoes"
              value={newAnamnese.frequencia_refeicoes || ''}
              onChange={(value) => handleFieldChange('frequencia_refeicoes', value)}
              options={MEAL_FREQUENCY_OPTIONS}
            />
            <SelectField
              label="Fast food"
              value={newAnamnese.consumo_fastfood || ''}
              onChange={(value) => handleFieldChange('consumo_fastfood', value)}
              options={FREQUENCY_OPTIONS}
            />
            <SelectField
              label="Doces"
              value={newAnamnese.consumo_doces || ''}
              onChange={(value) => handleFieldChange('consumo_doces', value)}
              options={FREQUENCY_OPTIONS}
            />
            <SelectField
              label="Bebidas acucaradas"
              value={newAnamnese.consumo_bebidas_acucaradas || ''}
              onChange={(value) => handleFieldChange('consumo_bebidas_acucaradas', value)}
              options={FREQUENCY_OPTIONS}
            />
            <SelectField
              label="Alcool"
              value={newAnamnese.consumo_alcool || ''}
              onChange={(value) => handleFieldChange('consumo_alcool', value)}
              options={FREQUENCY_OPTIONS}
            />
            <SelectField
              label="Gosta de cozinhar"
              value={newAnamnese.gosta_cozinhar || ''}
              onChange={(value) => handleFieldChange('gosta_cozinhar', value)}
              options={YES_NO_OPTIONS}
            />
            <SelectField
              label="Uso de suplementos"
              value={newAnamnese.uso_suplementos || ''}
              onChange={(value) => handleFieldChange('uso_suplementos', value)}
              options={SUPPLEMENT_OPTIONS}
            />
            <SelectField
              label="Consumo de cafe"
              value={newAnamnese.consumo_cafe || ''}
              onChange={(value) => handleFieldChange('consumo_cafe', value)}
              options={FREQUENCY_OPTIONS}
            />
            <SelectField
              label="Lanches fora de casa"
              value={newAnamnese.lanches_fora || ''}
              onChange={(value) => handleFieldChange('lanches_fora', value)}
              options={FREQUENCY_OPTIONS}
            />
            <FormField label="Preferencia alimentar geral" fullWidth>
              <textarea
                value={newAnamnese.preferencia_alimentos || ''}
                onChange={(event) => handleFieldChange('preferencia_alimentos', event.target.value)}
                className={`${textareaClassName} min-h-[96px]`}
                placeholder="Ex.: prefere refeicoes simples, salgadas, mais secas ou com preparacoes rapidas."
              />
            </FormField>
            <FormField label="Horarios das refeicoes" fullWidth>
              <textarea
                value={newAnamnese.horarios_refeicoes || ''}
                onChange={(event) => handleFieldChange('horarios_refeicoes', event.target.value)}
                className={`${textareaClassName} min-h-[96px]`}
                placeholder="Ex.: Cafe 7h, almoco 12h30, lanche 16h, jantar 20h."
              />
            </FormField>
            <FormField label="Habitos alimentares" fullWidth>
              <textarea
                value={newAnamnese.habitos_alimentares || ''}
                onChange={(event) => handleFieldChange('habitos_alimentares', event.target.value)}
                className={`${textareaClassName} min-h-[120px]`}
                placeholder="Descreva como a aluna normalmente se alimenta, dificuldades de rotina ou padrao percebido."
              />
            </FormField>
            <FormField label="Alimentos preferidos" fullWidth>
              <textarea
                value={newAnamnese.alimentos_preferidos || ''}
                onChange={(event) => handleFieldChange('alimentos_preferidos', event.target.value)}
                className={`${textareaClassName} min-h-[96px]`}
                placeholder="Ex.: arroz, frango, ovos, frutas."
              />
            </FormField>
            <FormField label="Alimentos evitados" fullWidth>
              <textarea
                value={newAnamnese.alimentos_evitados || ''}
                onChange={(event) => handleFieldChange('alimentos_evitados', event.target.value)}
                className={`${textareaClassName} min-h-[96px]`}
                placeholder="Ex.: peixe, leite, salada crua."
              />
            </FormField>
          </div>
        );
      case 'rotina':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <SuggestionInput
              label="Atividade fisica principal"
              value={newAnamnese.atividade_fisica || ''}
              onChange={(value) => handleFieldChange('atividade_fisica', value)}
              suggestions={SUGGESTIONS.atividade_fisica}
              placeholder="Ex.: Musculacao"
            />
            <SelectField
              label="Frequencia de atividade fisica"
              value={newAnamnese.frequencia_atividade_fisica || ''}
              onChange={(value) => handleFieldChange('frequencia_atividade_fisica', value)}
              options={PHYSICAL_ACTIVITY_OPTIONS}
            />
            <SuggestionInput
              label="Objetivos de treino"
              value={newAnamnese.objetivos_treino || ''}
              onChange={(value) => handleFieldChange('objetivos_treino', value)}
              suggestions={SUGGESTIONS.objetivos_treino}
              placeholder="Ex.: Melhorar condicionamento"
            />
            <SelectField
              label="Rotina de sono"
              value={newAnamnese.rotina_sono || ''}
              onChange={(value) => handleFieldChange('rotina_sono', value)}
              options={SLEEP_OPTIONS}
            />
            <SelectField
              label="Nivel de estresse"
              value={newAnamnese.nivel_estresse || ''}
              onChange={(value) => handleFieldChange('nivel_estresse', value)}
              options={STRESS_OPTIONS}
            />
            <SelectField
              label="Tempo sentada por dia"
              value={newAnamnese.tempo_sentado || ''}
              onChange={(value) => handleFieldChange('tempo_sentado', value)}
              options={SEDENTARY_OPTIONS}
            />
            <SelectField
              label="Come emocional"
              value={newAnamnese.come_emocional || ''}
              onChange={(value) => handleFieldChange('come_emocional', value)}
              options={YES_NO_OPTIONS}
            />
            <SelectField
              label="Costuma beliscar"
              value={newAnamnese.beliscar || ''}
              onChange={(value) => handleFieldChange('beliscar', value)}
              options={YES_NO_OPTIONS}
            />
            <SelectField
              label="Compulsao alimentar"
              value={newAnamnese.compulsao_alimentar || ''}
              onChange={(value) => handleFieldChange('compulsao_alimentar', value)}
              options={YES_NO_OPTIONS}
            />
            <SelectField
              label="Fome fora de horario"
              value={newAnamnese.fome_fora_horario || ''}
              onChange={(value) => handleFieldChange('fome_fora_horario', value)}
              options={YES_NO_OPTIONS}
            />
          </div>
        );
      case 'metas':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Circunferencia abdominal (cm)">
              <input
                value={newAnamnese.circunferencia_abdominal || ''}
                onChange={(event) => handleFieldChange('circunferencia_abdominal', event.target.value)}
                className={inputClassName}
                placeholder="Ex.: 84"
              />
            </FormField>
            <FormField label="Circunferencia de quadril (cm)">
              <input
                value={newAnamnese.circunferencia_quadril || ''}
                onChange={(event) => handleFieldChange('circunferencia_quadril', event.target.value)}
                className={inputClassName}
                placeholder="Ex.: 102"
              />
            </FormField>
            <FormField label="Outras medidas corporais" fullWidth>
              <textarea
                value={newAnamnese.medidas_corpo || ''}
                onChange={(event) => handleFieldChange('medidas_corpo', event.target.value)}
                className={`${textareaClassName} min-h-[96px]`}
                placeholder="Ex.: cintura 84 cm, braco 31 cm, coxa 58 cm."
              />
            </FormField>
            <SuggestionInput
              label="Historico de controle de peso"
              value={newAnamnese.estrategias_controle_peso || ''}
              onChange={(value) => handleFieldChange('estrategias_controle_peso', value)}
              suggestions={SUGGESTIONS.estrategias_controle_peso}
              placeholder="Ex.: Ja fez dieta restritiva"
              fullWidth
            />
            <SuggestionInput
              label="Meta de peso e medidas"
              value={newAnamnese.meta_peso_medidas || ''}
              onChange={(value) => handleFieldChange('meta_peso_medidas', value)}
              suggestions={SUGGESTIONS.meta_peso_medidas}
              placeholder="Ex.: Reduzir cintura"
              fullWidth
            />
            <SelectField
              label="Disposicao para mudancas"
              value={newAnamnese.disposicao_mudancas || ''}
              onChange={(value) => handleFieldChange('disposicao_mudancas', value)}
              options={CHANGE_OPTIONS}
            />
            <SelectField
              label="Dificuldade com dietas"
              value={newAnamnese.dificuldade_dietas || ''}
              onChange={(value) => handleFieldChange('dificuldade_dietas', value)}
              options={CHANGE_OPTIONS}
            />
            <SuggestionInput
              label="Preferencia de dietas"
              value={newAnamnese.preferencia_dietas || ''}
              onChange={(value) => handleFieldChange('preferencia_dietas', value)}
              suggestions={SUGGESTIONS.preferencia_dietas}
              placeholder="Ex.: Plano simples"
              fullWidth
            />
            <FormField label="Expectativas" fullWidth>
              <textarea
                value={newAnamnese.expectativas || ''}
                onChange={(event) => handleFieldChange('expectativas', event.target.value)}
                className={`${textareaClassName} min-h-[96px]`}
                placeholder="O que a aluna espera deste acompanhamento?"
              />
            </FormField>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando anamneses..." />;
  }

  return (
    <ModuleShell>
      <ModuleHero
        badge="Anamnese"
        title="Leitura alimentar e historico de saude"
        description="Cadastro guiado, com respostas prontas, dados auto preenchidos da aluna e edicao completa para manter o historico confiavel."
        accent="orange"
        chips={[
          { label: 'Registros', value: String(totalAnamneses) },
          { label: 'No mes', value: String(anamnesesNoMes) },
          { label: 'Alunas com registro', value: String(alunosComAnamnese) },
          { label: 'Objetivo definido', value: String(comObjetivoDefinido) },
        ]}
        actions={
          <ModuleHeroAction
            label="Nova anamnese"
            subtitle="Abrir cadastro guiado com perguntas organizadas por etapa."
            icon={Plus}
            accent="orange"
            filled
            onClick={openNewAnamneseModal}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ModuleStatCard
          label="Historico ativo"
          value={String(totalAnamneses)}
          detail="Quantidade de anamneses carregadas com o filtro atual."
          icon={ClipboardList}
          accent="orange"
        />
        <ModuleStatCard
          label="Atualizacoes no mes"
          value={String(anamnesesNoMes)}
          detail="Registros adicionados ou atualizados no periodo corrente."
          icon={Calendar}
          accent="orange"
        />
        <ModuleStatCard
          label="Metas registradas"
          value={String(comObjetivoDefinido)}
          detail="Quantas anamneses ja sairam com objetivo nutricional definido."
          icon={Target}
          accent="orange"
        />
      </div>

      <ModuleSurface className="space-y-5">
        <ModuleSectionHeading
          eyebrow="Busca"
          title="Localize pelo nome, objetivo ou data"
          description="A pesquisa considera aluna, objetivo nutricional e data do registro."
        />

        <div className="group relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-hover:text-orange-500" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por aluna, objetivo ou data..."
            className="w-full rounded-2xl border border-zinc-800 bg-black/40 py-3 pl-12 pr-4 text-white transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
      </ModuleSurface>

      <ModuleSurface className="overflow-hidden p-0">
        <div className="border-b border-zinc-800 px-6 py-5">
          <ModuleSectionHeading
            eyebrow="Operacao"
            title="Historico de anamnese"
            description="Abra o registro, exporte em PDF ou ajuste depois da consulta."
          />
        </div>

        {anamneses.length > 0 ? (
          <div className="divide-y divide-zinc-800/60">
            {anamneses.map((anamnese) => (
              <article
                key={anamnese.id}
                className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-zinc-900/40 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-orange-400">
                      <User size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-white">{anamnese.students?.nome || 'Aluno sem nome'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>{formatDatePtBr(anamnese.data)}</span>
                        {anamnese.students?.plan_name ? <span>- {anamnese.students.plan_name}</span> : null}
                        {anamnese.objetivo_nutricional ? <span>- {anamnese.objetivo_nutricional}</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
                      Peso: {anamnese.peso ? `${formatNumber(anamnese.peso)} kg` : '-'}
                    </span>
                    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
                      Altura: {anamnese.altura ? `${formatNumber(anamnese.altura, 2)} m` : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => viewAnamnese(anamnese)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-white transition-all hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <Eye size={16} />
                    Ver detalhes
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditAnamnese(anamnese)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300 transition-all hover:bg-orange-500/20"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void exportAnamnesePdf(anamnese)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
                  >
                    <FileDown size={16} />
                    PDF
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-8">
            <ModuleEmptyState
              icon={ClipboardList}
              title="Nenhuma anamnese encontrada"
              description="Abra um novo cadastro para registrar historico de saude e alimentacao."
            />
          </div>
        )}
      </ModuleSurface>

      <Modal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title={editingAnamnese ? 'Editar anamnese' : 'Nova anamnese'}
        subtitle={editingAnamnese ? 'Atualize o registro sem perder o historico.' : 'Cadastro guiado com respostas sugeridas e contexto da aluna.'}
        maxWidth="max-w-6xl"
        footer={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 px-4 py-3 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Etapa anterior
              </button>
              {currentStepIndex < FORM_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-white"
                >
                  Proxima etapa
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-orange-400"
                >
                  <Save size={16} />
                  {editingAnamnese ? 'Salvar ajustes' : 'Salvar anamnese'}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={closeAddModal}
              className="rounded-2xl border border-zinc-800 px-4 py-3 text-sm font-bold text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              Cancelar
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-3 xl:grid-cols-5">
            {FORM_STEPS.map((step, index) => (
              <StepChip
                key={step.key}
                label={step.label}
                description={step.description}
                icon={step.icon}
                active={step.key === activeFormStep}
                completed={index < currentStepIndex}
                onClick={() => setActiveFormStep(step.key)}
              />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
            <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">Etapa atual</p>
                  <h4 className="mt-2 text-xl font-bold text-white">{FORM_STEPS[currentStepIndex].label}</h4>
                </div>
                <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                  {currentStepIndex + 1} de {FORM_STEPS.length}
                </div>
              </div>

              {renderFormStep()}
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">Contexto da aluna</p>

                {studentContextLoading ? (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 px-4 py-4 text-sm text-zinc-400">
                    <Loader2 size={16} className="animate-spin text-orange-400" />
                    Carregando dados da aluna...
                  </div>
                ) : studentContext ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                      <p className="text-base font-bold text-white">{studentContext.student_name}</p>
                      <div className="mt-2 space-y-1 text-sm text-zinc-400">
                        <p>{studentContext.email || 'Sem e-mail cadastrado'}</p>
                        <p>Plano atual: {studentContext.plan_name || 'Nao informado'}</p>
                        <p>Sexo: {formatGender(studentContext.gender)}</p>
                        <p>
                          Nascimento: {studentContext.birth_date ? formatDatePtBr(studentContext.birth_date) : '-'}
                          {calculateAge(studentContext.birth_date) !== null ? ` - ${calculateAge(studentContext.birth_date)} anos` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Weight size={16} className="text-orange-400" />
                          <span className="text-xs font-bold uppercase tracking-[0.2em]">Ultimo peso</span>
                        </div>
                        <p className="mt-3 text-xl font-bold text-white">
                          {studentContext.latest_peso !== null && studentContext.latest_peso !== undefined
                            ? `${formatNumber(studentContext.latest_peso)} kg`
                            : '-'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Ruler size={16} className="text-orange-400" />
                          <span className="text-xs font-bold uppercase tracking-[0.2em]">Ultima altura</span>
                        </div>
                        <p className="mt-3 text-xl font-bold text-white">
                          {studentContext.latest_altura !== null && studentContext.latest_altura !== undefined
                            ? `${formatNumber(studentContext.latest_altura, 2)} m`
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Ultima avaliacao fisica</p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {studentContext.latest_avaliacao_date
                          ? formatDatePtBr(studentContext.latest_avaliacao_date)
                          : 'Ainda nao existe avaliacao registrada.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-black/30 px-4 py-5 text-sm leading-6 text-zinc-500">
                    Selecione uma aluna para carregar automaticamente dados basicos e os ultimos peso e altura registrados.
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">Resumo do cadastro</p>
                <div className="mt-4 space-y-3 text-sm text-zinc-400">
                  <p>Aluna: <span className="font-bold text-white">{selectedStudent?.nome || studentContext?.student_name || 'Nao selecionada'}</span></p>
                  <p>Data: <span className="font-bold text-white">{newAnamnese.data ? formatDatePtBr(newAnamnese.data) : '-'}</span></p>
                  <p>Objetivo: <span className="font-bold text-white">{newAnamnese.objetivo_nutricional || '-'}</span></p>
                  <p>Peso / altura: <span className="font-bold text-white">
                    {newAnamnese.peso ? `${formatNumber(newAnamnese.peso)} kg` : '-'} / {newAnamnese.altura ? `${formatNumber(newAnamnese.altura, 2)} m` : '-'}
                  </span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showViewModal && Boolean(selectedAnamnese)}
        onClose={() => setShowViewModal(false)}
        title={selectedAnamnese?.students?.nome || 'Detalhes da anamnese'}
        subtitle={selectedAnamnese ? `Registro de ${formatDatePtBr(selectedAnamnese.data)}` : undefined}
        maxWidth="max-w-6xl"
        headerActions={
          selectedAnamnese ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void exportAnamnesePdf(selectedAnamnese)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-bold text-zinc-200 transition-all hover:border-zinc-700 hover:bg-zinc-900"
              >
                <FileDown size={16} />
                PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  startEditAnamnese(selectedAnamnese);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-sm font-bold text-black transition-all hover:bg-orange-400"
              >
                <Pencil size={16} />
                Editar
              </button>
            </div>
          ) : null
        }
      >
        {selectedAnamnese ? (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-[26px] border border-zinc-800 bg-black/20 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">Data</p>
                <p className="mt-3 text-2xl font-bold text-white">{formatDatePtBr(selectedAnamnese.data)}</p>
              </div>
              <div className="rounded-[26px] border border-zinc-800 bg-black/20 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">Peso</p>
                <p className="mt-3 text-2xl font-bold text-white">{selectedAnamnese.peso ? `${formatNumber(selectedAnamnese.peso)} kg` : '-'}</p>
              </div>
              <div className="rounded-[26px] border border-zinc-800 bg-black/20 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">Altura</p>
                <p className="mt-3 text-2xl font-bold text-white">{selectedAnamnese.altura ? `${formatNumber(selectedAnamnese.altura, 2)} m` : '-'}</p>
              </div>
              <div className="rounded-[26px] border border-zinc-800 bg-black/20 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">Objetivo</p>
                <p className="mt-3 text-base font-bold text-white">{selectedAnamnese.objetivo_nutricional || '-'}</p>
              </div>
            </div>

            <DetailSection
              title="Contexto da aluna"
              items={[
                { label: 'Nome', value: selectedAnamnese.students?.nome },
                { label: 'E-mail', value: selectedAnamnese.students?.email },
                { label: 'Plano atual', value: selectedAnamnese.students?.plan_name },
                { label: 'Sexo', value: formatGender(selectedAnamnese.students?.gender) },
                { label: 'Nascimento', value: selectedAnamnese.students?.birth_date ? formatDatePtBr(selectedAnamnese.students.birth_date) : null },
              ]}
            />

            <DetailSection
              title="Saude"
              items={[
                { label: 'Doencas cronicas', value: selectedAnamnese.doencas_cronicas },
                { label: 'Problemas de saude', value: selectedAnamnese.problemas_saude },
                { label: 'Cirurgias', value: selectedAnamnese.cirurgias },
                { label: 'Condicoes hormonais', value: selectedAnamnese.condicoes_hormonais },
                { label: 'Alergias', value: selectedAnamnese.alergias },
                { label: 'Medicamentos', value: selectedAnamnese.medicamentos },
                { label: 'Historico familiar', value: selectedAnamnese.historico_familiar },
                { label: 'Acompanhamento psicologico', value: selectedAnamnese.acompanhamento_psicologico },
                { label: 'Disturbios alimentares', value: selectedAnamnese.disturbios_alimentares },
                { label: 'Gravida ou amamentando', value: selectedAnamnese.gravida_amamentando },
                { label: 'Acompanhamento previo', value: selectedAnamnese.acompanhamento_previo },
              ]}
            />

            <DetailSection
              title="Alimentacao"
              items={[
                { label: 'Restricoes alimentares', value: selectedAnamnese.restricoes_alimentares },
                { label: 'Habitos alimentares', value: selectedAnamnese.habitos_alimentares },
                { label: 'Consumo de agua', value: selectedAnamnese.consumo_agua },
                { label: 'Frequencia de refeicoes', value: selectedAnamnese.frequencia_refeicoes },
                { label: 'Horarios das refeicoes', value: selectedAnamnese.horarios_refeicoes },
                { label: 'Fast food', value: selectedAnamnese.consumo_fastfood },
                { label: 'Doces', value: selectedAnamnese.consumo_doces },
                { label: 'Bebidas acucaradas', value: selectedAnamnese.consumo_bebidas_acucaradas },
                { label: 'Alcool', value: selectedAnamnese.consumo_alcool },
                { label: 'Gosta de cozinhar', value: selectedAnamnese.gosta_cozinhar },
                { label: 'Consumo de cafe', value: selectedAnamnese.consumo_cafe },
                { label: 'Suplementos', value: selectedAnamnese.uso_suplementos },
                { label: 'Lanches fora', value: selectedAnamnese.lanches_fora },
                { label: 'Preferencia alimentar geral', value: selectedAnamnese.preferencia_alimentos },
                { label: 'Alimentos preferidos', value: selectedAnamnese.alimentos_preferidos },
                { label: 'Alimentos evitados', value: selectedAnamnese.alimentos_evitados },
              ]}
            />

            <DetailSection
              title="Rotina e comportamento"
              items={[
                { label: 'Atividade fisica', value: selectedAnamnese.atividade_fisica },
                { label: 'Frequencia de atividade fisica', value: selectedAnamnese.frequencia_atividade_fisica },
                { label: 'Objetivos de treino', value: selectedAnamnese.objetivos_treino },
                { label: 'Rotina de sono', value: selectedAnamnese.rotina_sono },
                { label: 'Nivel de estresse', value: selectedAnamnese.nivel_estresse },
                { label: 'Tempo sentado', value: selectedAnamnese.tempo_sentado },
                { label: 'Come emocional', value: selectedAnamnese.come_emocional },
                { label: 'Beliscar', value: selectedAnamnese.beliscar },
                { label: 'Compulsao alimentar', value: selectedAnamnese.compulsao_alimentar },
                { label: 'Fome fora de horario', value: selectedAnamnese.fome_fora_horario },
              ]}
            />

            <DetailSection
              title="Metas e observacoes"
              items={[
                { label: 'Circunferencia abdominal', value: selectedAnamnese.circunferencia_abdominal },
                { label: 'Circunferencia de quadril', value: selectedAnamnese.circunferencia_quadril },
                { label: 'Outras medidas corporais', value: selectedAnamnese.medidas_corpo },
                { label: 'Historico de controle de peso', value: selectedAnamnese.estrategias_controle_peso },
                { label: 'Meta de peso e medidas', value: selectedAnamnese.meta_peso_medidas },
                { label: 'Disposicao para mudancas', value: selectedAnamnese.disposicao_mudancas },
                { label: 'Dificuldade com dietas', value: selectedAnamnese.dificuldade_dietas },
                { label: 'Preferencia de dietas', value: selectedAnamnese.preferencia_dietas },
                { label: 'Expectativas', value: selectedAnamnese.expectativas },
                { label: 'Observacoes', value: selectedAnamnese.observacoes },
              ]}
            />
          </div>
        ) : null}
      </Modal>

      <Toast notification={notification} onClose={clearNotification} />
    </ModuleShell>
  );
}
