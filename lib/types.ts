export interface PhysicalAssessment {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  weight: number; // kg
  height: number; // cm
  
  // Skinfolds (mm)
  skinfolds: {
    triceps: number;
    subscapular: number;
    suprailiac: number;
    abdominal: number;
  };
  
  // Perimeters (cm)
  perimeters: {
    neck: number;
    shoulder: number;
    chest: number;
    waist: number;
    abdomen: number;
    hip: number;
    rightArm: number;
    leftArm: number;
    rightThigh: number;
    leftThigh: number;
    rightCalf: number;
    leftCalf: number;
  };
  
  // Calculated Results
  results: {
    bmi: number; // IMC
    fatPercentage: number; // % Gordura
    fatMass: number; // Massa Gorda (kg)
    leanMass: number; // Massa Magra (kg)
  };
  
  notes?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoUrl?: string;
  birthDate: string;
  status: 'active' | 'inactive';
  planId?: string;
  joinDate: string;
}

export interface Plan {
  id: string;
  name: string;
  frequency: number; // x/semana
  price: number;
  active: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
}
