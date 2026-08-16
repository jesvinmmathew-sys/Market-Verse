import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, LogOut, X } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
      id="logout-confirm-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="liquid-glass border border-red-500/20 bg-[#0B0F19] rounded-2xl p-6 max-w-sm w-full text-center space-y-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="logout-confirm-box"
      >
        {/* Glow behind warning icon */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 bg-red-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Confirm Terminal Sign Out</h3>
            <p className="text-[10px] text-white/50 leading-relaxed mt-2 font-sans">
              Are you sure you want to end your current MarketVerse session? Any active paper trading orders will remain tracked in your account.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-red-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Confirm Sign Out</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1 text-white/30 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5 transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
};
