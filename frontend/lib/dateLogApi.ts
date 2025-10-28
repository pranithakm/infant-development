import api from './api';
import { DateLog } from '@/types';

// Helper function to format dates as YYYY-MM-DD without timezone conversion
const formatDateToLocalString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to create a date object from YYYY-MM-DD string
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const dateLogApi = {
  // Get all date logs for an infant (now using calendar activities from infant)
  getDateLogs: async (infantId: string): Promise<DateLog[]> => {
    const response = await api.get(`/infants/${infantId}/calendar`);
    // Transform the calendar activities to DateLog format
    const activities = response.data.data;
    
    // Group activities by date
    const groupedActivities: Record<string, any[]> = {};
    activities.forEach((activity: any) => {
      // Format date properly without timezone conversion
      const dateStr = formatDateToLocalString(new Date(activity.date));
      if (!groupedActivities[dateStr]) {
        groupedActivities[dateStr] = [];
      }
      groupedActivities[dateStr].push(activity);
    });
    
    // Convert to DateLog format
    const dateLogs: DateLog[] = Object.keys(groupedActivities).map(date => ({
      _id: `temp-${infantId}-${date}`, // More robust temporary ID
      infant: infantId,
      date: date,
      activities: groupedActivities[date].map((activity, index) => ({
        type: activity.type,
        description: activity.activity,
        metadata: activity.type === 'milestone' 
          ? { status: activity.status } 
          : activity.type === 'growth' 
          ? activity.values 
          : activity.type === 'special_occasion'
          ? activity.values
          : {},
        _id: `temp-${infantId}-${date}-${index}` // More robust temporary ID
      })),
      anniversary: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    return dateLogs;
  },

  // Get activities for a specific date (now using calendar activities from infant)
  getDateActivities: async (infantId: string, date: string): Promise<DateLog> => {
    const response = await api.get(`/infants/${infantId}/calendar`);
    const activities = response.data.data;
    
    // Filter activities for the specific date
    const dateActivities = activities.filter((activity: any) => {
      const activityDate = formatDateToLocalString(new Date(activity.date));
      return activityDate === date;
    });
    
    return {
      _id: `temp-${infantId}-${date}`, // More robust temporary ID
      infant: infantId,
      date: date,
      activities: dateActivities.map((activity: any, index: number) => ({
        type: activity.type,
        description: activity.activity,
        metadata: activity.type === 'milestone' 
          ? { status: activity.status } 
          : activity.type === 'growth' 
          ? activity.values 
          : activity.type === 'special_occasion'
          ? activity.values
          : {},
        _id: `temp-${infantId}-${date}-${index}` // More robust temporary ID
      })),
      anniversary: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  // Log an activity (now updating infant's calendar activities)
  logActivity: async (infantId: string, date: string, activity: any) => {
    // This will be handled by the existing infant update endpoints
    // For milestones: PUT /api/infants/:id/milestones/:milestoneId
    // For growth: POST /api/growth
    // We don't need a separate endpoint for this anymore
    return Promise.resolve({ success: true });
  },

  // Get anniversaries for an infant
  getAnniversaries: async (infantId: string) => {
    // This functionality can be added later if needed
    return Promise.resolve({ success: true, data: [] });
  }
};