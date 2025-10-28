// WHO Growth Standards for Boys and Girls (0-24 months)
// Data points represent 3rd percentile (min), 50th percentile (median), and 97th percentile (max)

export interface GrowthReferencePoint {
  ageInMonths: number;
  height: {
    min: number;  // 3rd percentile
    median: number; // 50th percentile
    max: number;  // 97th percentile
  };
  weight: {
    min: number;  // 3rd percentile
    median: number; // 50th percentile
    max: number;  // 97th percentile
  };
  headCircumference: {
    min: number;  // 3rd percentile
    median: number; // 50th percentile
    max: number;  // 97th percentile
  };
}

export const growthReferenceData: GrowthReferencePoint[] = [
  // 0 months (birth)
  {
    ageInMonths: 0,
    height: { min: 46.2, median: 50.0, max: 53.8 },
    weight: { min: 2.5, median: 3.3, max: 4.4 },
    headCircumference: { min: 32.2, median: 34.2, max: 36.2 }
  },
  // 1 month
  {
    ageInMonths: 1,
    height: { min: 50.8, median: 54.7, max: 58.5 },
    weight: { min: 3.5, median: 4.5, max: 5.7 },
    headCircumference: { min: 35.1, median: 37.2, max: 39.2 }
  },
  // 2 months
  {
    ageInMonths: 2,
    height: { min: 54.3, median: 58.4, max: 62.4 },
    weight: { min: 4.4, median: 5.6, max: 7.0 },
    headCircumference: { min: 36.9, median: 39.1, max: 41.2 }
  },
  // 3 months
  {
    ageInMonths: 3,
    height: { min: 57.1, median: 61.4, max: 65.5 },
    weight: { min: 5.1, median: 6.4, max: 8.0 },
    headCircumference: { min: 38.2, median: 40.5, max: 42.7 }
  },
  // 4 months
  {
    ageInMonths: 4,
    height: { min: 59.4, median: 63.9, max: 68.0 },
    weight: { min: 5.7, median: 7.0, max: 8.8 },
    headCircumference: { min: 39.2, median: 41.6, max: 43.9 }
  },
  // 5 months
  {
    ageInMonths: 5,
    height: { min: 61.3, median: 65.9, max: 70.1 },
    weight: { min: 6.2, median: 7.5, max: 9.4 },
    headCircumference: { min: 40.0, median: 42.5, max: 44.9 }
  },
  // 6 months
  {
    ageInMonths: 6,
    height: { min: 62.9, median: 67.6, max: 71.9 },
    weight: { min: 6.6, median: 7.9, max: 9.9 },
    headCircumference: { min: 40.7, median: 43.3, max: 45.7 }
  },
  // 7 months
  {
    ageInMonths: 7,
    height: { min: 64.3, median: 69.2, max: 73.5 },
    weight: { min: 6.9, median: 8.3, max: 10.4 },
    headCircumference: { min: 41.3, median: 44.0, max: 46.5 }
  },
  // 8 months
  {
    ageInMonths: 8,
    height: { min: 65.6, median: 70.6, max: 75.0 },
    weight: { min: 7.2, median: 8.6, max: 10.8 },
    headCircumference: { min: 41.9, median: 44.6, max: 47.2 }
  },
  // 9 months
  {
    ageInMonths: 9,
    height: { min: 66.7, median: 71.9, max: 76.3 },
    weight: { min: 7.4, median: 8.9, max: 11.2 },
    headCircumference: { min: 42.4, median: 45.2, max: 47.8 }
  },
  // 10 months
  {
    ageInMonths: 10,
    height: { min: 67.8, median: 73.1, max: 77.5 },
    weight: { min: 7.6, median: 9.2, max: 11.5 },
    headCircumference: { min: 42.8, median: 45.7, max: 48.4 }
  },
  // 11 months
  {
    ageInMonths: 11,
    height: { min: 68.8, median: 74.2, max: 78.6 },
    weight: { min: 7.8, median: 9.4, max: 11.8 },
    headCircumference: { min: 43.2, median: 46.2, max: 48.9 }
  },
  // 12 months
  {
    ageInMonths: 12,
    height: { min: 69.7, median: 75.3, max: 79.7 },
    weight: { min: 8.0, median: 9.6, max: 12.1 },
    headCircumference: { min: 43.5, median: 46.6, max: 49.4 }
  },
  // 13 months
  {
    ageInMonths: 13,
    height: { min: 70.6, median: 76.4, max: 80.7 },
    weight: { min: 8.1, median: 9.9, max: 12.4 },
    headCircumference: { min: 43.8, median: 47.0, max: 49.8 }
  },
  // 14 months
  {
    ageInMonths: 14,
    height: { min: 71.4, median: 77.4, max: 81.7 },
    weight: { min: 8.3, median: 10.1, max: 12.7 },
    headCircumference: { min: 44.1, median: 47.4, max: 50.2 }
  },
  // 15 months
  {
    ageInMonths: 15,
    height: { min: 72.2, median: 78.3, max: 82.6 },
    weight: { min: 8.4, median: 10.3, max: 13.0 },
    headCircumference: { min: 44.3, median: 47.7, max: 50.6 }
  },
  // 16 months
  {
    ageInMonths: 16,
    height: { min: 73.0, median: 79.2, max: 83.5 },
    weight: { min: 8.5, median: 10.5, max: 13.3 },
    headCircumference: { min: 44.5, median: 48.0, max: 50.9 }
  },
  // 17 months
  {
    ageInMonths: 17,
    height: { min: 73.7, median: 80.1, max: 84.3 },
    weight: { min: 8.6, median: 10.7, max: 13.5 },
    headCircumference: { min: 44.7, median: 48.3, max: 51.2 }
  },
  // 18 months
  {
    ageInMonths: 18,
    height: { min: 74.4, median: 80.9, max: 85.1 },
    weight: { min: 8.7, median: 10.9, max: 13.8 },
    headCircumference: { min: 44.9, median: 48.6, max: 51.5 }
  },
  // 19 months
  {
    ageInMonths: 19,
    height: { min: 75.1, median: 81.7, max: 85.9 },
    weight: { min: 8.8, median: 11.1, max: 14.0 },
    headCircumference: { min: 45.1, median: 48.8, max: 51.8 }
  },
  // 20 months
  {
    ageInMonths: 20,
    height: { min: 75.7, median: 82.5, max: 86.6 },
    weight: { min: 8.9, median: 11.3, max: 14.2 },
    headCircumference: { min: 45.2, median: 49.0, max: 52.0 }
  },
  // 21 months
  {
    ageInMonths: 21,
    height: { min: 76.4, median: 83.2, max: 87.3 },
    weight: { min: 9.0, median: 11.5, max: 14.4 },
    headCircumference: { min: 45.4, median: 49.2, max: 52.2 }
  },
  // 22 months
  {
    ageInMonths: 22,
    height: { min: 77.0, median: 84.0, max: 88.0 },
    weight: { min: 9.1, median: 11.7, max: 14.6 },
    headCircumference: { min: 45.5, median: 49.4, max: 52.4 }
  },
  // 23 months
  {
    ageInMonths: 23,
    height: { min: 77.6, median: 84.7, max: 88.7 },
    weight: { min: 9.2, median: 11.8, max: 14.8 },
    headCircumference: { min: 45.6, median: 49.6, max: 52.6 }
  },
  // 24 months
  {
    ageInMonths: 24,
    height: { min: 78.2, median: 85.4, max: 89.4 },
    weight: { min: 9.3, median: 12.0, max: 15.0 },
    headCircumference: { min: 45.7, median: 49.7, max: 52.8 }
  }
];

// Function to get reference values for a specific age
export const getReferenceValues = (ageInMonths: number) => {
  // For birth (age 0), use the first data point
  if (ageInMonths <= 0) {
    return {
      heightMin: growthReferenceData[0].height.min,
      heightMax: growthReferenceData[0].height.max,
      weightMin: growthReferenceData[0].weight.min,
      weightMax: growthReferenceData[0].weight.max,
      headCircumferenceMin: growthReferenceData[0].headCircumference.min,
      headCircumferenceMax: growthReferenceData[0].headCircumference.max
    };
  }
  
  // Find the closest age in our reference data
  const closestData = growthReferenceData.reduce((prev, curr) => {
    return (Math.abs(curr.ageInMonths - ageInMonths) < Math.abs(prev.ageInMonths - ageInMonths) ? curr : prev);
  });
  
  return {
    heightMin: closestData.height.min,
    heightMax: closestData.height.max,
    weightMin: closestData.weight.min,
    weightMax: closestData.weight.max,
    headCircumferenceMin: closestData.headCircumference.min,
    headCircumferenceMax: closestData.headCircumference.max
  };
};