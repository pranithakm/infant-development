# Growth Tracking Feature

This document explains the implementation of the growth tracking feature in the FirstSteps application.

## Overview

The growth tracking feature allows parents to monitor their infant's growth over time by recording height, weight, and head circumference measurements. The feature includes:

1. A dedicated growth tracking page with interactive charts
2. Forms for adding new measurements
3. Reference data based on WHO growth standards
4. Timeline view of all measurements
5. **Birth values displayed as starting points in charts**

## Implementation Details

### Backend

The backend implementation includes:

1. **Growth Model** (`backend/models/Growth.js`):
   - Stores height, weight, and head circumference measurements
   - Links measurements to specific infants
   - Includes date and notes fields

2. **Growth Controller** (`backend/controllers/growthController.js`):
   - Handles CRUD operations for growth measurements
   - Includes validation and authentication checks

3. **Growth Routes** (`backend/routes/growthRoutes.js`):
   - RESTful API endpoints for growth measurements
   - Protected routes requiring authentication

### Frontend

The frontend implementation includes:

1. **Growth Tracking Page** (`frontend/app/dashboard/infants/[id]/growth/page.tsx`):
   - Displays three charts for height, weight, and head circumference
   - Shows reference lines for min/max target values based on WHO standards
   - **Includes birth values as starting points in charts**
   - Includes a timeline view of all measurements

2. **Add Measurement Form** (`frontend/app/dashboard/infants/[id]/growth/AddMeasurementForm.tsx`):
   - Form for adding new growth measurements
   - Validation for measurement values

3. **Reference Data** (`frontend/data/growthReferenceData.ts`):
   - WHO growth standards for boys and girls (0-24 months)
   - Functions to retrieve target values based on infant age
   - **Proper handling of birth (age 0) reference values**

4. **UI Components**:
   - Input, Label, and Textarea components for forms
   - Chart.js for data visualization

## Usage

1. Navigate to the infant's dashboard
2. Click on "Growth" in the sidebar navigation
3. View the existing measurements in the charts and timeline
4. Click "Add Measurement" to record new measurements
5. Fill in the form with the measurement details
6. Submit the form to save the measurement

## Charts

Each chart displays:
- Blue line: Baby's actual measurements over time
- Red dashed lines: Minimum and maximum target values based on WHO standards
- **Red dots: Birth measurements (if available)**

The charts help parents visualize their infant's growth pattern and compare it to standard growth expectations.

## Birth Values

The infant's birth length and weight (if available in the profile) are automatically included as the first data point in the charts:
- Clearly marked with "Birth" prefix in chart labels
- Highlighted with special styling (red dots) to distinguish from regular measurements
- Shown in the timeline table with a light red background

## Data Storage

Growth measurements are stored in the MongoDB database with the following fields:
- `infant`: Reference to the infant
- `date`: Date of measurement
- `height`: Height in centimeters
- `weight`: Weight in kilograms
- `headCircumference`: Head circumference in centimeters
- `notes`: Optional notes about the measurement

## Future Enhancements

Potential future enhancements could include:
1. Gender-specific growth charts
2. Export functionality for measurement data
3. Growth velocity calculations
4. Integration with healthcare provider systems