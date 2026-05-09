import { useState, useRef } from 'react';
import { 
  Upload as CloudArrowUp, 
  FileText as FileCsv, 
  CheckCircle2 as CheckCircle, 
  X as XCircle, 
  RefreshCw as ArrowClockwise, 
  Info,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function BulkPhotoManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
    setIsUploading(true);
    setResults([]);
    
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('No valid images found');
      setIsUploading(false);
      return;
    }

    toast.loading(`Processing ${imageFiles.length} images...`, { id: 'bulk-upload' });

    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append('image', file);

      try {
        const { data } = await api.patch('/products/bulk/image-by-sku', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setResults(prev => [{
          name: file.name,
          sku: data.sku,
          status: 'success',
          product: data.productName,
          message: 'Matched & Uploaded'
        }, ...prev]);
      } catch (err) {
        const errMsg = err.response?.data?.message || 'Upload failed';
        setResults(prev => [{
          name: file.name,
          status: 'error',
          message: errMsg
        }, ...prev]);
      }
    }

    toast.dismiss('bulk-upload');
    toast.success('Batch processing complete!');
    setIsUploading(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Left Column: Upload Zone ── */}
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative aspect-[16/7] rounded-[2rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer p-8
              ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 bg-white hover:border-secondary-400'}
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
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
            
            <div className="w-20 h-20 rounded-3xl bg-secondary-50 flex items-center justify-center mb-6">
              {isUploading ? (
                <ArrowClockwise className="text-primary-600 animate-spin" size={32} />
              ) : (
                <CloudArrowUp className="text-secondary-400" size={40} />
              )}
            </div>
            
            <h3 className="text-xl font-black text-secondary-900 mb-2">
              {isUploading ? 'Processing Batch...' : 'Drop Images Here'}
            </h3>
            <p className="text-secondary-400 text-sm font-medium text-center max-w-xs">
              Images must be named exactly like the SKU (e.g. <span className="text-secondary-900 font-bold">MT-123.webp</span>)
            </p>

            {dragActive && (
              <div className="absolute inset-0 bg-primary-500/10 backdrop-blur-[2px] rounded-[2rem] border-4 border-primary-500 flex items-center justify-center">
                <span className="bg-white px-6 py-3 rounded-full shadow-xl font-black text-primary-600 uppercase tracking-widest text-xs">
                  Drop to start matching
                </span>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Info size={20} className="text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider mb-1">Upload Guidelines</h4>
              <ul className="text-xs text-amber-800 space-y-1 font-medium leading-relaxed">
                <li>• Filename must match the SKU (e.g. SKU123.jpg, SKU123.png)</li>
                <li>• Extensions don't matter, we match only the name.</li>
                <li>• If a product already has an image, it will be replaced.</li>
                <li>• All images are automatically optimized to WebP format.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Right Column: Activity Log ── */}
        <div className="bg-white rounded-[2rem] border border-secondary-100 shadow-sm flex flex-col overflow-hidden h-[500px] lg:h-auto">
          <div className="p-6 border-b border-secondary-50 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary-400 flex items-center gap-2">
              <ArrowClockwise size={14} />
              Recent Matches
            </h3>
            <span className="px-2 py-1 bg-secondary-100 rounded text-[9px] font-black text-secondary-600">
              {results.length} Total
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Package size={40} className="mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">No activity yet</p>
              </div>
            ) : (
              results.map((res, i) => (
                <div 
                  key={i}
                  className={`p-4 rounded-xl border flex items-start gap-4 transition-all animate-in slide-in-from-right-4 duration-300 ${
                    res.status === 'success' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'
                  }`}
                >
                  <div className={`mt-0.5 ${res.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {res.status === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-tighter truncate">
                      {res.name}
                    </p>
                    <p className="text-xs font-black text-secondary-900 leading-tight my-1 truncate">
                      {res.status === 'success' ? res.product : res.message}
                    </p>
                    {res.sku && (
                      <span className="inline-block px-1.5 py-0.5 bg-secondary-950 text-white rounded text-[8px] font-black tracking-widest">
                        SKU: {res.sku}
                      </span>
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
                className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-secondary-400 hover:text-secondary-900 transition-colors"
              >
                Clear History
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
