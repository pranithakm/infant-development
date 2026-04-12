const mongoose = require('mongoose');
const Vaccination = require('../models/Vaccination');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const VACCINATIONS_DATA = [
  {
    name: 'Bacillus Calmette Guerin (BCG)',
    category: 'AT BIRTH',
    daysFromBirth: 0,
    dosage: 'Single dose',
    administration: 'Injection on upper arm',
    protection: 'Tuberculosis',
    description: 'A single dose vaccine given at birth.',
    sideEffects: [
      'Soreness or discharge where the injection was given',
      'High temperature',
      'Headache',
      'Swollen glands under the armpit'
    ]
  },
  {
    name: 'Oral Polio Vaccine (OPV) – 0 dose',
    category: 'AT BIRTH',
    daysFromBirth: 0,
    dosage: 'First dose',
    administration: 'Orally',
    protection: 'Poliovirus',
    description: 'First dose taken at birth. Highly infectious disease that invades the nervous system.',
    sideEffects: ['None common']
  },
  {
    name: 'Hepatitis B birth dose',
    category: 'AT BIRTH',
    daysFromBirth: 0,
    dosage: 'Single dose',
    administration: 'Injection',
    protection: 'Hepatitis B',
    description: 'Protects against Hepatitis B which attacks the liver.',
    sideEffects: ['Redness and soreness at injection site']
  },
  {
    name: 'Oral Polio Vaccine (OPV) - 1',
    category: '6 WEEKS',
    daysFromBirth: 42,
    dosage: 'Second dose',
    administration: 'Orally',
    protection: 'Poliovirus',
    description: 'Second OPV dose taken at 6 weeks.',
    sideEffects: ['None common']
  },
  {
    name: 'Pentavalent - 1',
    category: '6 WEEKS',
    daysFromBirth: 42,
    dosage: 'First dose',
    administration: 'Injection',
    protection: 'Diphtheria, Pertussis, Tetanus, Hepatitis B and Hib',
    description: 'First dose taken at 6 weeks old.',
    sideEffects: [
      'Swelling, redness and pain at site',
      'Fever for a short time',
      'Symptoms last 1-3 days'
    ]
  },
  {
    name: 'Rotavirus Vaccine (RVV) - 1',
    category: '6 WEEKS',
    daysFromBirth: 42,
    dosage: 'First of three doses',
    administration: 'Orally',
    protection: 'Rotaviruses (severe diarrhoeal disease)',
    description: 'First dose of three doses.',
    sideEffects: ['Rare and mild', 'Diarrhea, vomiting, irritation']
  },
  {
    name: 'Pneumococcal Conjugate Vaccine (PCV) - 1',
    category: '6 WEEKS',
    daysFromBirth: 42,
    dosage: 'First of two doses',
    administration: 'Injection',
    protection: 'Meningitis, septicemia and pneumonia',
    description: 'First of two doses of the PCV.',
    sideEffects: ['Redness', 'Swelling', 'Fever', 'Loss of appetite', 'Irritability', 'Tiredness']
  },
  {
    name: 'Inactivated Polio Vaccine (fIPV) - 1',
    category: '6 WEEKS',
    daysFromBirth: 42,
    dosage: 'First of two doses',
    administration: 'Injection',
    protection: 'Poliovirus',
    description: 'First of two doses of the fIPV.',
    sideEffects: ['Soreness', 'Fever']
  },
  {
    name: 'Pentavalent - 2',
    category: '10 WEEKS',
    daysFromBirth: 70,
    dosage: 'Second dose',
    administration: 'Injection',
    protection: 'Diphtheria, Pertussis, Tetanus, Hepatitis B and Hib',
    description: 'Second dose taken at 10 weeks old.',
    sideEffects: [
      'Swelling, redness and pain at site',
      'Fever for a short time',
      'Symptoms last 1-3 days'
    ]
  },
  {
    name: 'Oral Polio Vaccine (OPV) - 2',
    category: '10 WEEKS',
    daysFromBirth: 70,
    dosage: 'Third dose',
    administration: 'Orally',
    protection: 'Poliovirus',
    description: 'Third OPV dose taken when your child is 10 weeks old.',
    sideEffects: ['None common']
  },
  {
    name: 'Rotavirus Vaccine (RVV) - 2',
    category: '10 WEEKS',
    daysFromBirth: 70,
    dosage: 'Second dose',
    administration: 'Orally',
    protection: 'Rotaviruses',
    description: 'The second dose is taken when your child is 10 weeks old.',
    sideEffects: ['Rare and mild', 'Diarrhea, vomiting, irritation']
  },
  {
    name: 'Pentavalent - 3',
    category: '14 WEEKS',
    daysFromBirth: 98,
    dosage: 'Last dose',
    administration: 'Injection',
    protection: 'Diphtheria, Pertussis, Tetanus, Hepatitis B and Hib',
    description: 'This is the last Pentavalent vaccine dose to be taken at 14 weeks old.',
    sideEffects: [
      'Swelling, redness and pain at site',
      'Fever for a short time',
      'Symptoms last 1-3 days'
    ]
  },
  {
    name: 'Oral Polio Vaccine (OPV) - 3',
    category: '14 WEEKS',
    daysFromBirth: 98,
    dosage: 'Last dose',
    administration: 'Orally',
    protection: 'Poliovirus',
    description: 'This is the last OPV dose taken when your child is 14 weeks old.',
    sideEffects: ['None common']
  },
  {
    name: 'Rotavirus Vaccine (RVV) - 3',
    category: '14 WEEKS',
    daysFromBirth: 98,
    dosage: 'Last dose',
    administration: 'Orally',
    protection: 'Rotaviruses',
    description: 'This is the last RVV dose taken when your child is 14 weeks old.',
    sideEffects: ['Rare and mild', 'Diarrhea, vomiting, irritation']
  },
  {
    name: 'Pneumococcal Conjugate Vaccine (PCV) - 2',
    category: '14 WEEKS',
    daysFromBirth: 98,
    dosage: 'Second of two doses',
    administration: 'Injection',
    protection: 'Meningitis, septicaemia and pneumonia',
    description: 'The second of two doses of the PCV given at 14 weeks old.',
    sideEffects: ['Redness', 'Swelling', 'Fever', 'Loss of appetite', 'Irritability', 'Tiredness']
  },
  {
    name: 'Inactivated Polio Vaccine (fIPV) - 2',
    category: '14 WEEKS',
    daysFromBirth: 98,
    dosage: 'Final dose',
    administration: 'Injection',
    protection: 'Poliovirus',
    description: 'The final fIPV dose is given to your child at 14 weeks.',
    sideEffects: ['Soreness', 'Fever']
  },
  {
    name: 'Measles & Rubella (MR) - 1',
    category: '9-12 MONTHS',
    daysFromBirth: 274,
    dosage: 'First of two doses',
    administration: 'Injection',
    protection: 'Measles and Rubella',
    description: 'The first of two doses of the MR vaccine.',
    sideEffects: ['Redness, swelling, high temperature after 7-11 days']
  },
  {
    name: 'Japanese Encephalitis (JE-1)',
    category: '9-12 MONTHS',
    daysFromBirth: 274,
    dosage: 'First of two doses',
    administration: 'Injection',
    protection: 'Japanese Encephalitis',
    description: 'The first of two doses of the JE-1 vaccine.',
    sideEffects: ['Fever', 'Headache', 'Pain at injection site']
  },
  {
    name: 'Pneumococcal Conjugate Vaccine - Booster',
    category: '9-12 MONTHS',
    daysFromBirth: 274,
    dosage: 'Single dose',
    administration: 'Injection',
    protection: 'Pneumonia, ear infections, sinus infections, meningitis',
    description: 'A single dose booster vaccine.',
    sideEffects: ['Redness', 'Swelling', 'Fever', 'Irritability']
  },
  {
    name: 'Measles & Rubella (MR) - 2',
    category: '16-24 MONTHS',
    daysFromBirth: 487,
    dosage: 'Second of two doses',
    administration: 'Injection',
    protection: 'Measles and Rubella',
    description: 'The second of two doses administered between 16-24 months.',
    sideEffects: ['Redness, swelling, high temperature after 7-11 days']
  },
  {
    name: 'Japanese Encephalitis (JE-2)',
    category: '16-24 MONTHS',
    daysFromBirth: 487,
    dosage: 'Final dose',
    administration: 'Injection',
    protection: 'Japanese Encephalitis',
    description: 'The final JE vaccine administered between 16-24 months.',
    sideEffects: ['Fever', 'Headache', 'Pain at injection site']
  },
  {
    name: 'Diphtheria Pertussis & Tetanus (DPT) - Booster 1',
    category: '16-24 MONTHS',
    daysFromBirth: 487,
    dosage: 'First booster',
    administration: 'Injection',
    protection: 'Diphtheria, pertussis, and tetanus',
    description: 'The first of two booster doses of the DPT vaccine.',
    sideEffects: ['Soreness', 'Fever', 'Irritation', 'Loss of appetite']
  },
  {
    name: 'Oral Polio Vaccine – Booster',
    category: '16-24 MONTHS',
    daysFromBirth: 487,
    dosage: 'Single dose',
    administration: 'Orally',
    protection: 'Poliovirus',
    description: 'A single dose booster vaccine.',
    sideEffects: ['None common']
  },
  {
    name: 'Diphtheria Pertussis & Tetanus (DPT) - Booster 2',
    category: '5-6 YEARS',
    daysFromBirth: 1826,
    dosage: 'Second booster',
    administration: 'Injection',
    protection: 'Diphtheria, pertussis, and tetanus',
    description: 'The second of two doses when the child is 5-6 years old.',
    sideEffects: ['Soreness', 'Fever', 'Irritation', 'Loss of appetite']
  },
  {
    name: 'Tetanus & adult Diphtheria (Td)',
    category: '10 YEARS',
    daysFromBirth: 3652,
    dosage: 'Single dose',
    administration: 'Injection',
    protection: 'Tetanus and Diphtheria',
    description: 'A single dose vaccine at 10 years old.',
    sideEffects: ['Pain', 'Redness', 'Mild fever', 'Headache', 'Exhaustion']
  },
  {
    name: 'Tetanus & adult Diphtheria (Td)',
    category: '16 YEARS',
    daysFromBirth: 5844,
    dosage: 'Single dose',
    administration: 'Injection',
    protection: 'Tetanus and Diphtheria',
    description: 'A single dose vaccine at 16 years old.',
    sideEffects: ['Pain', 'Redness', 'Mild fever', 'Headache', 'Exhaustion']
  }
];

const seedVaccinations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Vaccination.deleteMany({});
    console.log('Deleted existing vaccinations');

    await Vaccination.insertMany(VACCINATIONS_DATA);
    console.log('Successfully seeded vaccinations');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding vaccinations:', error);
    process.exit(1);
  }
};

seedVaccinations();
