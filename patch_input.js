const fs = require('fs');
const file = 'frontend/src/pages/Profile.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    value={formData.avatar_url || ''}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>`;

const replacement = `                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Avatar Image URL or Upload</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.avatar_url || ''}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                      className="flex-1 min-w-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <label className={\`flex items-center justify-center \${isUploading ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer'} border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 rounded-xl transition-colors text-sm font-semibold whitespace-nowrap\`}>
                      {isUploading ? 'Uploading...' : 'Upload'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
