import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Infant, GrowthMeasurement } from '@/types';
import { infantsAPI, growthAPI, routinesAPI } from '@/lib/api';

interface InfantState {
  infants: Infant[];
  selectedInfant: Infant | null;
  growthMeasurements: GrowthMeasurement[];
  loading: boolean;
  error: string | null;
  fetchInfants: () => Promise<void>;
  fetchInfant: (id: string) => Promise<void>;
  createInfant: (infantData: Partial<Infant>) => Promise<Infant | null>;
  updateMilestoneStatus: (infantId: string, milestoneId: string, status: string) => Promise<Infant | null>;
  updateVaccinationStatus: (infantId: string, vaccinationId: string, status: string, dateAdministered?: Date) => Promise<Infant | null>;
  fetchVaccinations: (infantId: string) => Promise<void>;
  deleteInfant: (id: string) => Promise<boolean>;
  fetchGrowthMeasurements: (infantId: string) => Promise<void>;
  addGrowthMeasurement: (data: Partial<GrowthMeasurement>) => Promise<GrowthMeasurement | null>;
  updateGrowthMeasurement: (id: string, data: Partial<GrowthMeasurement>) => Promise<GrowthMeasurement | null>;
  deleteGrowthMeasurement: (id: string) => Promise<boolean>;
  updateRoutineStatus: (infantId: string, routineId: string, date: string, completed: boolean) => Promise<Infant | null>;
  selectInfant: (infant: Infant | null) => void;
  clearError: () => void;
}

