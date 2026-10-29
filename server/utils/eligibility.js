// Lowercase and trim so "CSE", "cse " and "Cse" all match
const norm = (s) => String(s || '').trim().toLowerCase();

/**
 * Checks one student profile against one job's eligibility rules.
 * Returns { eligible: boolean, reasons: string[] }
 */
const checkEligibility = (profile = {}, job = {}) => {
  const reasons = [];
  const rules = job.eligibility || {};

  const minCgpa = typeof rules.minCgpa === 'number' ? rules.minCgpa : (Number(rules.minCgpa) || 0);
  const studentCgpa = typeof profile.cgpa === 'number' ? profile.cgpa : (Number(profile.cgpa) || 0);

  // Rule 1: minimum CGPA
  if (minCgpa > 0 && studentCgpa < minCgpa) {
    reasons.push(`CGPA ${profile.cgpa ?? 0} is below the required ${minCgpa}`);
  }

  // Rule 2: maximum backlogs
  const maxBacklogs = rules.maxBacklogs ?? 0;
  const studentBacklogs = typeof profile.backlogs === 'number' ? profile.backlogs : (Number(profile.backlogs) || 0);
  if (studentBacklogs > maxBacklogs) {
    reasons.push(
      `${studentBacklogs} backlog(s) exceeds the allowed ${maxBacklogs}`
    );
  }

  // Rule 3: department (empty list means all departments are allowed)
  if (Array.isArray(rules.departments) && rules.departments.length > 0) {
    const allowed = rules.departments.map(norm);
    if (!allowed.includes(norm(profile.department))) {
      reasons.push(`Open only to: ${rules.departments.join(', ')}`);
    }
  }

  // Rule 4: batch (empty means any batch)
  if (rules.batch && Number(rules.batch) !== Number(profile.batch)) {
    reasons.push(`Only for the ${rules.batch} batch`);
  }

  return { eligible: reasons.length === 0, reasons };
};

/**
 * How many of the job's required skills the student has.
 * Returns { percent, matched[], missing[] }
 */
const skillMatch = (studentSkills = [], requiredSkills = []) => {
  const safeRequired = Array.isArray(requiredSkills) ? requiredSkills : [];
  if (safeRequired.length === 0) {
    return { percent: 100, matched: [], missing: [] };
  }

  const safeStudent = Array.isArray(studentSkills) ? studentSkills : [];
  const have = new Set(safeStudent.map(norm));
  const matched = safeRequired.filter((s) => have.has(norm(s)));
  const missing = safeRequired.filter((s) => !have.has(norm(s)));

  return {
    percent: Math.round((matched.length / safeRequired.length) * 100),
    matched,
    missing,
  };
};

module.exports = { checkEligibility, skillMatch };
