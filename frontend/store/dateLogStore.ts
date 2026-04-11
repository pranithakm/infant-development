import { create } from 'zustand';
import { DateLog, DateLogActivity } from '@/types';
import { dateLogApi } from '@/lib/dateLogApi';

interface DateLogStore {
  dateLogs: DateLog[];
  selectedDateLog: DateLog | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchDateLogs: (infantId: string) => Promise<void>;
  fetchDateActivities: (infantId: string, date: string) => Promise<void>;
  logActivity: (infantId: string, date: string, activity: any) => Promise<void>;
  clearSelectedDateLog: () => void;
}

export const useDateLogStore = create<DateLogStore>((set, get) => ({
  dateLogs: [],
  selectedDateLog: null,
  loading: false,
  error: null,
  
  fetchDateLogs: async (infantId: string) => {
    set({ loading: true, error: null });
    try {
      const dateLogs = await dateLogApi.getDateLogs(infantId);
      set({ dateLogs, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch date logs', 
        loading: false 
      });
    }
  },
  
  fetchDateActivities: async (infantId: string, date: string) => {
    set({ loading: true, error: null });
    try {
      const dateLog = await dateLogApi.getDateActivities(infantId, date);
      set({ selectedDateLog: dateLog, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch date activities', 
        loading: false 
      });
    }
  },
  
  logActivity: async (infantId: string, date: string, activity: any) => {
    set({ loading: true, error: null });
    try {
      await dateLogApi.logActivity(infantId, date, activity);
      // Refresh the date logs after logging activity
      await get().fetchDateLogs(infantId);
      set({ loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to log activity', 
        loading: false 
      });
    }
  },
  
  clearSelectedDateLog: () => {
    set({ selectedDateLog: null });
  }
}));