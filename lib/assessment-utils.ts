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

export function getAssessmentResults(
  weight: number,
  heightCm: number,
  skinfolds: {
    triceps: number;
    subscapular: number;
    suprailiac: number;
    abdominal: number;
  }
) {
  const bmi = calculateBMI(weight, heightCm);
  const fatPercentage = calculateFaulkner(
    skinfolds.triceps,
    skinfolds.subscapular,
    skinfolds.suprailiac,
    skinfolds.abdominal
  );
  
  const fatMass = (weight * fatPercentage) / 100;
  const leanMass = weight - fatMass;
  
  return {
    bmi: Number(bmi.toFixed(2)),
    fatPercentage: Number(fatPercentage.toFixed(2)),
    fatMass: Number(fatMass.toFixed(2)),
    leanMass: Number(leanMass.toFixed(2)),
  };
}
