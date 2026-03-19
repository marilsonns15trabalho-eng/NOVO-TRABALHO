import { PhysicalAssessment } from './types';

export const MOCK_ASSESSMENTS: PhysicalAssessment[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Ana Souza',
    date: '2024-03-10',
    weight: 65,
    height: 170,
    skinfolds: {
      triceps: 12,
      subscapular: 15,
      suprailiac: 18,
      abdominal: 22,
    },
    perimeters: {
      neck: 32,
      shoulder: 100,
      chest: 88,
      waist: 70,
      abdomen: 78,
      hip: 98,
      rightArm: 28,
      leftArm: 28,
      rightThigh: 55,
      leftThigh: 55,
      rightCalf: 36,
      leftCalf: 36,
    },
    results: {
      bmi: 22.49,
      fatPercentage: 15.72,
      fatMass: 10.22,
      leanMass: 54.78,
    },
    notes: 'Primeira avaliação do ano.'
  },
  {
    id: '2',
    studentId: '1',
    studentName: 'Ana Souza',
    date: '2024-02-10',
    weight: 67,
    height: 170,
    skinfolds: {
      triceps: 14,
      subscapular: 17,
      suprailiac: 20,
      abdominal: 25,
    },
    perimeters: {
      neck: 33,
      shoulder: 102,
      chest: 90,
      waist: 72,
      abdomen: 80,
      hip: 100,
      rightArm: 29,
      leftArm: 29,
      rightThigh: 56,
      leftThigh: 56,
      rightCalf: 37,
      leftCalf: 37,
    },
    results: {
      bmi: 23.18,
      fatPercentage: 17.40,
      fatMass: 11.66,
      leanMass: 55.34,
    },
    notes: 'Avaliação inicial.'
  }
];
