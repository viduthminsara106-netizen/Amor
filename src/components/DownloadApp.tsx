import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Apple, Smartphone, ExternalLink, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function DownloadApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleAddToHomeScreen = async () => {
    if (!deferredPrompt) {
      showToast('To add to home screen:\n1. Open browser menu (three dots or share icon)\n2. Select "Add to Home screen"', 'info');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-6 py-4 relative">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto">
          <Download size={40} className="text-pink-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-gray-900">Get the App</h3>
          <p className="text-gray-500 font-medium">Choose your preferred way to use AuraTrade</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Add to Home Screen Option */}
        <button 
          onClick={handleAddToHomeScreen}
          className={`w-full flex items-center justify-between p-6 rounded-[2rem] shadow-xl transition-all active:scale-95 group ${
            isInstalled 
              ? 'bg-green-50 border border-green-100 text-green-700' 
              : 'bg-yellow-500 text-white shadow-yellow-200'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`${isInstalled ? 'bg-green-100' : 'bg-white/20'} p-3 rounded-2xl`}>
              {isInstalled ? <CheckCircle2 size={24} /> : <PlusCircle size={24} />}
            </div>
            <div className="text-left">
              <p className={`text-xs font-bold uppercase tracking-wider ${isInstalled ? 'text-green-600' : 'text-yellow-100'}`}>
                Web App
              </p>
              <p className="text-lg font-black">
                {isInstalled ? 'Already on Home Screen' : 'Add to Home Screen'}
              </p>
            </div>
          </div>
          {!isInstalled && <PlusCircle size={20} className="text-yellow-200 group-hover:text-white transition-colors" />}
        </button>

        <a 
          href="#" 
          className="flex items-center justify-between p-6 bg-gray-900 text-white rounded-[2rem] shadow-xl shadow-gray-200 active:scale-95 transition-all group"
          onClick={(e) => e.preventDefault()}
        >
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 p-3 rounded-2xl">
              <Smartphone size={24} className="text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Android</p>
              <p className="text-lg font-black">Download APK</p>
            </div>
          </div>
          <ExternalLink size={20} className="text-gray-500 group-hover:text-white transition-colors" />
        </a>

        <a 
          href="#" 
          className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-100 active:scale-95 transition-all group"
          onClick={(e) => e.preventDefault()}
        >
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-3 rounded-2xl">
              <Apple size={24} className="text-gray-900" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">iOS</p>
              <p className="text-lg font-black text-gray-900">App Store</p>
            </div>
          </div>
          <ExternalLink size={20} className="text-gray-300 group-hover:text-gray-900 transition-colors" />
        </a>
      </div>

      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
        <p className="text-xs text-blue-600 font-bold leading-relaxed">
          Tip: Adding to Home Screen gives you a native app experience without downloading large files.
        </p>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-24 left-1/2 px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center space-x-2 border text-center max-w-[90%] ${
              toast.type === 'success' ? 'bg-white text-green-600 border-green-50' : 
              toast.type === 'error' ? 'bg-red-500 text-white border-red-600' :
              'bg-gray-900 text-white border-gray-800'
            }`}
          >
            <span className="font-bold text-sm whitespace-pre-line">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
