
export type Gender = 'Laki-laki' | 'Perempuan';

export interface GrowthRecord {
  id: string;
  date: string;
  weight: number; // kg
  height: number; // cm
  headCircumference?: number; // cm
  ageInMonths: number;
}

export interface ChildProfile {
  name: string;
  birthDate: string;
  gender: Gender;
}

export interface MilestoneCategory {
  category: string;
  items: {
    id: string;
    text: string;
    isAchieved: boolean;
  }[];
}

export interface AnalysisResult {
  status: 'Normal' | 'Risiko' | 'Perhatian';
  summary: string;
  recommendations: string[];
  disclaimer: string;
}
