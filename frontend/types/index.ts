export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences: any;
  isVerified: boolean;
}

export interface Milestone {
  _id: string;
  name: string;
  description: string;
  category: string;
  recommendedAge: string;
  minMonths: number;
  maxMonths: number;
  createdAt: string;
  updatedAt: string;
}

export interface InfantMilestone {
  milestoneId: Milestone;
  status: 'Not Started' | 'Emerging' | 'Developing' | 'Achieved' | 'Mastered';
  _id: string;
}

export interface MedicalInfo {
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  pediatrician?: {
    name?: string;
    contact?: string;
  };
}

export interface Parent {
  user: string;
  relationship: string;
  isPrimary: boolean;
  _id: string;
}

export interface GrowthMeasurement {
  _id: string;
  infant: string;
  date: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthDataPoint {
  date: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
}

export interface DateLogActivity {
  type: 'milestone' | 'growth' | 'medical' | 'note' | 'custom' | 'special_occasion';
  description: string;
  referenceId?: string;
  metadata?: any;
  _id: string;
}

export interface DateLogAnniversary {
  type: 'birth_month' | 'milestone_anniversary';
  description: string;
  referenceId?: string;
}

export interface DateLog {
  _id: string;
  infant: string;
  date: string;
  activities: DateLogActivity[];
  anniversary?: DateLogAnniversary;
  createdAt: string;
  updatedAt: string;
}

export interface Infant {
  _id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  birthWeight?: number;
  birthLength?: number;
  birthHeadCircumference?: number;
  currentHeight?: number;
  currentWeight?: number;
  currentHeadCircumference?: number;
  growthData?: GrowthDataPoint[];
  parents: Parent[];
  medicalInfo?: MedicalInfo;
  milestones: InfantMilestone[];
  avatar?: string;
  isActive: boolean;
  ageInMonths?: number;
  ageInDays?: number;
  createdAt: string;
  updatedAt: string;
}