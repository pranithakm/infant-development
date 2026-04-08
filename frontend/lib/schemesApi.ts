import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Define the Scheme type to match the actual database structure
export interface Scheme {
  _id: string;
  Name: string;
  "State/Scope": string;
  Type: string;
  "Eligibility / Target Group": string;
  Objective: string;
  Benefits: string;
  Description: string;
  "Official Link": string;
  createdAt?: string;
  updatedAt?: string;
}

// Get all schemes
export const getAllSchemes = async (): Promise<Scheme[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/schemes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching schemes:', error);
    throw new Error('Failed to fetch schemes');
  }
};

// Get a specific scheme by ID
export const getSchemeById = async (id: string): Promise<Scheme> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/schemes/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scheme:', error);
    throw new Error('Failed to fetch scheme');
  }
};