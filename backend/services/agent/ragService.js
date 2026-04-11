'use strict';

/**
 * ragService.js
 * 
 * Retrieval-Augmented Generation layer.
 * Fetches relevant data from MongoDB and summarises it into a compact
 * text block that can be injected into an LLM prompt.
 * 
 * Capabilities:
 *   - Infant profile details
 *   - Growth trend analysis
 *   - Routine compliance summary
 *   - Milestone progress overview
 *   - Scheme eligibility
 */

const Infant = require('../../models/Infant');
const Growth = require('../../models/Growth');
const Routine = require('../../models/Routine');
const Milestone = require('../../models/Milestone');
const Scheme = require('../../models/Scheme');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate age string from date of birth.
 */
const ageFromDob = (dob) => {
  if (!dob) return 'Unknown';
  const now = new Date();
  const birth = new Date(dob);
  let months = (now.getFullYear() - birth.getFullYear()) * 12;
  months -= birth.getMonth();
  months += now.getMonth();
  months = Math.max(0, months);
  const days = Math.ceil(Math.abs(now - birth) / (1000 * 60 * 60 * 24));
  return `${months} months (${days} days)`;
};

/**
 * Compute a simple trend descriptor for a numeric array.
 * Returns "increasing", "decreasing", "stable", or "insufficient data".
 */
const describeTrend = (values) => {
  if (!values || values.length < 2) return 'insufficient data';
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const diff = last - prev;
  if (Math.abs(diff) < 0.05) return 'stable';
  return diff > 0 ? 'increasing' : 'decreasing';
};

// ---------------------------------------------------------------------------
// Context builders
// ---------------------------------------------------------------------------

/**
 * Build a complete context block for a given infant.
 * 
 * @param {string|null} infantId  - Mongoose ObjectId string (can be null)
 * @returns {Promise<{ contextText: string, infant: object|null }>}
 */
