import { useState, useRef } from 'react';
import { 
  Upload as CloudArrowUp, 
  FileText as FileCsv, 
  CheckCircle2 as CheckCircle, 
  X as XCircle, 
  RefreshCw as ArrowClockwise, 
  Info,
  Package,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function BulkPhotoManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadStats, setUploadStats] = useState({ total: 0, current: 0, success: 0, fail: 0 });
  const fileInputRef = useRef(null);

  // ── CSV Export ──
  const handleExportSKUs = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/products/export/skus', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ella_product_skus.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('SKU list downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export SKUs');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Upload Logic ──
  const processFiles = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('No valid images found');
      return;
    }

    setIsUploading(true);
    setUploadStats({ total: imageFiles.length, current: 0, success: 0, fail: 0 });
    
    const toastId = toast.loading(`Starting batch upload of ${imageFiles.length} files...`);

    // We process sequentially to prevent race conditions on products with multiple images
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setUploadStats(prev => ({ ...prev, current: i + 1 }));
      
      const formData = new FormData();
      formData.append('image', file);

      try {
        const { data } = await api.patch('/products/bulk/image-by-sku', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setUploadStats(prev => ({ ...prev, success: prev.success + 1 }));
        setResults(prev => [{
          name: file.name,
          sku: data.sku,
          status: 'success',
          product: data.productName,
          message: data.message || 'Matched & Uploaded',
          count: data.count
        }, ...prev]);
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        const errMsg = err.response?.data?.message || 'Upload failed';
        setUploadStats(prev => ({ ...prev, fail: prev.fail + 1 }));
        setResults(prev => [{
          name: file.name,
          status: 'error',
          message: errMsg
        }, ...prev]);
      }
    }

    toast.dismiss(toastId);
    toast.success('Batch processing complete!', { duration: 5000 });
    setIsUploading(false);
  };

  // ── Drag & Drop Handlers ──
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 italic">Inventory Management</p>
          <h1 className="text-4xl font-display font-black text-secondary-950 tracking-tight">
            Bulk SKU Matcher
          </h1>
          <p className="text-secondary-500 font-medium text-sm">
            Drag images named as SKUs. Multiple images per SKU will be appended (Limit 10).
          </p>
        </div>
        
        <button
          onClick={handleExportSKUs}
          disabled={isExporting}
          className="flex items-center gap-3 px-6 py-3.5 bg-secondary-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-secondary-950/20 disabled:opacity-50 group"
        >
          {isExporting ? <ArrowClockwise className="animate-spin" size={16} /> : <FileCsv size={18} className="group-hover:scale-110 transition-transform" />}
          Download SKU Cheat-Sheet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Left Column: Upload Zone ── */}
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative aspect-[16/8] md:aspect-[16/7] rounded-[2.5rem] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden
              ${dragActive ? 'border-primary-500 bg-primary-50 scale-[1.01]' : 'border-secondary-200 bg-white hover:border-secondary-400 hover:bg-secondary-50/30'}
              ${isUploading ? 'cursor-wait' : 'cursor-pointer'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => processFiles(e.target.files)}
            />
            
            {/* Background Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <ImageIcon size={300} />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 ${isUploading ? 'bg-primary-600 text-white animate-pulse' : 'bg-white border border-secondary-100 text-secondary-400'}`}>
                {isUploading ? (
                  <ArrowClockwise className="animate-spin" size={40} />
                ) : (
                  <CloudArrowUp size={48} strokeWidth={1.5} />
                )}
              </div>
              
              <h3 className="text-2xl font-display font-black text-secondary-950 mb-2">
                {isUploading ? `Uploading (${uploadStats.current}/${uploadStats.total})` : 'Drop Images Here'}
              </h3>
              <p className="text-secondary-400 text-sm font-bold max-w-xs leading-relaxed">
                Images must match the SKU name exactly. <br/>
                <span className="text-secondary-900 italic">e.g. MT-123.jpg, MT-123(1).png</span>
              </p>

              {isUploading && (
                <div className="w-64 h-2 bg-secondary-100 rounded-full mt-8 overflow-hidden">
                  <div 
                    className="h-full bg-primary-600 transition-all duration-300"
                    style={{ width: `${(uploadStats.current / uploadStats.total) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {dragActive && (
              <div className="absolute inset-0 bg-primary-500/10 backdrop-blur-[4px] rounded-[2.5rem] border-4 border-primary-500 flex items-center justify-center z-20">
                <div className="bg-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in zoom-in-95 duration-200">
                  <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center">
                    <CloudArrowUp size={20} />
                  </div>
                  <span className="font-black text-primary-600 uppercase tracking-widest text-sm">
                    Release to Start Match
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Optimized Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-6 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <Info size={24} className="text-amber-600" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1">Naming Logic</h4>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  We match base filenames. <span className="font-bold">MT-123 (1).jpg</span> and <span className="font-bold">MT-123.png</span> both link to SKU <span className="font-bold">MT-123</span>.
                </p>
              </div>
            </div>
            <div className="bg-primary-50/50 border border-primary-100 rounded-[2rem] p-6 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
                <Package size={24} className="text-primary-600" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-primary-900 uppercase tracking-widest mb-1">Capacity Limit</h4>
                <p className="text-xs text-primary-800 font-medium leading-relaxed">
                  Products can hold up to <span className="font-bold">10 images</span>. Excess uploads for the same SKU will be skipped.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Activity Log ── */}
        <div className="bg-white rounded-[2.5rem] border border-secondary-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden h-[600px] lg:h-auto">
          <div className="px-8 py-6 border-b border-secondary-50 flex items-center justify-between bg-secondary-50/30">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 flex items-center gap-2 mb-1">
                <ArrowClockwise size={12} className={isUploading ? 'animate-spin' : ''} />
                Match History
              </h3>
              <p className="text-xl font-display font-black text-secondary-950">{results.length}</p>
            </div>
            {results.length > 0 && (
              <button
                onClick={() => setResults([])}
                className="text-[9px] font-black uppercase tracking-widest text-secondary-400 hover:text-rose-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <div className="w-20 h-20 rounded-full border-4 border-dashed border-secondary-200 flex items-center justify-center mb-4">
                  <Package size={32} className="text-secondary-200" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">No matching activity yet</p>
              </div>
            ) : (
              results.map((res, i) => (
                <div 
                  key={i}
                  className={`p-5 rounded-2xl border flex items-start gap-4 transition-all animate-in slide-in-from-right-4 duration-300 group ${
                    res.status === 'success' ? 'bg-white border-secondary-100 hover:border-emerald-200' : 'bg-rose-50/30 border-rose-100'
                  }`}
                >
                  <div className={`mt-1 shrink-0 ${res.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {res.status === 'success' ? <CheckCircle size={22} strokeWidth={2.5} /> : <AlertCircle size={22} strokeWidth={2.5} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[9px] font-black text-secondary-400 uppercase tracking-tighter truncate">
                        {res.name}
                      </p>
                      {res.count && (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {res.count}/10
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-black text-secondary-950 leading-tight truncate">
                      {res.status === 'success' ? res.product : res.message}
                    </p>
                    {res.sku && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-black tracking-widest uppercase">SKU</span>
                        <span className="text-[10px] font-mono font-black text-rose-600">{res.sku}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {isUploading && (
            <div className="p-6 bg-secondary-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowClockwise className="animate-spin text-primary-500" size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Processing Batch...</span>
              </div>
              <span className="text-[10px] font-black">{Math.round((uploadStats.current / uploadStats.total) * 100)}%</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
