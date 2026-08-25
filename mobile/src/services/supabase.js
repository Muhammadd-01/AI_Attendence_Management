import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

const SUPABASE_URL = 'https://rsasnwxsaohotxcqtesq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYXNud3hzYW9ob3R4Y3F0ZXNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NTUzNDMsImV4cCI6MjEwMzIzMTM0M30.AEsV0UxzEes28gTdZZqiAlrGGknVTubLdxlFXFbVjQM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const uploadFaceImage = async (personId, role, imageBase64, count) => {
  try {
    const fileName = `${role}_${personId}_${Date.now()}_${count}.jpg`;
    const bucket = role === 'teacher' ? 'teacher-faces' : 'student-faces';
    
    // React Native doesn't have Buffer natively, decode base64 to arraybuffer
    const arrayBuffer = decode(imageBase64);
    
    let { data, error } = await supabase.storage
      .from(bucket)
      .upload(`${personId}/${fileName}`, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });
      
    if (error && error.message.includes('Bucket not found')) {
      const { data: fbData, error: fbError } = await supabase.storage
        .from('student-faces')
        .upload(`${personId}/${fileName}`, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });
      if (fbError) throw fbError;
      data = fbData;
      
      const { data: publicUrlData } = supabase.storage
        .from('student-faces')
        .getPublicUrl(`${personId}/${fileName}`);
      return publicUrlData.publicUrl;
    } else if (error) {
      throw error;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${personId}/${fileName}`);
      
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Supabase upload err:', error);
    throw error;
  }
};
