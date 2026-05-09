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
  Zap,
  Layers,
  History
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
    toast.success(`Ready: ${imageFiles.length} new items staged`);
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
    
    const toastId = toast.loading(`Initiating protocol for ${totalToUpload} images...`);

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
          message: data.message || 'Successfully Matched',
          count: data.count,
          id: item.id
        }, ...prev]);
      } catch (err) {
        console.error(`Failed to upload ${item.file.name}:`, err);
        const errMsg = err.response?.data?.message || 'Protocol Failure';
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
    toast.success('System: Batch Matching Complete');
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
    <div className="min-h-[calc(100vh-100px)] bg-secondary-950 rounded-[3rem] p-6 lg:p-12 relative overflow-hidden text-white shadow-2xl">
      
      {/* ── Background Aesthetics ── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* ── Top Navigation Bar ── */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl">
              <Layers className="text-primary-500" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black tracking-tighter">Bulk SKU <span className="text-primary-500">Matcher</span></h1>
              <p className="text-secondary-400 text-[10px] font-black uppercase tracking-[0.3em]">Advanced Inventory Protocol v2.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportSKUs}
              disabled={isExporting}
              className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl transition-all duration-300 group"
            >
              {isExporting ? <ArrowClockwise className="animate-spin text-secondary-400" size={16} /> : <FileCsv className="text-secondary-400 group-hover:text-white transition-colors" size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest">Get SKU Index</span>
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* ── Left Protocol Zone (7 Cols) ── */}
          <section className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Drop Terminal */}
            {!isUploading && pendingFiles.length === 0 && (
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative aspect-[16/9] rounded-[3rem] border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center p-12 group cursor-pointer overflow-hidden
                  ${dragActive ? 'border-primary-500 bg-primary-500/5 scale-[1.02]' : 'border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-white/20'}
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => stageFiles(e.target.files)} />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center mb-8 shadow-2xl group-hover:shadow-primary-500/20 transition-all duration-500">
                    <CloudArrowUp className="text-primary-500 group-hover:scale-110 transition-transform" size={48} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-display font-black mb-3">Initialize Batch Match</h3>
                  <p className="text-secondary-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                    Drop images named as SKUs here to stage them into the matching protocol
                  </p>
                </div>

                {dragActive && (
                  <div className="absolute inset-0 bg-primary-600/20 backdrop-blur-md flex items-center justify-center z-20 animate-in fade-in duration-300">
                    <div className="bg-white text-secondary-950 px-10 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-5 transform scale-110 transition-transform">
                      <Zap className="text-primary-600 animate-pulse" size={24} fill="currentColor" />
                      <span className="font-display font-black uppercase tracking-widest text-sm">Release to Process</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Staging Terminal */}
            {(pendingFiles.length > 0 || isUploading) && (
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl min-h-[500px]">
                <div className="px-10 py-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Matching Queue</h3>
                    <span className="bg-white/10 text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/10">{isUploading ? uploadStats.total : pendingFiles.length}</span>
                  </div>
                  {!isUploading && (
                    <button onClick={clearPending} className="text-[10px] font-black uppercase tracking-widest text-secondary-500 hover:text-white transition-colors">Abort All</button>
                  )}
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  {isUploading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-10 relative">
                        <ArrowClockwise className="animate-spin text-primary-500" size={48} />
                        <div className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full" />
                      </div>
                      <h4 className="text-2xl font-display font-black mb-3">Syncing with Cloud Node</h4>
                      <p className="text-secondary-400 text-sm font-medium mb-12">Matched: {uploadStats.current} of {uploadStats.total}</p>
                      
                      <div className="w-full max-w-md h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 mb-4 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(uploadStats.current / uploadStats.total) * 100}%` }}
                          className="h-full bg-gradient-to-r from-primary-600 to-rose-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        />
                      </div>
                      <span className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">{Math.round((uploadStats.current / uploadStats.total) * 100)}% Protocol Active</span>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 flex-1 overflow-y-auto pr-4 custom-scrollbar-dark pb-10 max-h-[400px]">
                        <AnimatePresence>
                          {pendingFiles.map((item) => (
                            <motion.div 
                              key={item.id} 
                              layout
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="group relative aspect-square rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl"
                            >
                              <img src={item.preview} alt="Staged" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-secondary-950/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center p-5">
                                <p className="text-[9px] font-black text-white uppercase tracking-tighter text-center line-clamp-3">{item.file.name}</p>
                              </div>
                              <button 
                                onClick={() => removePendingFile(item.id)}
                                className="absolute top-3 right-3 w-8 h-8 bg-rose-600/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:scale-110 shadow-xl"
                              >
                                <X size={14} strokeWidth={3} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
                        <button
                          onClick={startUpload}
                          className="w-full md:w-auto flex items-center justify-center gap-4 px-16 py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 shadow-[0_20px_40px_rgba(220,38,38,0.2)] hover:shadow-primary-600/40 active:scale-[0.98]"
                        >
                          <Play size={18} fill="currentColor" />
                          Execute Protocol
                        </button>
                        <p className="text-[9px] font-black text-secondary-500 uppercase tracking-widest italic">All files will be converted to optimized WebP format</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ── Right Status Monitor (5 Cols) ── */}
          <section className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Monitor Card */}
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full lg:max-h-[850px]">
              <div className="px-10 py-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <History className="text-secondary-400" size={20} />
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary-400">Activity Monitor</h3>
                    <p className="text-3xl font-display font-black">{results.length}</p>
                  </div>
                </div>
                {results.length > 0 && (
                  <button onClick={() => setResults([])} className="text-[10px] font-black uppercase tracking-widest text-secondary-500 hover:text-rose-500 transition-colors">Clear Log</button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar-dark">
                {results.length === 0 ? (
                  <div className="h-full py-32 flex flex-col items-center justify-center text-center opacity-20">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-6">
                      <Package size={32} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Monitor Standby</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {results.map((res) => (
                      <motion.div 
                        key={res.id || Math.random()}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`p-5 rounded-[2rem] border transition-all duration-500 group ${
                          res.status === 'success' ? 'bg-white/5 border-white/5 hover:border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-start gap-5">
                          <div className={`mt-1.5 shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${res.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {res.status === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <p className="text-[8px] font-black text-secondary-500 uppercase tracking-widest truncate">{res.name}</p>
                              {res.count && <span className="text-[9px] font-black text-emerald-500 px-2 py-0.5 bg-emerald-500/5 rounded-full border border-emerald-500/20">{res.count}/10</span>}
                            </div>
                            <h4 className="text-[13px] font-bold leading-snug mb-3 group-hover:text-primary-500 transition-colors">{res.status === 'success' ? res.product : res.message}</h4>
                            {res.sku && (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-600/20">SKU</span>
                                <span className="text-[11px] font-mono font-black text-rose-500 tracking-tighter truncate">{res.sku}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Quick Reference Guide */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 flex items-start gap-5 group hover:bg-white/[0.05] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <Info size={22} className="text-amber-500" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-1">Matching Protocol</h4>
                  <p className="text-[11px] text-secondary-400 font-medium leading-relaxed">System ignores (1), _2 suffixes. <span className="text-white font-bold">MT-123(1).jpg</span> matches <span className="text-white font-bold">MT-123</span>.</p>
                </div>
              </div>
            </div>

          </section>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
