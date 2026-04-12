export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'parent' | 'healthcare_provider';
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  _id: string;
  name: string;
  description: string;
  category: string;
  minMonths: number;
  maxMonths: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InfantMilestone {
  milestoneId: Milestone;
  status: 'Not Started' | 'Emerging' | 'Developing' | 'Achieved' | 'Mastered';
}

export interface Vaccination {
  _id: string;
  name: string;
  category: string;
  daysFromBirth: number;
  description: string;
  administration: string;
  protection: string;
  sideEffects: string[];
  dosage: string;
}

export interface InfantVaccination {
  vaccinationId: Vaccination;
  status: 'Pending' | 'Done';
  dateAdministered?: string;
}

export interface GrowthMeasurement {
  _id: string;
  infant?: string;
  date: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
}

export interface MedicalInfo {
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  pediatrician?: {
    name: string;
    contact: string;
  };
}

export interface Parent {
  user: User;
  relationship: string;
  isPrimary: boolean;
}

export interface CalendarActivity {
  date: string;
  activity: string;
  type: 'milestone' | 'growth' | 'special_occasion';
  status?: 'Not Started' | 'Emerging' | 'Developing' | 'Achieved' | 'Mastered';
  values?: {
    height?: number;
    weight?: number;
    headCircumference?: number;
  };
}

export interface InfantInsights {
  development_summary: string;
  growth_analysis: string;
  strengths: string[];
  possible_delays: string[];
  recommended_upcoming_milestones: string[];
  routine_compliance: string;
  suggested_routines: string[];
  eligible_schemes: string[];
  parenting_recommendations: string[];
  nutrition_insights: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Infant {
  _id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  birthWeight?: number;
  birthLength?: number;
  birthHeadCircumference: number;
  currentHeight?: number;
  currentWeight?: number;
  currentHeadCircumference?: number;
  growthData: GrowthMeasurement[];
  calendarActivities: CalendarActivity[];
  routines: Array<{
    date: string;
    routineIds: string[];
  }>;
  parents: Parent[];
  medicalInfo: MedicalInfo;
  milestones: InfantMilestone[];
  vaccinations: InfantVaccination[];
  insights: InfantInsights;
  chatHistory: ChatMessage[];
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ageInMonths?: number;
  ageInDays?: number;
}

export interface Routine {
  _id: string;
  name: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  duration?: number; // in minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Scheme {
  _id: string;
  name: string;
  description: string;
  type: string;
  eligibility: string;
  benefits: string;
  applicationProcess: string;
  stateScope: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface InfantState {
  selectedInfant: Infant | null;
  loading: boolean;
  error: string | null;
}

export interface DateLogActivity {
  _id?: string;
  type: 'milestone' | 'growth' | 'medical' | 'note' | 'custom' | 'special_occasion';
  description: string;
  metadata?: any;
}

export interface DateLog {
  _id: string;
  infant: string;
  date: string;
  activities: DateLogActivity[];
  anniversary?: {
    type: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
}