const buildContext = async (infantId) => {
  const sections = [];

  // If no infant selected, return minimal context
  if (!infantId) {
    // Still provide scheme and general milestone info
    const schemes = await Scheme.find({}).lean();
    const milestones = await Milestone.find({}).lean();

    sections.push('## General Information');
    sections.push(`Available milestones: ${milestones.length}`);
    sections.push(`Available government schemes: ${schemes.length}`);
    if (schemes.length > 0) {
      sections.push('Schemes: ' + schemes.map(s => `${s.name} (${s.stateScope})`).join(', '));
    }

    return { contextText: sections.join('\n'), infant: null };
  }

  // --- Fetch infant with populated refs ---
  const infant = await Infant.findById(infantId)
    .populate('milestones.milestoneId')
    .populate('parents.user', 'name email')
    .lean();

  if (!infant) {
    return { contextText: 'Infant not found.', infant: null };
  }

  // --- 1. Profile ---
  sections.push('## Infant Profile');
  sections.push(`Name: ${infant.name}`);
  sections.push(`Age: ${ageFromDob(infant.dateOfBirth)}`);
  sections.push(`Gender: ${infant.gender}`);
  sections.push(`Birth Weight: ${infant.birthWeight ?? 'N/A'} kg`);
  sections.push(`Birth Length: ${infant.birthLength ?? 'N/A'} cm`);
  sections.push(`Birth Head Circumference: ${infant.birthHeadCircumference ?? 'N/A'} cm`);
  sections.push(`Current Weight: ${infant.currentWeight ?? 'N/A'} kg`);
  sections.push(`Current Height: ${infant.currentHeight ?? 'N/A'} cm`);
  sections.push(`Current Head Circumference: ${infant.currentHeadCircumference ?? 'N/A'} cm`);

  // Medical info
  const med = infant.medicalInfo || {};
  sections.push(`Blood Type: ${med.bloodType || 'Unknown'}`);
  sections.push(`Allergies: ${med.allergies?.join(', ') || 'None'}`);
  sections.push(`Conditions: ${med.conditions?.join(', ') || 'None'}`);

  // --- 2. Growth trends ---
  const growthRecords = await Growth.find({ infant: infantId })
    .sort({ date: 1 })
    .lean();

  sections.push('\n## Growth Data');
  if (growthRecords.length > 0) {
    const weights = growthRecords.filter(g => g.weight).map(g => g.weight);
    const heights = growthRecords.filter(g => g.height).map(g => g.height);
    const heads = growthRecords.filter(g => g.headCircumference).map(g => g.headCircumference);

    sections.push(`Total measurements: ${growthRecords.length}`);
    sections.push(`Weight trend: ${describeTrend(weights)} (latest: ${weights[weights.length - 1] ?? 'N/A'} kg)`);
    sections.push(`Height trend: ${describeTrend(heights)} (latest: ${heights[heights.length - 1] ?? 'N/A'} cm)`);
    sections.push(`Head circumference trend: ${describeTrend(heads)} (latest: ${heads[heads.length - 1] ?? 'N/A'} cm)`);

    // Recent 3 measurements for detail
    const recent = growthRecords.slice(-3);
    sections.push('Recent measurements:');
    recent.forEach(g => {
      const d = new Date(g.date).toLocaleDateString();
      sections.push(`  ${d}: W=${g.weight ?? '-'}kg, H=${g.height ?? '-'}cm, HC=${g.headCircumference ?? '-'}cm`);
    });
  } else {
    // Fall back to inline growthData from infant document
    if (infant.growthData && infant.growthData.length > 0) {
      const weights = infant.growthData.filter(g => g.weight).map(g => g.weight);
      const heights = infant.growthData.filter(g => g.height).map(g => g.height);
      sections.push(`Inline growth records: ${infant.growthData.length}`);
      sections.push(`Weight trend: ${describeTrend(weights)}`);
      sections.push(`Height trend: ${describeTrend(heights)}`);
    } else {
      sections.push('No growth measurements recorded.');
    }
  }

  // --- 3. Milestone progress ---
  sections.push('\n## Milestone Progress');
  if (infant.milestones && infant.milestones.length > 0) {
    const statusCounts = {};
    infant.milestones.forEach(m => {
      const s = m.status || 'Not Started';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    sections.push(`Total assigned: ${infant.milestones.length}`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      sections.push(`  ${status}: ${count}`);
    });

    // List milestones with details (limit to 15 for prompt size)
    const sample = infant.milestones.slice(0, 15);
    sample.forEach(m => {
      const ms = m.milestoneId;
      if (ms) {
        sections.push(`  - ${ms.name} (${ms.category}, ${ms.minMonths}-${ms.maxMonths}mo): ${m.status}`);
      }
    });
    if (infant.milestones.length > 15) {
      sections.push(`  ... and ${infant.milestones.length - 15} more`);
    }
  } else {
    sections.push('No milestones assigned.');
  }

  // --- 4. Routines ---
  sections.push('\n## Routines');
  const personalizedRoutines = await Routine.find({
    isPersonalized: true,
    infantId: infantId,
  }).lean();

  const generalRoutines = await Routine.find({
    isPersonalized: { $ne: true },
    isActive: true,
  }).lean();

  sections.push(`General routines available: ${generalRoutines.length}`);
  sections.push(`Personalized routines: ${personalizedRoutines.length}`);

  if (personalizedRoutines.length > 0) {
    personalizedRoutines.forEach(r => {
      sections.push(`  - ${r.name} (${r.category}): ${r.description || ''}`);
    });
  }

  // Routine compliance from infant.routines (date-indexed)
  if (infant.routines && infant.routines.length > 0) {
    const recentRoutineDays = infant.routines.slice(-7);
    const totalSlots = recentRoutineDays.reduce((sum, d) => sum + (d.routineIds?.length || 0), 0);
    sections.push(`Routine entries in last ${recentRoutineDays.length} days: ${totalSlots} total routine-slots logged`);
  }

  // --- 5. Schemes ---
  const schemes = await Scheme.find({}).lean();
  sections.push('\n## Government Schemes');
  sections.push(`Available schemes: ${schemes.length}`);
  if (schemes.length > 0) {
    schemes.slice(0, 10).forEach(s => {
      sections.push(`  - ${s.name} (${s.type}, ${s.stateScope}): ${s.description?.substring(0, 80)}...`);
    });
  }

  return { contextText: sections.join('\n'), infant };
};

module.exports = { buildContext };
