import { z } from 'zod';

export const anamnesisSchema = z.object({
  studentId: z.string().min(1, 'Selecione uma aluna'),
  objective: z.string().min(3, 'O objetivo é obrigatório'),
  medicalHistory: z.string().optional(),
  medications: z.string().optional(),
  surgeries: z.string().optional(),
  injuries: z.string().optional(),
  lifestyle: z.string().optional(),
  physicalActivityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
  stressLevel: z.enum(['low', 'moderate', 'high']),
  observations: z.string().optional(),
  date: z.string().optional(),
});

export type AnamnesisData = z.infer<typeof anamnesisSchema>;

export interface Anamnesis extends AnamnesisData {
  id: string;
  studentName: string;
  createdAt: string;
}
