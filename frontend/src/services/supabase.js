import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a face image to Supabase Storage
 * @param {string} personId - e.g., "ST001" or "TCH001"
 * @param {File|Blob} file - The image file/blob to upload
 * @param {number} index - Image number for naming
 * @param {string} bucket - Storage bucket ('student-faces' or 'teacher-faces')
 * @returns {string} Public URL of the uploaded image
 */
export async function uploadFaceImage(personId, file, index, bucket = 'student-faces') {
  const ext = file.name ? file.name.split('.').pop() : 'jpg';
  const filePath = `${personId}/face_${String(index).padStart(3, '0')}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg'
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Get all face images for a person
 * @param {string} personId
 * @param {string} bucket
 * @returns {string[]} Array of public URLs
 */
export async function getStudentFaces(personId, bucket = 'student-faces') {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(personId, { limit: 200, sortBy: { column: 'name', order: 'asc' } });

  if (error) throw error;

  return data.map(file => {
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${personId}/${file.name}`);
    return urlData.publicUrl;
  });
}

/**
 * Delete all face images for a person
 * @param {string} personId
 * @param {string} bucket
 */
export async function deleteStudentFaces(personId, bucket = 'student-faces') {
  const { data: files } = await supabase.storage
    .from(bucket)
    .list(personId);

  if (files && files.length > 0) {
    const filePaths = files.map(f => `${personId}/${f.name}`);
    await supabase.storage.from(bucket).remove(filePaths);
  }
}
