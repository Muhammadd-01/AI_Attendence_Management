/**
 * Academic Classes and Departments Store with local persistence
 */

const DEFAULT_CLASSES = [
  'CS-401',
  'CS-402',
  'CS-403',
  'SE-301',
  'AI-501',
  'DS-201'
];

const DEFAULT_DEPARTMENTS = [
  'Computer Science',
  'Artificial Intelligence',
  'Data Science & Analytics',
  'Software Engineering',
  'Cybersecurity & Networks'
];

export function getStoredClasses() {
  try {
    const saved = localStorage.getItem('ai_attendance_classes');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_CLASSES;
}

export function saveNewClass(newClassName) {
  const current = getStoredClasses();
  const trimmed = newClassName.trim();
  if (trimmed && !current.includes(trimmed)) {
    const updated = [...current, trimmed];
    localStorage.setItem('ai_attendance_classes', JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function removeClass(className) {
  const current = getStoredClasses();
  const updated = current.filter(c => c !== className);
  localStorage.setItem('ai_attendance_classes', JSON.stringify(updated));
  return updated;
}

export function getStoredDepartments() {
  try {
    const saved = localStorage.getItem('ai_attendance_departments');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_DEPARTMENTS;
}

export function saveNewDepartment(newDeptName) {
  const current = getStoredDepartments();
  const trimmed = newDeptName.trim();
  if (trimmed && !current.includes(trimmed)) {
    const updated = [...current, trimmed];
    localStorage.setItem('ai_attendance_departments', JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function removeDepartment(deptName) {
  const current = getStoredDepartments();
  const updated = current.filter(d => d !== deptName);
  localStorage.setItem('ai_attendance_departments', JSON.stringify(updated));
  return updated;
}
