/**
 * Academic Classes and Departments Store with local persistence
 * Only displays custom classes and fields created by the user/principal.
 */

export function getStoredClasses() {
  const DEFAULT_CLASSES = ['CS-401', 'CS-402', 'SE-301', 'BBA-101'];
  try {
    const saved = localStorage.getItem('ai_attendance_classes_custom');
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
    localStorage.setItem('ai_attendance_classes_custom', JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function removeClass(className) {
  const current = getStoredClasses();
  const updated = current.filter(c => c !== className);
  localStorage.setItem('ai_attendance_classes_custom', JSON.stringify(updated));
  return updated;
}

export function getStoredDepartments() {
  const DEFAULT_DEPTS = ['Computer Science', 'Software Engineering', 'Artificial Intelligence', 'Business Administration'];
  try {
    const saved = localStorage.getItem('ai_attendance_departments_custom');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_DEPTS;
}

export function saveNewDepartment(newDeptName) {
  const current = getStoredDepartments();
  const trimmed = newDeptName.trim();
  if (trimmed && !current.includes(trimmed)) {
    const updated = [...current, trimmed];
    localStorage.setItem('ai_attendance_departments_custom', JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function removeDepartment(deptName) {
  const current = getStoredDepartments();
  const updated = current.filter(d => d !== deptName);
  localStorage.setItem('ai_attendance_departments_custom', JSON.stringify(updated));
  return updated;
}
