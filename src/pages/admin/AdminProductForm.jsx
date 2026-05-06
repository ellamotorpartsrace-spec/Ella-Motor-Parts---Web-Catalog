import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Image as ImageIcon, Trash2, Plus, Info,
  CheckCircle2, Box, Tag, Upload, X, Star
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { IMAGE_URL } from '../../utils/constants';

// Parse images field (could be JSON array, comma-separated, or single)
function parseImages(imageField) {
  if (!imageField || imageField === '/images/default-product.png') return [];
  try {
    const parsed = JSON.parse(imageField);
    if (Array.isArray(parsed)) return parsed;
    return [imageField];
  } catch {
    if (imageField.includes(',')) return imageField.split(',').map(s => s.trim());
    return [imageField];
  }
}

function resolveUrl(img) {
  if (!img) return '/placeholder.png';
  return img.startsWith('/uploads') ? `${IMAGE_URL}${img}` : img;
}

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Existing saved images (URLs)
  const [savedImages, setSavedImages] = useState([]);
  // New local files staged for upload (not yet saved)
  const [stagedFiles, setStagedFiles] = useState([]); // [{file, preview}]

  const [form, setForm] = useState({
    name: '', category: '', brand: '', price: '', stock: '',
    sku: '', description: '', featured: false, specs: {}, compatibility: [],
    installation_notes: ''
  });

  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [newCompat, setNewCompat] = useState('');

  useEffect(() => {
    if (isEdit) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      const p = data.product;
      setForm({
        ...p,
        specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs || {},
        compatibility: typeof p.compatibility === 'string' ? JSON.parse(p.compatibility) : p.compatibility || [],
        featured: p.featured === 1 || p.featured === true
      });
      setSavedImages(parseImages(p.image));
    } catch {
      toast.error('Failed to load product.');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  // Stage new images for upload
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newStaged = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setStagedFiles(prev => [...prev, ...newStaged]);
    e.target.value = ''; // Reset input
  };

  const removeStagedFile = (idx) => {
    setStagedFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeSavedImage = (idx) => {
    setSavedImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Move a saved image to primary position
  const setPrimaryImage = (idx) => {
    setSavedImages(prev => {
      const reordered = [...prev];
      const [primary] = reordered.splice(idx, 1);
      return [primary, ...reordered];
    });
  };

  // Upload staged images to server (dedicated endpoint)
  const handleUploadImages = async () => {
    if (!id || stagedFiles.length === 0) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      stagedFiles.forEach(({ file }) => formData.append('images', file));
      formData.append('existingImages', JSON.stringify(savedImages));

      const { data } = await api.patch(`/products/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSavedImages(data.images || []);
      stagedFiles.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setStagedFiles([]);
      toast.success(`${stagedFiles.length} image(s) uploaded!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploadingImages(false);
    }
  };

  const addSpec = () => {
    if (!newSpec.key || !newSpec.value) return;
    setForm({ ...form, specs: { ...form.specs, [newSpec.key]: newSpec.value } });
    setNewSpec({ key: '', value: '' });
  };

  const removeSpec = (key) => {
    const s = { ...form.specs };
    delete s[key];
    setForm({ ...form, specs: s });
  };

  const addCompat = () => {
    if (!newCompat) return;
    setForm({ ...form, compatibility: [...form.compatibility, newCompat] });
    setNewCompat('');
  };

  const removeCompat = (idx) => {
    setForm({ ...form, compatibility: form.compatibility.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'specs' || key === 'compatibility') {
          formData.append(key, JSON.stringify(form[key]));
        } else {
          formData.append(key, form[key]);
        }
      });

      // Attach staged files if any (for new product creation)
      stagedFiles.forEach(({ file }) => formData.append('images', file));

      // For edits, also persist the current savedImages order
      if (isEdit && savedImages.length > 0) {
        formData.append('existingImages', JSON.stringify(savedImages));
      }

      if (isEdit) {
        await api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product Updated!');
      } else {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('New Product Added!');
      }
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Loading...</p>
    </div>
  );

  const totalImages = savedImages.length + stagedFiles.length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="w-12 h-12 rounded-2xl bg-white border border-secondary-100 flex items-center justify-center text-secondary-400 hover:text-secondary-950 transition-all shadow-sm">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 mb-1">Admin Console</p>
              <h1 className="text-3xl font-display font-black text-secondary-950 tracking-tight">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin" className="px-6 py-4 bg-white text-secondary-500 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-secondary-100 hover:bg-secondary-50 transition-all">
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-4 bg-secondary-950 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

          {/* ── Main Info ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Basic Info */}
            <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-secondary-50 pb-6">
                <div className="w-8 h-8 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary-400">
                  <Box size={16} />
                </div>
                <h2 className="text-lg font-display font-black text-secondary-950">Basic Information</h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Component Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                    placeholder="e.g. Forged Racing Piston Kit"
                    className="w-full px-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-900 transition-all font-bold text-sm outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Category</label>
                    <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                      placeholder="e.g. Engine"
                      className="w-full px-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-900 transition-all font-bold text-sm outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Brand</label>
                    <input type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})}
                      placeholder="e.g. ELLA MOTOR PARTS"
                      className="w-full px-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-900 transition-all font-bold text-sm outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Price (₱)</label>
                    <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                      className="w-full px-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-900 transition-all font-bold text-sm outline-none font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Stock</label>
                    <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                      className="w-full px-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-900 transition-all font-bold text-sm outline-none font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">SKU</label>
                    <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})}
                      placeholder="HUB-XXX"
                      className="w-full px-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-900 transition-all font-bold text-sm outline-none font-mono uppercase" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4}
                    placeholder="Describe the component's unique features..."
                    className="w-full px-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-900 transition-all font-bold text-sm outline-none resize-none" />
                </div>
              </div>
            </div>

            {/* Specs */}
            <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8 border-b border-secondary-50 pb-6">
                <div className="w-8 h-8 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary-400">
                  <Info size={16} />
                </div>
                <h2 className="text-lg font-display font-black text-secondary-950">Technical Specs</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <input type="text" placeholder="Key (e.g. Material)" value={newSpec.key} onChange={e => setNewSpec({...newSpec, key: e.target.value})}
                  className="px-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-950 transition-all text-sm font-bold outline-none" />
                <div className="flex gap-2">
                  <input type="text" placeholder="Value (e.g. Aluminum)" value={newSpec.value} onChange={e => setNewSpec({...newSpec, value: e.target.value})}
                    className="flex-1 px-6 py-4 bg-secondary-50/50 rounded-2xl border border-transparent focus:bg-white focus:border-secondary-950 transition-all text-sm font-bold outline-none" />
                  <button type="button" onClick={addSpec} className="px-5 bg-secondary-950 text-white rounded-2xl hover:bg-black transition-all">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(form.specs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-secondary-50/50 p-4 pl-6 rounded-2xl border border-secondary-50 group hover:border-secondary-200 transition-all">
                    <div>
                      <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest mb-1">{key}</p>
                      <p className="text-sm font-black text-secondary-900">{value}</p>
                    </div>
                    <button type="button" onClick={() => removeSpec(key)} className="w-8 h-8 rounded-lg text-secondary-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="space-y-8">

            {/* ── IMAGE MANAGER ── */}
            <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-secondary-50 pb-4">
                <h2 className="text-lg font-display font-black text-secondary-950">Photos</h2>
                <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                  {totalImages}/10
                </span>
              </div>

              {/* Saved Images Grid */}
              {savedImages.length > 0 && (
                <div className="mb-6">
                  <p className="text-[9px] font-black uppercase tracking-widest text-secondary-400 mb-3">Saved Photos</p>
                  <div className="grid grid-cols-3 gap-3">
                    {savedImages.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden bg-secondary-50 border border-secondary-100">
                        <img src={resolveUrl(img)} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <div className="absolute top-1.5 left-1.5 bg-primary-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                            <Star size={8} /> Main
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {idx !== 0 && (
                            <button type="button" onClick={() => setPrimaryImage(idx)}
                              className="w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center" title="Set as main">
                              <Star size={12} />
                            </button>
                          )}
                          <button type="button" onClick={() => removeSavedImage(idx)}
                            className="w-7 h-7 bg-rose-600 text-white rounded-full flex items-center justify-center" title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staged (not yet uploaded) Files */}
              {stagedFiles.length > 0 && (
                <div className="mb-6">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                    Ready to Upload ({stagedFiles.length})
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {stagedFiles.map((staged, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden bg-secondary-50 border-2 border-dashed border-amber-300">
                        <img src={staged.preview} alt={`Staged ${idx}`} className="w-full h-full object-cover opacity-80" />
                        <button type="button" onClick={() => removeStagedFile(idx)}
                          title="Delete staged photo"
                          className="absolute top-1 right-1 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              {totalImages < 10 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-secondary-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all group mb-4"
                >
                  <Upload size={28} className="text-secondary-300 group-hover:text-primary-500 mb-3 transition-colors" strokeWidth={1.5} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 group-hover:text-primary-600 transition-colors">
                    Click to add photos
                  </p>
                  <p className="text-[9px] text-secondary-300 mt-1">PNG, JPG, WebP — up to 5MB each</p>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
                </div>
              )}

              {/* Upload Now button (only in edit mode with staged files) */}
              {isEdit && stagedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={handleUploadImages}
                  disabled={uploadingImages}
                  className="w-full py-3 bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload size={14} />
                  {uploadingImages ? 'Uploading...' : `Upload ${stagedFiles.length} Photo(s) Now`}
                </button>
              )}

              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={10} /> Pro Tip
                </p>
                <p className="text-[10px] text-emerald-600 leading-relaxed">
                  First photo is the main display image. Hover photos to set main or delete.
                </p>
              </div>
            </div>

            {/* Curation */}
            <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-display font-black text-secondary-950 mb-6 border-b border-secondary-50 pb-4">Curation</h2>
              <div
                onClick={() => setForm({...form, featured: !form.featured})}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  form.featured ? 'bg-primary-50 border-primary-100' : 'bg-secondary-50/50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.featured ? 'bg-primary-500 text-white' : 'bg-white text-secondary-300'}`}>
                    <Tag size={14} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${form.featured ? 'text-primary-700' : 'text-secondary-400'}`}>Featured</span>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${form.featured ? 'bg-primary-500' : 'bg-secondary-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.featured ? 'left-5' : 'left-1'}`} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
