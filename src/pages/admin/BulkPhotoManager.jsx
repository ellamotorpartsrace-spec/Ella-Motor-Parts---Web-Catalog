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
  Play,
  History,
  Trash2,
  Check,
  Layers
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkPhotoManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // [{file, id, preview}]
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
      toast.success('SKU Index Downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Stage Files ──
  const stageFiles = (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('Please drop image files only');
      return;
    }
    
    const newPending = imageFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file)
    }));
    
    setPendingFiles(prev => [...prev, ...newPending]);
    toast.success(`Staged ${imageFiles.length} items for matching`);
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
    
    const toastId = toast.loading(`Matching ${totalToUpload} products...`);

    const filesToProcess = [...pendingFiles];
    setPendingFiles([]);

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
          message: data.message || 'Success',
          count: data.count,
          id: item.id
        }, ...prev]);
      } catch (err) {
        const errMsg = err.response?.data?.message || 'Match Failed';
        setUploadStats(prev => ({ ...prev, fail: prev.fail + 1 }));
        setResults(prev => [{
          name: item.file.name,
          status: 'error',
          message: errMsg,
          id: item.id
        }, ...prev]);
      } finally {
        URL.revokeObjectURL(item.preview);
      }
    }

    toast.dismiss(toastId);
    toast.success('Batch Processing Complete');
    setIsUploading(false);
  };

  // ── Drag & Drop ──
  const handleDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) stageFiles(e.dataTransfer.files);
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-600 mb-2 italic">Product Catalog Sync</p>
          <h1 className="text-4xl font-display font-black text-secondary-950 tracking-tight">Bulk SKU Matcher</h1>
          <p className="text-secondary-500 font-medium">Automatic image-to-product pairing using file names.</p>
        </div>
        
        <button
          onClick={handleExportSKUs}
          disabled={isExporting}
          className="flex items-center gap-3 px-8 py-4 bg-white border border-secondary-200 text-secondary-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm group"
        >
          {isExporting ? <ArrowClockwise className="animate-spin" size={16} /> : <FileCsv className="group-hover:scale-110 transition-transform" size={18} />}
          Download SKU Index
        </button>
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Main Workspace (8 Cols) ── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Progress / Info Bar */}
          {isUploading && (
            <div className="bg-white rounded-3xl p-8 border border-secondary-100 shadow-xl shadow-secondary-900/5 overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center animate-pulse">
                    <ArrowClockwise className="animate-spin" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-secondary-950 leading-none mb-1">Processing Batch</h3>
                    <p className="text-xs font-bold text-secondary-400">Step {uploadStats.current} of {uploadStats.total}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-black text-primary-600 leading-none mb-1">{Math.round((uploadStats.current / uploadStats.total) * 100)}%</p>
                  <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Protocol Active</p>
                </div>
              </div>
              <div className="w-full h-3 bg-secondary-50 rounded-full overflow-hidden border border-secondary-100">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(uploadStats.current / uploadStats.total) * 100}%` }}
                  className="h-full bg-gradient-to-r from-primary-600 to-rose-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                />
              </div>
            </div>
          )}

          {/* Staging & Drop Zone */}
          <div className="bg-white rounded-[2.5rem] border border-secondary-100 shadow-xl shadow-secondary-900/5 overflow-hidden">
            
            {/* Header of Workspace */}
            <div className="px-10 py-6 border-b border-secondary-50 flex items-center justify-between bg-secondary-50/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-secondary-100 flex items-center justify-center shadow-sm">
                  <Layers className="text-primary-600" size={14} />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary-950">Matching Terminal</h3>
              </div>
              {pendingFiles.length > 0 && !isUploading && (
                <button onClick={clearPending} className="text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-rose-600 transition-colors">Discard Queue</button>
              )}
            </div>

            <div className="p-10">
              <AnimatePresence mode="wait">
                {pendingFiles.length === 0 && !isUploading ? (
                  <motion.div
                    key="dropzone"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      aspect-[16/7] rounded-[2rem] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-12 group cursor-pointer relative overflow-hidden
                      ${dragActive ? 'border-primary-500 bg-primary-50 scale-[1.01]' : 'border-secondary-100 bg-secondary-50/30 hover:border-secondary-300 hover:bg-secondary-50/60'}
                    `}
                  >
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => stageFiles(e.target.files)} />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-white text-secondary-300 flex items-center justify-center mb-6 shadow-xl shadow-secondary-900/5 group-hover:text-primary-500 group-hover:scale-110 transition-all duration-500 border border-secondary-100">
                        <CloudArrowUp size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-display font-black text-secondary-950 mb-2">Drop Product Images</h3>
                      <p className="text-secondary-400 text-[10px] font-black uppercase tracking-widest">Supports multiple JPG, PNG, WebP</p>
                    </div>

                    {dragActive && (
                      <div className="absolute inset-0 bg-primary-500/5 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <div className="bg-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in zoom-in-95 duration-200 border border-primary-100">
                          <Check className="text-primary-600" size={20} strokeWidth={3} />
                          <span className="font-black text-primary-600 uppercase tracking-widest text-xs">Ready to Stage</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="staging"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-10"
                  >
                    {!isUploading && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar pb-4">
                        {pendingFiles.map((item) => (
                          <div key={item.id} className="group relative aspect-square rounded-[1.5rem] bg-secondary-50 border border-secondary-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                            <img src={item.preview} alt="Queue" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-secondary-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                              <p className="text-[8px] font-black text-white uppercase tracking-tighter text-center line-clamp-3">{item.file.name}</p>
                            </div>
                            <button 
                              onClick={() => removePendingFile(item.id)}
                              className="absolute top-2 right-2 w-7 h-7 bg-white text-secondary-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:text-rose-600 hover:scale-110 shadow-lg border border-secondary-100"
                            >
                              <X size={12} strokeWidth={3} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isUploading && (
                      <div className="flex flex-col items-center gap-4 pt-10 border-t border-secondary-50">
                        <button
                          onClick={startUpload}
                          className="w-full md:w-auto flex items-center justify-center gap-4 px-16 py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 shadow-xl shadow-primary-600/30 active:scale-[0.98]"
                        >
                          <Play size={18} fill="white" />
                          Commit Batch to Server
                        </button>
                        <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest text-center">Batch total: {pendingFiles.length} items staged</p>
                      </div>
                    )}

                    {isUploading && (
                      <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-full border-4 border-secondary-50 border-t-primary-600 animate-spin mb-8" />
                        <h4 className="text-xl font-display font-black text-secondary-950 mb-2">Syncing Data Nodes</h4>
                        <p className="text-secondary-400 text-sm font-medium">Matching names with SKU records...</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Guide Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 border border-secondary-100 shadow-sm flex items-start gap-6 group hover:border-primary-500/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 text-primary-600 border border-primary-100">
                <Info size={22} />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-secondary-950 uppercase tracking-widest mb-1">Naming Standard</h4>
                <p className="text-xs text-secondary-500 font-medium leading-relaxed">Files like <span className="text-primary-600 font-bold">MT-123(1).jpg</span> and <span className="text-primary-600 font-bold">MT-123.png</span> both pair with SKU <span className="text-primary-600 font-bold">MT-123</span>.</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-8 border border-secondary-100 shadow-sm flex items-start gap-6 group hover:border-rose-500/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 text-rose-600 border border-rose-100">
                <Package size={22} />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-secondary-950 uppercase tracking-widest mb-1">Queue Limits</h4>
                <p className="text-xs text-secondary-500 font-medium leading-relaxed">Each SKU can store <span className="font-bold text-rose-600">10 images</span> max. Additional uploads for full products will be skipped.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Monitor / History (4 Cols) ── */}
        <div className="lg:col-span-4 sticky top-32">
          <div className="bg-white rounded-[2.5rem] border border-secondary-100 shadow-xl shadow-secondary-900/5 overflow-hidden flex flex-col max-h-[850px]">
            <div className="px-8 py-8 border-b border-secondary-50 bg-secondary-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary-400 mb-2">Live Logs</h3>
                <p className="text-3xl font-display font-black text-secondary-950">{results.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-secondary-100 flex items-center justify-center shadow-sm">
                <History className="text-secondary-300" size={20} />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {results.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-30 grayscale">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-secondary-200 flex items-center justify-center mb-4">
                    <History size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Monitor Standby</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {results.map((res) => (
                    <motion.div 
                      key={res.id || Math.random()}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-5 rounded-2xl border transition-all duration-300 ${
                        res.status === 'success' ? 'bg-white border-secondary-100 hover:border-emerald-200' : 'bg-rose-50/30 border-rose-100'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${res.status === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-100 text-rose-600'}`}>
                          {res.status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[8px] font-black text-secondary-400 uppercase tracking-widest truncate">{res.name}</p>
                            {res.count && <span className="text-[8px] font-black text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">{res.count}/10</span>}
                          </div>
                          <h4 className="text-[12px] font-black leading-tight text-secondary-900 mb-2 truncate">{res.status === 'success' ? res.product : res.message}</h4>
                          {res.sku && (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-rose-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm shadow-rose-600/20">SKU</span>
                              <span className="text-[10px] font-mono font-black text-rose-600">{res.sku}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            
            {results.length > 0 && (
              <div className="p-6 border-t border-secondary-50 bg-secondary-50/10">
                <button onClick={() => setResults([])} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-rose-600 transition-colors">Clear Protocol Logs</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
