import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Star, CheckCircle2, Image as ImageIcon, Camera, Trash2, Plus } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { IMAGE_URL } from '../../utils/constants';

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

function resolveUrl(img) {
  if (!img) return '/images/default-product.png';
  if (img.startsWith('http')) return img;
  if (img.startsWith('/uploads')) return `${IMAGE_URL}${img}`;
  if (img.startsWith('/images')) return img;
  return img;
}

export default function AdminPhotoManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [savedImages, setSavedImages] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]); // [{file, preview}]

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
      setSavedImages(parseImages(data.product.image));
    } catch {
      toast.error('Product not found.');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newStaged = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setStagedFiles(prev => [...prev, ...newStaged]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    const newStaged = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setStagedFiles(prev => [...prev, ...newStaged]);
  };

  const removeStagedFile = (idx) => {
    setStagedFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeSavedImage = async (idx) => {
    const updated = savedImages.filter((_, i) => i !== idx);
    await saveImages(updated);
  };

  const setPrimaryImage = async (idx) => {
    const reordered = [...savedImages];
    const [primary] = reordered.splice(idx, 1);
    await saveImages([primary, ...reordered]);
  };

  // Save an already-known list of URLs (for reorder / remove operations)
  const saveImages = async (imageList) => {
    try {
      const formData = new FormData();
      formData.append('existingImages', JSON.stringify(imageList));
      const { data } = await api.patch(`/products/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSavedImages(data.images || []);
      toast.success('Photos updated!');
    } catch {
      toast.error('Failed to update photos.');
    }
  };

  const handleUpload = async () => {
    if (!stagedFiles.length) return;
    setUploading(true);
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
      toast.success(`${stagedFiles.length} photo(s) uploaded successfully!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 animate-pulse">Loading...</p>
    </div>
  );

  const totalImages = savedImages.length + stagedFiles.length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <Link to="/admin" className="inline-flex items-center gap-3 text-secondary-400 hover:text-secondary-950 transition-colors mb-10 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Dashboard</span>
        </Link>

        {/* Product Info Header */}
        <div className="bg-white rounded-[2.5rem] border border-secondary-100 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-secondary-50 border border-secondary-100 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Camera size={24} className="text-secondary-300" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-1">Photo Manager</p>
              <h1 className="text-xl font-display font-black text-secondary-950 leading-tight break-words">{product?.name}</h1>
              <p className="text-[10px] font-mono text-secondary-400 font-bold uppercase mt-1">SKU: {product?.sku} · {product?.category}</p>
            </div>
            <div className="sm:ml-auto text-center sm:text-right shrink-0 mt-2 sm:mt-0 border-t sm:border-t-0 border-secondary-100 pt-4 sm:pt-0">
              <p className="text-3xl font-display font-black text-secondary-950">{savedImages.length}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Photos</p>
            </div>
          </div>
        </div>

        {/* Unified Gallery Manager Card */}
        <div 
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="bg-white rounded-[2.5rem] border border-secondary-100 shadow-sm overflow-hidden mb-8 flex flex-col p-6 sm:p-8 relative group"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-sm font-display font-black text-secondary-950 uppercase tracking-wider mb-1">Photo Gallery</h2>
              <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest hidden sm:block">Drag & drop photos anywhere in this card</p>
            </div>
            <span className="text-[10px] font-black text-secondary-500 uppercase tracking-widest bg-secondary-50 px-3 py-1.5 rounded-lg border border-secondary-100">
              {totalImages} / 10 Photos
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {/* 1. Saved Photos */}
            {savedImages.map((img, idx) => (
              <div key={`saved-${idx}`} className="relative group/photo aspect-square rounded-2xl overflow-hidden bg-secondary-50 border border-secondary-100 shadow-sm">
                <img src={resolveUrl(img)} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                
                {idx === 0 && (
                  <div className="absolute top-2 left-2 bg-primary-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1 shadow-md">
                    <Star size={8} fill="white" /> Main
                  </div>
                )}

                <div className="absolute inset-0 bg-secondary-950/60 opacity-0 group-hover/photo:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                  {idx !== 0 && (
                    <button
                      onClick={() => setPrimaryImage(idx)}
                      title="Set as main photo"
                      className="w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg"
                    >
                      <Star size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => removeSavedImage(idx)}
                    title="Delete photo"
                    className="w-8 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {/* 2. Staged (Ready to Upload) Photos */}
            {stagedFiles.map((staged, idx) => (
              <div key={`staged-${idx}`} className="relative group/staged aspect-square rounded-2xl overflow-hidden bg-white border-2 border-dashed border-amber-300">
                <img src={staged.preview} alt={`New ${idx}`} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-amber-500/20" />
                <button
                  onClick={() => removeStagedFile(idx)}
                  title="Remove staged photo"
                  className="absolute top-2 right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/staged:opacity-100 transition-opacity shadow-md"
                >
                  <Trash2 size={10} />
                </button>
                <div className="absolute bottom-2 left-0 right-0 text-center">
                   <span className="text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">New</span>
                </div>
              </div>
            ))}

            {/* 3. Add Photo Button Tile */}
            {totalImages < 10 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-secondary-200 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all group/add"
              >
                <div className="w-8 h-8 rounded-full bg-secondary-50 group-hover/add:bg-primary-100 flex items-center justify-center mb-2 transition-colors">
                  <Plus size={16} className="text-secondary-400 group-hover/add:text-primary-600" strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-black text-secondary-400 group-hover/add:text-primary-600 uppercase tracking-widest">Add Photo</span>
              </div>
            )}
          </div>

          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />

          {/* Upload Action */}
          {stagedFiles.length > 0 && (
            <div className="mt-8 pt-8 border-t border-secondary-50">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full sm:w-auto mx-auto sm:px-12 py-4 bg-secondary-950 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-secondary-950/20"
              >
                <Upload size={16} />
                {uploading ? 'Uploading...' : `Upload ${stagedFiles.length} New Photo${stagedFiles.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>

        {/* Tip */}
        {savedImages.length === 0 && stagedFiles.length === 0 && (
          <div className="mt-6 p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
            <ImageIcon size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
              This product has no photos yet. Upload clear, well-lit photos for best results. The first photo will be shown in the catalog.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
