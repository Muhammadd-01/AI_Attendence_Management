import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rsasnwxsaohotxcqtesq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYXNud3hzYW9ob3R4Y3F0ZXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NTUzNDMsImV4cCI6MjEwMzIzMTM0M30.AEsV0UxzEes28gTdZZqiAlrGGknVTubLdxlFXFbVjQM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a face image to Supabase Storage with bucket auto-fallback
 */
export async function uploadFaceImage(personId, file, index, bucket = 'student-faces') {
  const ext = file.name ? file.name.split('.').pop() : 'jpg';
  const filePath = `${personId}/face_${String(index).padStart(3, '0')}.${ext}`;

  // Try primary bucket, fallback to student-faces if teacher-faces is not created
  const bucketsToTry = [bucket, 'student-faces', 'faces'];
  let lastError = null;

  for (const b of bucketsToTry) {
    try {
      const { data, error } = await supabase.storage
        .from(b)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || 'image/jpeg'
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from(b)
          .getPublicUrl(filePath);
        return `${urlData.publicUrl}?t=${Date.now()}`;
      } else if (error) {
        lastError = error;
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (lastError && lastError.message && lastError.message.toLowerCase().includes('bucket not found')) {
    throw new Error(`Storage Bucket Not Found. Please create a public bucket named '${bucket}' in your Supabase dashboard.`);
  }

  return null;
}

/**
 * Get all face images for a person
 */
export async function getStudentFaces(personId, bucket = 'student-faces') {
  const bucketsToTry = [bucket, 'student-faces', 'faces'];

  for (const b of bucketsToTry) {
    try {
      const { data, error } = await supabase.storage
        .from(b)
        .list(personId, { limit: 200, sortBy: { column: 'name', order: 'asc' } });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(file => {
          const { data: urlData } = supabase.storage
            .from(b)
            .getPublicUrl(`${personId}/${file.name}`);
          return `${urlData.publicUrl}?t=${Date.now()}`;
        });
      }
    } catch (e) {}
  }

  return [];
}

/**
 * Delete all face images for a person across all buckets
 */
export async function deleteStudentFaces(personId, bucket = 'student-faces') {
  if (!personId) return;
  const bucketsToTry = Array.from(new Set([bucket, 'teacher-faces', 'student-faces', 'faces']));
  for (const b of bucketsToTry) {
    try {
      const { data: files, error } = await supabase.storage
        .from(b)
        .list(String(personId), { limit: 200 });

      if (!error && Array.isArray(files) && files.length > 0) {
        const filePaths = files.map(f => `${personId}/${f.name}`);
        await supabase.storage.from(b).remove(filePaths);
      }
    } catch (e) {
      console.warn(`Error deleting faces from bucket ${b}:`, e);
    }
  }
}
