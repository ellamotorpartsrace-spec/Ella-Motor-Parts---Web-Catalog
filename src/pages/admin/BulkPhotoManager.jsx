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
  History
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

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
          message: data.message || 'Successfully Matched',
          count: data.count,
          id: `${item.id}-${Date.now()}`
        }, ...prev]);
      } catch (err) {
        const errMsg = err.response?.data?.message || 'Match Failed';
        setUploadStats(prev => ({ ...prev, fail: prev.fail + 1 }));
        setResults(prev => [{
          name: item.file.name,
          status: 'error',
          message: errMsg,
          id: `${item.id}-${Date.now()}`
        }, ...prev]);
      } finally {
        URL.revokeObjectURL(item.preview);
      }
    }

    toast.dismiss(toastId);
    toast.success('Batch processing complete!');
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

  const handleDragOver = (e) => {
    e.preventDefault(); e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) stageFiles(e.dataTransfer.files);
  };

  return (
    <div className="max-w-6xl mx-auto pt-16 pb-20 px-4">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-display font-black text-secondary-950 tracking-tight mb-2">
            Bulk SKU Matcher
          </h1>
          <p className="text-secondary-500 font-medium">
            Upload images named after your SKUs to automatically link them to products.
          </p>
        </div>
        
        <button
          onClick={handleExportSKUs}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-3 bg-secondary-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-secondary-950/20 disabled:opacity-50"
        >
          {isExporting ? <ArrowClockwise className="animate-spin" size={16} /> : <FileCsv size={18} />}
          Download SKU Cheat-Sheet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left Column: Upload & Staging ── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Drop Zone */}
          {!isUploading && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative aspect-[16/7] rounded-[2rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer
                ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 bg-white hover:border-secondary-400'}
              `}
            >
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => stageFiles(e.target.files)} />
              
              <div className="w-20 h-20 rounded-3xl bg-secondary-50 flex items-center justify-center mb-6">
                <CloudArrowUp className="text-secondary-400" size={40} />
              </div>
              
              <h3 className="text-xl font-black text-secondary-900 mb-2">Drop Images Here</h3>
              <p className="text-secondary-400 text-sm font-medium text-center max-w-xs leading-relaxed">
                Images must match the SKU exactly. <br/>
                <span className="text-secondary-900 font-bold italic">e.g. MT-123.jpg, MT-123(1).png</span>
              </p>

              {dragActive && (
                <div className="absolute inset-0 bg-primary-500/10 backdrop-blur-[2px] rounded-[2rem] border-4 border-primary-500 flex items-center justify-center z-10">
                  <span className="bg-white px-6 py-3 rounded-full shadow-xl font-black text-primary-600 uppercase tracking-widest text-xs">
                    Release to Stage
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Staging Area / Queue */}
          {(pendingFiles.length > 0 || isUploading) && (
            <div className="bg-white rounded-[2rem] border border-secondary-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-secondary-50 flex items-center justify-between bg-secondary-50/30">
                <h3 className="text-xs font-black uppercase tracking-widest text-secondary-400 flex items-center gap-2">
                  <Package size={14} />
                  Queue ({isUploading ? uploadStats.total : pendingFiles.length})
                </h3>
                {!isUploading && (
                  <button onClick={clearPending} className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-rose-700">Clear All</button>
                )}
              </div>
              
              <div className="p-6">
                {isUploading ? (
                  <div className="py-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-secondary-100 border-t-primary-600 animate-spin mb-6" />
                    <h4 className="text-xl font-black text-secondary-900 mb-2">Uploading Batch...</h4>
                    <p className="text-secondary-400 text-sm font-medium mb-8">Processing {uploadStats.current} of {uploadStats.total}</p>
                    <div className="w-full max-w-md h-2 bg-secondary-50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${(uploadStats.current / uploadStats.total) * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar pb-2">
                      {pendingFiles.map((item) => (
                        <div key={item.id} className="group relative aspect-square rounded-xl bg-secondary-50 border border-secondary-100 overflow-hidden shadow-sm">
                          <img src={item.preview} alt="Staged" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <p className="text-[9px] font-black text-white uppercase tracking-tighter text-center break-all">{item.file.name}</p>
                          </div>
                          <button onClick={() => removePendingFile(item.id)} className="absolute top-1 right-1 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                            <X size={12} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-8 border-t border-secondary-50 flex justify-center">
                      <button
                        onClick={startUpload}
                        className="flex items-center gap-3 px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-95"
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

          {/* Guidelines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Info size={20} className="text-amber-600" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Naming Rules</h4>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">System ignores (1), _2 suffixes. <span className="font-bold">MT-123(1).jpg</span> pairs with <span className="font-bold">MT-123</span>.</p>
              </div>
            </div>
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <Package size={20} className="text-primary-600" />
              </div>
              <div>
                <h4 className="text-xs font-black text-primary-900 uppercase tracking-widest mb-1">Limit Protocol</h4>
                <p className="text-[11px] text-primary-800 font-medium leading-relaxed">Max <span className="font-bold">10 images</span> per product. Excess uploads for full SKUs will be skipped.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Match History ── */}
        <div className="lg:col-span-4 sticky top-32">
          <div className="bg-white rounded-[2rem] border border-secondary-100 shadow-sm flex flex-col overflow-hidden h-[600px] lg:h-[750px]">
            <div className="p-6 border-b border-secondary-50 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-secondary-400 flex items-center gap-2">
                <History size={14} />
                Recent Matches
              </h3>
              <span className="px-2 py-1 bg-secondary-100 rounded text-[9px] font-black text-secondary-600">
                {results.length} Total
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <Package size={32} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No history yet</p>
                </div>
              ) : (
                results.map((res) => (
                  <div 
                    key={res.id}
                    className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
                      res.status === 'success' ? 'bg-white border-secondary-100' : 'bg-rose-50/30 border-rose-100'
                    }`}
                  >
                    <div className={`mt-0.5 ${res.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {res.status === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[9px] font-black text-secondary-400 uppercase tracking-tighter truncate">{res.name}</p>
                        {res.count && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{res.count}/10</span>}
                      </div>
                      <p className="text-xs font-black text-secondary-900 leading-tight mb-2 truncate">
                        {res.status === 'success' ? res.product : res.message}
                      </p>
                      {res.sku && (
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-black tracking-widest uppercase shadow-sm">SKU</span>
                          <span className="text-[10px] font-mono font-black text-rose-600">{res.sku}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {results.length > 0 && (
              <div className="p-4 border-t border-secondary-50">
                <button
                  onClick={() => setResults([])}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-rose-600 transition-colors"
                >
                  Clear History
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
