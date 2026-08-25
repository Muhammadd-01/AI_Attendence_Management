import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a face image to Supabase Storage
 * @param {string} studentId - e.g., "ST001"
 * @param {File} file - The image file to upload
 * @param {number} index - Image number for naming
 * @returns {string} Public URL of the uploaded image
 */
export async function uploadFaceImage(studentId, file, index) {
  const ext = file.name.split('.').pop();
  const filePath = `${studentId}/face_${String(index).padStart(3, '0')}.${ext}`;

  const { data, error } = await supabase.storage
    .from('student-faces')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('student-faces')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Get all face images for a student
 * @param {string} studentId
 * @returns {string[]} Array of public URLs
 */
export async function getStudentFaces(studentId) {
  const { data, error } = await supabase.storage
    .from('student-faces')
    .list(studentId, { limit: 200, sortBy: { column: 'name', order: 'asc' } });

  if (error) throw error;

  return data.map(file => {
    const { data: urlData } = supabase.storage
      .from('student-faces')
      .getPublicUrl(`${studentId}/${file.name}`);
    return urlData.publicUrl;
  });
}

/**
 * Delete all face images for a student
 * @param {string} studentId
 */
export async function deleteStudentFaces(studentId) {
  const { data: files } = await supabase.storage
    .from('student-faces')
    .list(studentId);

  if (files && files.length > 0) {
    const filePaths = files.map(f => `${studentId}/${f.name}`);
    await supabase.storage.from('student-faces').remove(filePaths);
  }
}
