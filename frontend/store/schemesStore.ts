import { create } from 'zustand';
import { Scheme, getAllSchemes } from '@/lib/schemesApi';

interface SchemesStore {
  schemes: Scheme[];
  loading: boolean;
  error: string | null;
  fetchSchemes: () => Promise<void>;
}

export const useSchemesStore = create<SchemesStore>((set) => ({
  schemes: [],
  loading: false,
  error: null,
  
  fetchSchemes: async () => {
    try {
      set({ loading: true, error: null });
      const schemes = await getAllSchemes();
      set({ schemes, loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch schemes' 
      });
    }
  }
}));