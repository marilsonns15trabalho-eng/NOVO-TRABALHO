import { PhysicalAssessment } from './types';

/**
 * Faulkner Protocol (4 Skinfolds)
 * % Fat = (Triceps + Subscapular + Suprailiac + Abdominal) * 0.153 + 5.783
 */
export function calculateFaulkner(
  triceps: number,
  subscapular: number,
  suprailiac: number,
  abdominal: number
): number {
  const sum = triceps + subscapular + suprailiac + abdominal;
  return sum * 0.153 + 5.783;
}

export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

export function getBMIClassification(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidade Grau I';
  if (bmi < 40) return 'Obesidade Grau II';
  return 'Obesidade Grau III';
}

export function calculateRCQ(waist: number, hip: number): number {
  if (hip === 0) return 0;
  return waist / hip;
}

export function getRCQClassification(rcq: number, gender: string, age: number): string {
  // Simplified classification based on common standards
  const isMale = gender?.toLowerCase() === 'masculino';
  
  if (isMale) {
    if (rcq < 0.85) return 'Baixo';
    if (rcq < 0.95) return 'Moderado';
    if (rcq < 1.0) return 'Alto';
    return 'Muito Alto';
  } else {
    if (rcq < 0.75) return 'Baixo';
    if (rcq < 0.85) return 'Moderado';
    if (rcq < 0.9) return 'Alto';
    return 'Muito Alto';
  }
}

export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getAssessmentResults(
  weight: number,
  heightCm: number,
  skinfolds: {
    triceps: number;
    subscapular: number;
    suprailiac: number;
    abdominal: number;
  },
  perimeters: {
    waist: number;
    hip: number;
  },
  gender: string = 'Feminino',
  age: number = 25
) {
  const bmi = calculateBMI(weight, heightCm);
  const bmiClassification = getBMIClassification(bmi);
  const fatPercentage = calculateFaulkner(
    skinfolds.triceps,
    skinfolds.subscapular,
    skinfolds.suprailiac,
    skinfolds.abdominal
  );
  
  const fatMass = (weight * fatPercentage) / 100;
  const leanMass = weight - fatMass;
  
  const waistHipRatio = calculateRCQ(perimeters.waist, perimeters.hip);
  const rcqClassification = getRCQClassification(waistHipRatio, gender, age);
  
  return {
    bmi: Number(bmi.toFixed(2)),
    bmiClassification,
    fatPercentage: Number(fatPercentage.toFixed(2)),
    fatMass: Number(fatMass.toFixed(2)),
    leanMass: Number(leanMass.toFixed(2)),
    waistHipRatio: Number(waistHipRatio.toFixed(2)),
    rcqClassification,
    age,
  };
}
