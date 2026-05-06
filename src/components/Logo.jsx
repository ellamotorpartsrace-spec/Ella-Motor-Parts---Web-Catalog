import { Settings } from 'lucide-react';

export default function Logo({ className = "", scrolled = false }) {
  return (
    <div className={`flex flex-col items-center group cursor-pointer leading-none transition-all duration-300 ${className}`} style={{ width: 'fit-content' }}>
      {/* ELLA - Adjusted for better responsiveness and smaller scale */}
      <span 
        className="text-2xl md:text-3xl font-display font-black text-rose-600 tracking-tighter drop-shadow-[0_1.5px_0_#fff,0_-1.5px_0_#fff,1.5px_0_0_#fff,-1.5px_0_0_#fff,0_2px_8px_rgba(0,0,0,0.1)]"
      >
        ELLA
      </span>
      
      {/* MOTORPARTS - Compact & Responsive */}
      <div className="flex items-center gap-1 mt-0.5 border-t border-secondary-950/10 pt-0.5 w-full justify-between">
        <span className={`text-[8px] md:text-[10px] font-display font-black tracking-[0.15em] transition-colors duration-500 ${scrolled ? 'text-white' : 'text-secondary-950'}`}>
          MOTOR
        </span>
        <Settings size={10} className={`animate-[spin_6s_linear_infinite] ${scrolled ? 'text-white/70' : 'text-secondary-950'}`} />
        <span className={`text-[8px] md:text-[10px] font-display font-black tracking-[0.15em] transition-colors duration-500 ${scrolled ? 'text-white' : 'text-secondary-950'}`}>
          PARTS
        </span>
      </div>
    </div>
  );
}
