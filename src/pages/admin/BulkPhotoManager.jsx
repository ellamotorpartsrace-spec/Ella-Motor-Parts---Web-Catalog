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
  AlertCircle,
  X,
  Play
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function BulkPhotoManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // [{file, id}]
  const [results, setResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadStats, setUploadStats] = useState({ total: 0, current: 0, success: 0, fail: 0 });
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

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

  // ── Stage Files ──
  const stageFiles = (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('No valid images found');
      return;
    }
    
    const newPending = imageFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file)
    }));
    
    setPendingFiles(prev => [...prev, ...newPending]);
    toast.success(`Staged ${imageFiles.length} images`);
  };

  const removePendingFile = (id) => {
    setPendingFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const clearPending = () => {
    pendingFiles.forEach(f => URL.revokeObjectURL(f.preview));
    setPendingFiles([]);
  };

  // ── Upload Logic ──
  const startUpload = async () => {
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    const totalToUpload = pendingFiles.length;
    setUploadStats({ total: totalToUpload, current: 0, success: 0, fail: 0 });
    
    const toastId = toast.loading(`Uploading ${totalToUpload} files...`);

    // Process sequentially to prevent race conditions
    const filesToProcess = [...pendingFiles];
    setPendingFiles([]); // Clear pending as we start

    for (let i = 0; i < filesToProcess.length; i++) {
      const item = filesToProcess[i];
      setUploadStats(prev => ({ ...prev, current: i + 1 }));
      
      const formData = new FormData();
      formData.append('image', item.file);

      try {
        const { data } = await api.patch('/products/bulk/image-by-sku', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setUploadStats(prev => ({ ...prev, success: prev.success + 1 }));
        setResults(prev => [{
          name: item.file.name,
          sku: data.sku,
          status: 'success',
          product: data.productName,
          message: data.message || 'Matched & Uploaded',
          count: data.count,
          timestamp: new Date()
        }, ...prev]);
      } catch (err) {
        console.error(`Failed to upload ${item.file.name}:`, err);
        const errMsg = err.response?.data?.message || 'Upload failed';
        setUploadStats(prev => ({ ...prev, fail: prev.fail + 1 }));
        setResults(prev => [{
          name: item.file.name,
          status: 'error',
          message: errMsg,
          timestamp: new Date()
        }, ...prev]);
      } finally {
        URL.revokeObjectURL(item.preview);
      }
    }

    toast.dismiss(toastId);
    toast.success('Batch processing complete!', { duration: 5000 });
    setIsUploading(false);
  };

  // ── Drag & Drop Handlers ──
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      stageFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 italic">Inventory Management</p>
          <h1 className="text-4xl font-display font-black text-secondary-950 tracking-tight">
            Bulk SKU Matcher
          </h1>
          <p className="text-secondary-500 font-medium text-sm">
            Stage images named as SKUs, then click upload to process.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left Column: Upload & Staging (8 Cols) ── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Drop Zone */}
          {!isUploading && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative aspect-[16/7] md:aspect-[16/6] rounded-[2.5rem] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden
                ${dragActive ? 'border-primary-500 bg-primary-50 scale-[1.01]' : 'border-secondary-200 bg-white hover:border-secondary-400 hover:bg-secondary-50/30'}
                cursor-pointer
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => stageFiles(e.target.files)}
              />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <ImageIcon size={300} />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center pointer-events-none">
                <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-secondary-100 text-secondary-400 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                  <CloudArrowUp size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-display font-black text-secondary-950 mb-2">Drop Images Here</h3>
                <p className="text-secondary-400 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  MT-123.jpg, MT-123 (1).png, etc.
                </p>
              </div>

              {dragActive && (
                <div className="absolute inset-0 bg-primary-500/10 backdrop-blur-[4px] rounded-[2.5rem] border-4 border-primary-500 flex items-center justify-center z-20 pointer-events-none">
                  <div className="bg-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in zoom-in-95 duration-200">
                    <CloudArrowUp size={24} className="text-primary-600" />
                    <span className="font-black text-primary-600 uppercase tracking-widest text-sm">Release to Stage</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Staging Area */}
          {(pendingFiles.length > 0 || isUploading) && (
            <div className="bg-white rounded-[2.5rem] border border-secondary-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-8 py-6 border-b border-secondary-50 flex items-center justify-between bg-secondary-50/30">
                <div className="flex items-center gap-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary-950">Queue</h3>
                  <span className="bg-secondary-950 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{isUploading ? uploadStats.total : pendingFiles.length}</span>
                </div>
                {!isUploading && (
                  <button onClick={clearPending} className="text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-rose-600 transition-colors">Clear All</button>
                )}
              </div>

              <div className="p-6">
                {isUploading ? (
                  <div className="py-12 flex flex-col items-center text-center max-w-sm mx-auto">
                    <div className="w-20 h-20 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mb-6 relative">
                      <ArrowClockwise className="animate-spin" size={32} />
                      <div className="absolute inset-0 border-4 border-primary-100 rounded-full border-t-primary-600" />
                    </div>
                    <h4 className="text-xl font-display font-black text-secondary-950 mb-2">Uploading Batch</h4>
                    <p className="text-secondary-400 text-sm font-medium mb-8">Processing {uploadStats.current} of {uploadStats.total} images. Please keep this tab open.</p>
                    
                    <div className="w-full h-3 bg-secondary-50 rounded-full overflow-hidden border border-secondary-100 mb-2">
                      <div 
                        className="h-full bg-primary-600 transition-all duration-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                        style={{ width: `${(uploadStats.current / uploadStats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{Math.round((uploadStats.current / uploadStats.total) * 100)}% Complete</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar pb-4">
                      {pendingFiles.map((item) => (
                        <div key={item.id} className="group relative aspect-square rounded-2xl bg-secondary-50 border border-secondary-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                          <img src={item.preview} alt="Pending" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute inset-0 bg-secondary-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                            <p className="text-[9px] font-black text-white uppercase tracking-tighter text-center break-all line-clamp-2">{item.file.name}</p>
                          </div>
                          <button 
                            onClick={() => removePendingFile(item.id)}
                            className="absolute top-2 right-2 w-7 h-7 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-8 border-t border-secondary-50 flex justify-center">
                      <button
                        onClick={startUpload}
                        className="flex items-center gap-3 px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-95"
                      >
                        <Play size={16} fill="white" />
                        Start Matching & Uploading
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Guidelines (Moved to Bottom) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50/50 border border-amber-100 rounded-[2rem] p-6 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <Info size={24} className="text-amber-600" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1">Naming Logic</h4>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Filenames match SKU exactly. <span className="font-bold">MT-123(1).jpg</span> and <span className="font-bold">MT-123.png</span> both link to <span className="font-bold">MT-123</span>.
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
                  Maximum <span className="font-bold">10 images</span> per product. Excess uploads for the same SKU will be skipped.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Activity History (4 Cols) ── */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-[600px]">
          <div className="bg-white rounded-[2.5rem] border border-secondary-100 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="px-8 py-6 border-b border-secondary-50 flex items-center justify-between bg-secondary-50/30">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 mb-1">Recent Activity</h3>
                <p className="text-2xl font-display font-black text-secondary-950">{results.length}</p>
              </div>
              {results.length > 0 && (
                <button
                  onClick={() => setResults([])}
                  className="text-[9px] font-black uppercase tracking-widest text-secondary-400 hover:text-rose-600 transition-colors"
                >
                  Clear Log
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar max-h-[700px]">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-secondary-200 flex items-center justify-center mb-4">
                    <Package size={24} className="text-secondary-200" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">History is empty</p>
                </div>
              ) : (
                results.map((res, i) => (
                  <div 
                    key={i}
                    className={`p-4 rounded-2xl border flex items-start gap-3 transition-all animate-in slide-in-from-right-4 duration-300 ${
                      res.status === 'success' ? 'bg-white border-secondary-100' : 'bg-rose-50/30 border-rose-100'
                    }`}
                  >
                    <div className={`mt-1 shrink-0 ${res.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {res.status === 'success' ? <CheckCircle size={18} strokeWidth={2.5} /> : <AlertCircle size={18} strokeWidth={2.5} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-[8px] font-black text-secondary-400 uppercase tracking-tighter truncate">
                          {res.name}
                        </p>
                        {res.count && (
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            {res.count}/10
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-bold text-secondary-950 leading-tight truncate mb-1.5">
                        {res.status === 'success' ? res.product : res.message}
                      </p>
                      {res.sku && (
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[7px] font-black tracking-widest uppercase">SKU</span>
                          <span className="text-[9px] font-mono font-black text-rose-600 truncate">{res.sku}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
