const fs = require('fs');
const file = 'frontend/src/pages/Profile.jsx';
let content = fs.readFileSync(file, 'utf8');

const uploadFn = `
  const [isUploading, setIsUploading] = useState(false);
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const toastId = toast.loading('Uploading image...');
    try {
      const personId = user?.id || (isPrincipal ? 'PRN001' : 'TCH001');
      const url = await uploadFaceImage(personId, file, 'profile', 'teacher-faces');
      if (url) {
        setFormData({ ...formData, avatar_url: url });
        toast.success('Image uploaded successfully!', { id: toastId });
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };
`;

content = content.replace('  const handleSaveProfile = (e) => {', uploadFn + '\n  const handleSaveProfile = (e) => {');
fs.writeFileSync(file, content);