export const useInfantStore = create<InfantState>()(
  persist(
    (set, get) => ({
      infants: [],
      selectedInfant: null,
      growthMeasurements: [],
      loading: false,
      error: null,

      fetchInfants: async () => {
        set({ loading: true, error: null });
        try {
          const response = await infantsAPI.getInfants();
          set({ infants: response.data.data, loading: false });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch infants', loading: false });
        }
      },

      fetchInfant: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const response = await infantsAPI.getInfant(id);
          set({ selectedInfant: response.data.data, loading: false });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch infant', loading: false });
        }
      },

      createInfant: async (infantData: Partial<Infant>) => {
        set({ loading: true, error: null });
        try {
          const response = await infantsAPI.createInfant(infantData);
          const newInfant = response.data.data;
          set((state) => ({
            infants: [...state.infants, newInfant],
            selectedInfant: newInfant,
            loading: false
          }));
          return newInfant;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to create infant', loading: false });
          return null;
        }
      },

      updateMilestoneStatus: async (infantId: string, milestoneId: string, status: string) => {
        set({ loading: true, error: null });
        try {
          const response = await infantsAPI.updateMilestoneStatus(infantId, milestoneId, status);
          const updatedInfant = response.data.data;
          
          // Log the response for debugging
          console.log('API response for milestone update:', response);
          
          // Validate and preserve minMonths and maxMonths from the previous state if missing in the response
          const previousInfant = get().selectedInfant;
          if (previousInfant && previousInfant._id === infantId) {
            updatedInfant.milestones = updatedInfant.milestones.map((infantMilestone: any) => {
              // Find the corresponding milestone in the previous state
              const previousMilestone = previousInfant.milestones.find(
                (m: any) => m.milestoneId._id === infantMilestone.milestoneId._id
              );
              
              // Always preserve the milestone definition data
              if (previousMilestone) {
                // Log if we're restoring data
                if (!infantMilestone.milestoneId.minMonths || !infantMilestone.milestoneId.maxMonths) {
                  console.warn('Restoring minMonths/maxMonths for milestone:', infantMilestone.milestoneId._id);
                }
                
                // Preserve minMonths and maxMonths from previous state if current values are missing or invalid
                const minMonths = (infantMilestone.milestoneId.minMonths !== undefined && infantMilestone.milestoneId.minMonths !== null && infantMilestone.milestoneId.minMonths >= 0) 
                  ? infantMilestone.milestoneId.minMonths 
                  : previousMilestone.milestoneId.minMonths;
                  
                const maxMonths = (infantMilestone.milestoneId.maxMonths !== undefined && infantMilestone.milestoneId.maxMonths !== null && infantMilestone.milestoneId.maxMonths >= 0) 
                  ? infantMilestone.milestoneId.maxMonths 
                  : previousMilestone.milestoneId.maxMonths;
                
                return {
                  ...infantMilestone,
                  milestoneId: {
                    ...infantMilestone.milestoneId,
                    minMonths: minMonths !== undefined && minMonths !== null ? minMonths : 0,
                    maxMonths: maxMonths !== undefined && maxMonths !== null ? maxMonths : 0,
                  }
                };
              }
              
              // If no previous milestone found, at least ensure we have valid values
              return {
                ...infantMilestone,
                milestoneId: {
                  ...infantMilestone.milestoneId,
                  minMonths: (infantMilestone.milestoneId.minMonths !== undefined && infantMilestone.milestoneId.minMonths !== null) ? infantMilestone.milestoneId.minMonths : 0,
                  maxMonths: (infantMilestone.milestoneId.maxMonths !== undefined && infantMilestone.milestoneId.maxMonths !== null) ? infantMilestone.milestoneId.maxMonths : 0,
                }
              };
            });
          }
          
          // Log the updated infant data
          console.log('Updated infant data with preserved milestone info:', updatedInfant);
          
          // Update in the store
          set((state) => ({
            infants: state.infants.map((infant) =>
              infant._id === infantId ? updatedInfant : infant
            ),
            selectedInfant: state.selectedInfant?._id === infantId ? updatedInfant : state.selectedInfant,
            loading: false
          }));
          
          return updatedInfant;
        } catch (error: any) {
          console.error('Error updating milestone status:', error);
          set({ error: error.response?.data?.message || 'Failed to update milestone', loading: false });
          return null;
        }
      },

      updateVaccinationStatus: async (infantId: string, vaccinationId: string, status: string, dateAdministered?: Date) => {
        set({ loading: true, error: null });
        try {
          const response = await infantsAPI.updateVaccinationStatus(infantId, vaccinationId, status, dateAdministered);
          const updatedVaccinations = response.data.data;
          
          set((state) => {
            if (!state.selectedInfant || state.selectedInfant._id !== infantId) return state;
            
            const updatedInfant = {
              ...state.selectedInfant,
              vaccinations: updatedVaccinations
            };
            
            return {
              infants: state.infants.map((infant) =>
                infant._id === infantId ? updatedInfant : infant
              ),
              selectedInfant: updatedInfant,
              loading: false
            };
          });
          
          return get().selectedInfant;
        } catch (error: any) {
          console.error('Error updating vaccination status:', error);
          set({ error: error.response?.data?.message || 'Failed to update vaccination', loading: false });
          return null;
        }
      },

      fetchVaccinations: async (infantId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await infantsAPI.getVaccinations(infantId);
          const vaccinations = response.data.data;
          
          set((state) => {
            if (!state.selectedInfant || state.selectedInfant._id !== infantId) return state;
            
            return {
              selectedInfant: {
                ...state.selectedInfant,
                vaccinations
              },
              loading: false
            };
          });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch vaccinations', loading: false });
        }
      },

      updateRoutineStatus: async (infantId: string, date: string, routineId: string, completed: boolean) => {
        set({ loading: true, error: null });
        try {
          console.log('Updating routine status:', { infantId, date, routineId, completed });
          const response = await routinesAPI.updateInfantRoutineStatus(infantId, date, routineId, completed);
          const updatedInfant = response.data.data;
          
          console.log('API response:', response.data);
          
          // Update in the store
          set((state) => ({
            infants: state.infants.map((infant) =>
              infant._id === infantId ? updatedInfant : infant
            ),
            selectedInfant: state.selectedInfant?._id === infantId ? updatedInfant : state.selectedInfant,
            loading: false
          }));
          
          return updatedInfant;
        } catch (error: any) {
          console.error('Error updating routine status:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to update routine';
          set({ error: errorMessage, loading: false });
          return null;
        }
      },

      deleteInfant: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await infantsAPI.deleteInfant(id);
          set((state) => ({
            infants: state.infants.filter((infant) => infant._id !== id),
            selectedInfant: state.selectedInfant?._id === id ? null : state.selectedInfant,
            loading: false
          }));
          return true;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to delete infant', loading: false });
          return false;
        }
      },

      fetchGrowthMeasurements: async (infantId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await growthAPI.getGrowthMeasurements(infantId);
          set({ growthMeasurements: response.data.data, loading: false });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch growth measurements', loading: false });
        }
      },

      addGrowthMeasurement: async (data: Partial<GrowthMeasurement>) => {
        set({ loading: true, error: null });
        try {
          const response = await growthAPI.addGrowthMeasurement(data);
          const newMeasurement = response.data.data;
          set((state) => ({
            growthMeasurements: [...state.growthMeasurements, newMeasurement],
            // Update the selected infant with new current values if this is for the selected infant
            selectedInfant: state.selectedInfant && data.infant && state.selectedInfant._id === data.infant ? {
              ...state.selectedInfant,
              currentHeight: data.height !== undefined ? data.height : state.selectedInfant.currentHeight,
              currentWeight: data.weight !== undefined ? data.weight : state.selectedInfant.currentWeight,
              currentHeadCircumference: data.headCircumference !== undefined ? data.headCircumference : state.selectedInfant.currentHeadCircumference
            } as Infant : state.selectedInfant,
            loading: false
          }));
          return newMeasurement;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to add growth measurement', loading: false });
          return null;
        }
      },

      updateGrowthMeasurement: async (id: string, data: Partial<GrowthMeasurement>) => {
        set({ loading: true, error: null });
        try {
          const response = await growthAPI.updateGrowthMeasurement(id, data);
          const updatedMeasurement = response.data.data;
          
          // Update in the store
          set((state) => ({
            growthMeasurements: state.growthMeasurements.map((measurement) =>
              measurement._id === id ? updatedMeasurement : measurement
            ),
            // Update the selected infant with new current values if this is for the selected infant
            selectedInfant: state.selectedInfant && data.infant && state.selectedInfant._id === data.infant ? {
              ...state.selectedInfant,
              currentHeight: data.height !== undefined ? data.height : state.selectedInfant.currentHeight,
              currentWeight: data.weight !== undefined ? data.weight : state.selectedInfant.currentWeight,
              currentHeadCircumference: data.headCircumference !== undefined ? data.headCircumference : state.selectedInfant.currentHeadCircumference
            } as Infant : state.selectedInfant,
            loading: false
          }));
          
          return updatedMeasurement;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to update growth measurement', loading: false });
          return null;
        }
      },

      deleteGrowthMeasurement: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await growthAPI.deleteGrowthMeasurement(id);
          set((state) => ({
            growthMeasurements: state.growthMeasurements.filter((measurement) => measurement._id !== id),
            loading: false
          }));
          return true;
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to delete growth measurement', loading: false });
          return false;
        }
      },

      selectInfant: (infant: Infant | null) => {
        set({ selectedInfant: infant });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'infant-storage',
      partialize: (state) => ({ infants: state.infants, selectedInfant: state.selectedInfant }),
    }
  )
);