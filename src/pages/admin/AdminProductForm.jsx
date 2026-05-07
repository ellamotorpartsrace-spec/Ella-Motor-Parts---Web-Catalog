import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Image as ImageIcon, Trash2, Plus, Info,
  CheckCircle2, Box, Tag, Upload, X, Star, Lock,
  ChevronRight, Sparkles, Layers, ListChecks, MessageSquare
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { IMAGE_URL } from '../../utils/constants';

// Helper: Parse images safely
function parseImages(imageField) {
  if (!imageField || imageField === '/images/default-product.png') return [];
  if (Array.isArray(imageField)) return imageField;
  
  try {
    if (typeof imageField === 'string') {
      if (imageField.startsWith('[') || imageField.startsWith('{')) {
        const parsed = JSON.parse(imageField);
        if (Array.isArray(parsed)) return parsed;
        return [imageField];
      }
      if (imageField.includes(',')) {
        return imageField.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [imageField];
    }
  } catch (e) {
    console.error('Image parse error:', e);
  }
  return typeof imageField === 'string' ? [imageField] : [];
}

// Helper: Resolve image URLs
function resolveUrl(img) {
  if (!img) return '/images/default-product.png';
  if (img.startsWith('http')) return img;
  if (img.startsWith('/uploads')) return `${IMAGE_URL}${img}`;
  if (img.startsWith('/images')) return img;
  return img;
}

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [savedImages, setSavedImages] = useState([]);
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
      if (!data || !data.product) throw new Error('Product not found');
      
      const p = data.product;
      
      // Safe parsing for specs and compatibility
      let specs = {};
      try {
        specs = typeof p.specs === 'string' ? JSON.parse(p.specs) : (p.specs || {});
      } catch (e) { console.error('Specs parse error', e); specs = {}; }

      let compatibility = [];
      try {
        compatibility = typeof p.compatibility === 'string' ? JSON.parse(p.compatibility) : (p.compatibility || []);
      } catch (e) { console.error('Compatibility parse error', e); compatibility = []; }

      setForm({
        ...p,
        specs: specs && typeof specs === 'object' ? specs : {},
        compatibility: Array.isArray(compatibility) ? compatibility : [],
        featured: p.featured === 1 || p.featured === true
      });
      
      setSavedImages(parseImages(p.image));
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load product details.');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (savedImages.length + stagedFiles.length + files.length > 10) {
      toast.error('Maximum 10 images allowed.');
      return;
    }

    const newStaged = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setStagedFiles(prev => [...prev, ...newStaged]);
    e.target.value = ''; 
  };

  const removeStagedFile = (idx) => {
    setStagedFiles(prev => {
      const target = prev[idx];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeSavedImage = (idx) => {
    setSavedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const setPrimaryImage = (idx) => {
    setSavedImages(prev => {
      const reordered = [...prev];
      const [primary] = reordered.splice(idx, 1);
      return [primary, ...reordered];
    });
  };

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

      setSavedImages(parseImages(data.images));
      stagedFiles.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setStagedFiles([]);
      toast.success(`${stagedFiles.length} image(s) added successfully!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload images.');
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
    if (e && e.preventDefault) e.preventDefault();
    
    if (!form.name || !form.sku) {
      toast.error('Product Name and SKU are required.');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      
      // Prepare form data
      Object.keys(form).forEach(key => {
        if (key === 'specs' || key === 'compatibility') {
          formData.append(key, JSON.stringify(form[key] || (key === 'specs' ? {} : [])));
        } else if (key !== 'image') { // image is handled separately via savedImages/stagedFiles
          formData.append(key, form[key]);
        }
      });

      // Images handling
      stagedFiles.forEach(({ file }) => formData.append('images', file));
      if (isEdit) {
        formData.append('existingImages', JSON.stringify(savedImages));
      }

      if (isEdit) {
        await api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('New product published!');
      }
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary-400">Synchronizing Data...</p>
    </div>
  );

  const totalImages = savedImages.length + stagedFiles.length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] selection:bg-primary-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-500/5 rounded-full blur-3xl -ml-64 -mb-64 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative z-10">
        
        {/* Top Navigation & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <Link 
              to="/admin" 
              className="group w-14 h-14 rounded-2xl bg-white border border-secondary-100 flex items-center justify-center text-secondary-400 hover:text-secondary-950 hover:border-secondary-300 transition-all shadow-sm hover:shadow-md"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500">Inventory Hub</span>
                <ChevronRight size={10} className="text-secondary-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary-400">Editor</span>
              </div>
              <h1 className="text-4xl font-display font-black text-secondary-950 tracking-tight flex items-center gap-4">
                {isEdit ? 'Refine Product' : 'Onboard Component'}
                {isEdit && <span className="text-xs bg-secondary-100 text-secondary-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">ID: {id.slice(0, 8)}</span>}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/admin" className="px-8 py-4 bg-white text-secondary-600 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl border border-secondary-100 hover:bg-secondary-50 transition-all">
              Discard
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="relative group px-10 py-4 bg-secondary-950 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-secondary-950/10 hover:shadow-secondary-950/20 flex items-center gap-3 disabled:opacity-50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600/0 via-primary-600/20 to-primary-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Save size={18} className="relative z-10" /> 
              <span className="relative z-10">{saving ? 'Processing...' : 'Save & Deploy'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Form Content */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-white border border-secondary-100 rounded-2xl w-fit shadow-sm">
              {[
                { id: 'general', label: 'General Info', icon: Sparkles },
                { id: 'technical', label: 'Technical Details', icon: Layers },
                { id: 'compatibility', label: 'Compatibility', icon: ListChecks }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-secondary-950 text-white shadow-lg' : 'text-secondary-400 hover:bg-secondary-50 hover:text-secondary-600'}`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Basic Information Card */}
                  <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-8 lg:p-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary-500" />
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                        <Box size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-black text-secondary-950">Core Identity</h2>
                        <p className="text-xs text-secondary-400 font-medium">Primary product details and classification</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Component Title</label>
                        <input 
                          type="text" 
                          value={form.name} 
                          onChange={e => setForm({...form, name: e.target.value})} 
                          required
                          placeholder="e.g. Forged High-Compression Piston Kit"
                          className="w-full px-8 py-5 bg-secondary-50/50 rounded-3xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold text-base outline-none placeholder:text-secondary-300" 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Market Category</label>
                          <input 
                            type="text" 
                            value={form.category} 
                            onChange={e => setForm({...form, category: e.target.value})}
                            placeholder="e.g. Engine Components"
                            className="w-full px-8 py-5 bg-secondary-50/50 rounded-3xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold text-sm outline-none placeholder:text-secondary-300" 
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Manufacturer / Brand</label>
                          <input 
                            type="text" 
                            value={form.brand} 
                            onChange={e => setForm({...form, brand: e.target.value})}
                            placeholder="e.g. ELLA PERFORMANCE"
                            className="w-full px-8 py-5 bg-secondary-50/50 rounded-3xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold text-sm outline-none placeholder:text-secondary-300" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Price - Read Only in Edit */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                            Price (₱)
                            {isEdit && <span className="flex items-center gap-1 text-[8px] bg-secondary-900 text-white px-2 py-0.5 rounded-full"><Lock size={8} /> POS SYNCED</span>}
                          </label>
                          <div className="relative group">
                            <input 
                              type="number" 
                              value={form.price} 
                              onChange={e => setForm({...form, price: e.target.value})}
                              readOnly={isEdit}
                              className={`w-full px-8 py-5 rounded-3xl border-2 transition-all font-bold text-base outline-none font-mono ${
                                isEdit ? 'bg-secondary-100/50 border-secondary-100 text-secondary-400 cursor-not-allowed' : 'bg-secondary-50/50 border-transparent focus:bg-white focus:border-primary-500'
                              }`} 
                            />
                            {isEdit && (
                              <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Info size={14} className="text-secondary-400 cursor-help" title="Price is managed via the POS system" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stock */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Current Stock</label>
                          <input 
                            type="number" 
                            value={form.stock} 
                            onChange={e => setForm({...form, stock: e.target.value})}
                            className="w-full px-8 py-5 bg-secondary-50/50 rounded-3xl border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold text-base outline-none font-mono" 
                          />
                        </div>

                        {/* SKU - Read Only in Edit */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                            SKU / Identifier
                            {isEdit && <span className="flex items-center gap-1 text-[8px] bg-secondary-900 text-white px-2 py-0.5 rounded-full"><Lock size={8} /> LOCKED</span>}
                          </label>
                          <input 
                            type="text" 
                            value={form.sku} 
                            onChange={e => setForm({...form, sku: e.target.value})}
                            readOnly={isEdit}
                            placeholder="EMP-XXX"
                            className={`w-full px-8 py-5 rounded-3xl border-2 transition-all font-bold text-base outline-none font-mono uppercase ${
                              isEdit ? 'bg-secondary-100/50 border-secondary-100 text-secondary-400 cursor-not-allowed' : 'bg-secondary-50/50 border-transparent focus:bg-white focus:border-primary-500'
                            }`} 
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Narrative Description</label>
                        <textarea 
                          value={form.description} 
                          onChange={e => setForm({...form, description: e.target.value})} 
                          rows={5}
                          placeholder="Craft a compelling story about this component..."
                          className="w-full px-8 py-6 bg-secondary-50/50 rounded-[2rem] border-2 border-transparent focus:bg-white focus:border-primary-500 transition-all font-bold text-sm outline-none resize-none leading-relaxed placeholder:text-secondary-300" 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'technical' && (
                <motion.div
                  key="technical"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-8 lg:p-10 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Layers size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-black text-secondary-950">Specifications</h2>
                        <p className="text-xs text-secondary-400 font-medium">Add technical attributes and performance metrics</p>
                      </div>
                    </div>

                    <div className="bg-secondary-50/50 rounded-3xl p-6 mb-10 border border-secondary-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="Attribute (e.g. Weight)" 
                          value={newSpec.key} 
                          onChange={e => setNewSpec({...newSpec, key: e.target.value})}
                          className="px-6 py-4 bg-white rounded-2xl border-2 border-transparent focus:border-primary-500 transition-all text-sm font-bold outline-none" 
                        />
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            placeholder="Value (e.g. 1.2kg)" 
                            value={newSpec.value} 
                            onChange={e => setNewSpec({...newSpec, value: e.target.value})}
                            className="flex-1 px-6 py-4 bg-white rounded-2xl border-2 border-transparent focus:border-primary-500 transition-all text-sm font-bold outline-none" 
                          />
                          <button 
                            type="button" 
                            onClick={addSpec} 
                            className="w-14 h-14 bg-secondary-950 text-white rounded-2xl hover:bg-black transition-all flex items-center justify-center shadow-lg active:scale-95"
                          >
                            <Plus size={24} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(form.specs || {}).map(([key, value]) => (
                        <motion.div 
                          layout
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={key} 
                          className="flex items-center justify-between bg-white p-5 pl-7 rounded-[1.5rem] border border-secondary-100 group hover:border-primary-200 hover:shadow-sm transition-all"
                        >
                          <div>
                            <p className="text-[9px] font-black text-secondary-300 uppercase tracking-[0.2em] mb-1">{key}</p>
                            <p className="text-sm font-black text-secondary-900">{value}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeSpec(key)} 
                            className="w-10 h-10 rounded-xl text-secondary-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </motion.div>
                      ))}
                      {Object.keys(form.specs || {}).length === 0 && (
                        <div className="col-span-full py-12 text-center bg-secondary-50/30 rounded-3xl border border-dashed border-secondary-200">
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">No technical specs defined yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-8 lg:p-10 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-black text-secondary-950">Expert Notes</h2>
                        <p className="text-xs text-secondary-400 font-medium">Installation tips or maintenance advice</p>
                      </div>
                    </div>
                    <textarea 
                      value={form.installation_notes} 
                      onChange={e => setForm({...form, installation_notes: e.target.value})} 
                      rows={4}
                      placeholder="Share professional installation secrets..."
                      className="w-full px-8 py-6 bg-secondary-50/50 rounded-[2rem] border-2 border-transparent focus:bg-white focus:border-emerald-500 transition-all font-bold text-sm outline-none resize-none leading-relaxed" 
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'compatibility' && (
                <motion.div
                  key="compatibility"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-8 lg:p-10 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <ListChecks size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-black text-secondary-950">Bike Compatibility</h2>
                        <p className="text-xs text-secondary-400 font-medium">Link this part to specific motorcycle models</p>
                      </div>
                    </div>

                    <div className="flex gap-4 mb-10">
                      <input 
                        type="text" 
                        placeholder="e.g. Honda TMX 150 (2018-2023)" 
                        value={newCompat} 
                        onChange={e => setNewCompat(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompat())}
                        className="flex-1 px-8 py-5 bg-secondary-50/50 rounded-3xl border-2 border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm outline-none" 
                      />
                      <button 
                        type="button" 
                        onClick={addCompat} 
                        className="w-16 h-16 bg-secondary-950 text-white rounded-3xl hover:bg-black transition-all flex items-center justify-center shadow-lg active:scale-95"
                      >
                        <Plus size={28} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {(form.compatibility || []).map((item, idx) => (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={idx} 
                          className="group flex items-center gap-3 px-6 py-3.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all cursor-default"
                        >
                          <span className="text-xs font-black uppercase tracking-wider">{item}</span>
                          <button 
                            type="button" 
                            onClick={() => removeCompat(idx)} 
                            className="text-blue-300 hover:text-blue-800 transition-colors"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </motion.div>
                      ))}
                      {(form.compatibility || []).length === 0 && (
                        <div className="w-full py-16 text-center border-2 border-dashed border-secondary-100 rounded-[2.5rem]">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-300">No compatible models listed</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Assets & Curation */}
          <div className="lg:col-span-4 space-y-10">
            
            {/* Asset Manager */}
            <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-8 shadow-sm relative group/manager">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-display font-black text-secondary-950">Visual Assets</h2>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-12 bg-secondary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${(totalImages / 10) * 100}%` }} />
                   </div>
                   <span className="text-[10px] font-black text-secondary-400">{totalImages}/10</span>
                </div>
              </div>

              {/* Photos Viewport */}
              <div className="space-y-6">
                {/* Main Image Spotlight */}
                {(savedImages.length > 0 || stagedFiles.length > 0) ? (
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-secondary-50 border border-secondary-100 shadow-inner group/spotlight">
                    <img 
                      src={savedImages.length > 0 ? resolveUrl(savedImages[0]) : stagedFiles[0].preview} 
                      className="w-full h-full object-cover" 
                      alt="Main focus"
                    />
                    <div className="absolute top-4 left-4 bg-secondary-950/80 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Star size={10} className="text-primary-400 fill-primary-400" /> Catalog Hero
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-[2rem] border-2 border-dashed border-secondary-100 flex flex-col items-center justify-center p-8 text-center bg-secondary-50/30">
                    <ImageIcon size={48} className="text-secondary-200 mb-4" strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-300">No assets selected</p>
                  </div>
                )}

                {/* Thumbnails Grid */}
                <div className="grid grid-cols-4 gap-3">
                  {/* Saved Images */}
                  {savedImages.map((img, idx) => (
                    <div key={`saved-${idx}`} className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${idx === 0 ? 'border-primary-500 shadow-lg' : 'border-secondary-50 hover:border-secondary-200'}`}>
                      <img src={resolveUrl(img)} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {idx !== 0 && (
                          <button type="button" onClick={() => setPrimaryImage(idx)} className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg"><Star size={10} /></button>
                        )}
                        <button type="button" onClick={() => removeSavedImage(idx)} className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg"><Trash2 size={10} /></button>
                      </div>
                    </div>
                  ))}
                  {/* Staged Images */}
                  {stagedFiles.map((staged, idx) => (
                    <div key={`staged-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-dashed border-amber-300 group/staged">
                      <img src={staged.preview} className="w-full h-full object-cover opacity-60" alt="" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button type="button" onClick={() => removeStagedFile(idx)} className="w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg"><Trash2 size={10} /></button>
                      </div>
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    </div>
                  ))}
                  {/* Add Placeholder */}
                  {totalImages < 10 && (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-secondary-200 flex items-center justify-center text-secondary-300 hover:border-primary-400 hover:text-primary-500 transition-all bg-secondary-50/50 hover:bg-primary-50/30"
                    >
                      <Plus size={20} />
                    </button>
                  )}
                </div>

                <input 
                  ref={fileInputRef} 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageSelect} 
                  className="hidden" 
                />

                {/* Upload Action */}
                {isEdit && stagedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleUploadImages}
                    disabled={uploadingImages}
                    className="w-full py-4 bg-primary-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary-600/20 active:scale-[0.98]"
                  >
                    <Upload size={16} />
                    {uploadingImages ? 'Deploying...' : `Commit ${stagedFiles.length} Photos`}
                  </button>
                )}
              </div>
            </div>

            {/* Curation & Status */}
            <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-8 shadow-sm">
              <h2 className="text-lg font-display font-black text-secondary-950 mb-8 flex items-center gap-3">
                <Tag size={18} className="text-secondary-400" />
                Promotion
              </h2>
              
              <div 
                onClick={() => setForm({...form, featured: !form.featured})}
                className={`group relative flex items-center justify-between p-6 rounded-[1.75rem] border-2 transition-all cursor-pointer ${
                  form.featured 
                    ? 'bg-primary-50/50 border-primary-500 shadow-lg shadow-primary-500/10' 
                    : 'bg-secondary-50/30 border-transparent hover:border-secondary-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${form.featured ? 'bg-primary-500 text-white shadow-lg' : 'bg-white text-secondary-300 border border-secondary-100'}`}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span className={`block text-xs font-black uppercase tracking-widest ${form.featured ? 'text-primary-700' : 'text-secondary-500'}`}>Featured Item</span>
                    <span className="text-[9px] text-secondary-400 font-medium">Highlight on homepage showroom</span>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${form.featured ? 'bg-primary-500' : 'bg-secondary-200'}`}>
                  <motion.div 
                    animate={{ left: form.featured ? '26px' : '4px' }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" 
                  />
                </div>
              </div>

              <div className="mt-8 p-5 bg-secondary-950 text-white rounded-3xl overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 mb-2 flex items-center gap-2">
                   <Info size={12} /> Sync Status
                </p>
                <p className="text-[11px] leading-relaxed font-medium">
                  Changes to name and description are instant. Price and SKU remain locked to maintain POS integrity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
