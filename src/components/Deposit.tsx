import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Upload, CheckCircle, AlertCircle, Info, Clock, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { sanitizeError } from '../utils/errorUtils';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
const BANK_ACCOUNTS = [
  { name: "NALIN", bank: "DIALOG FINANCE PLC", acc: "001022368055", branch: "Head Office" },
  { name: "Kumara", bank: "DIALOG FINANCE PLC", acc: "001022391633", branch: "Head Office" }
];

export default function Deposit({ profile, onClose }: { profile: UserProfile | null, onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [refNo, setRefNo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [processingStep, setProcessingStep] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);

  // Safety timeout to reset loading state if it hangs
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setLoading(false);
        setProcessingStep('');
        setError("Request timed out. Please check your connection and try again.");
      }, 300000); // 300 seconds (5 minutes) safety reset
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Auto-rotate bank accounts every 10 mins
  const [bankIndex, setBankIndex] = useState(Math.floor(Date.now() / (10 * 60 * 1000)) % BANK_ACCOUNTS.length);

  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'deposits'),
      where('uid', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingDeposits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Deposits snapshot error:", error);
    });
    return unsubscribe;
  }, [profile]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBankIndex(Math.floor(Date.now() / (10 * 60 * 1000)) % BANK_ACCOUNTS.length);
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const currentBank = BANK_ACCOUNTS[bankIndex];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    if (!file) {
      setError("Please upload a payment receipt image.");
      return;
    }

    if (Number(amount) < 300) {
      setError("Minimum deposit is 300 LKR");
      return;
    }

    if (file && file.size > 10 * 1024 * 1024) {
      setError("Receipt image is too large. Please use a file smaller than 10MB.");
      return;
    }

    setLoading(true);
    setError('');
    setProcessingStep('Initializing...');
    setUploadProgress(0);
    console.log("Starting recharge submission...");

    try {
      // 1. Check for duplicate reference number
      setProcessingStep('Verifying reference number...');
      console.log("Checking for duplicate reference number...");
      const q = query(
        collection(db, 'deposits'), 
        where('uid', '==', profile.uid),
        where('refNo', '==', refNo)
      );
      
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        console.log("Duplicate reference number found.");
        throw new Error("This reference number has already been used in your account.");
      }

      let receiptUrl = '';
      if (file) {
        try {
          setProcessingStep('Compressing receipt...');
          console.log("Starting image compression...");
          
          receiptUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.6 quality to keep it well under 1MB
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                
                // Check if it's still too large (Firestore limit is 1MB)
                // A base64 string is roughly 4/3 the size of the original data
                if (dataUrl.length > 800000) {
                  reject(new Error("Image is too complex to compress sufficiently. Please try a simpler or smaller image."));
                } else {
                  resolve(dataUrl);
                }
              };
              img.onerror = () => reject(new Error("Failed to process image."));
            };
            reader.onerror = () => reject(new Error("Failed to read file."));
          });
          
        } catch (uploadErr: any) {
          console.error("Image processing error:", uploadErr);
          throw new Error("Failed to process receipt: " + (uploadErr.message || "Please try again."));
        }
      }

      // 2. Create the deposit document
      setProcessingStep('Submitting request...');
      console.log("Creating deposit document in Firestore...");
      
      await addDoc(collection(db, 'deposits'), {
        uid: profile.uid,
        amount: Number(amount),
        bankName: currentBank.bank,
        branch: currentBank.branch,
        accNo: currentBank.acc,
        receiptUrl,
        status: 'pending',
        refNo,
        createdAt: new Date().toISOString()
      });

      console.log("Deposit submission successful!");
      setProcessingStep('Done!');
      showToast("Recharge submitted! Please wait for admin approval.", 'success');
      setSuccess(true);
      
      // Reset form fields
      setAmount('');
      setRefNo('');
      setFile(null);
      setPreviewUrl(null);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Deposit submission error:", err);
      // Show specific error messages directly, otherwise use sanitizer
      if (err.message && (err.message.includes("reference number") || err.message.includes("Failed to upload"))) {
        setError(err.message);
      } else {
        setError(sanitizeError(err));
      }
      setProcessingStep('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div 
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-[#f8fafc] pb-12"
        >
          {/* Header */}
          <div className="bg-white px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900">Recharge</h2>
            <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Bank Details Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
              <BankDetail label="Name" value={currentBank.name} onCopy={() => handleCopy(currentBank.name)} />
              <BankDetail label="Bank" value={currentBank.bank} onCopy={() => handleCopy(currentBank.bank)} />
              <BankDetail label="Branch" value={currentBank.branch} onCopy={() => handleCopy(currentBank.branch)} />
              <BankDetail label="ACC.NO" value={currentBank.acc} onCopy={() => handleCopy(currentBank.acc)} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">Deposit Amount</p>
                <input
                  type="number"
                  required
                  placeholder="Enter amount (Min 300 LKR)"
                  className="w-full p-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-yellow-500/20 font-bold text-gray-700 placeholder:text-gray-400"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">Remark</p>
                <input
                  type="text"
                  required
                  placeholder="Mobile number / Email"
                  className="w-full p-5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-yellow-500/20 font-bold text-gray-700 placeholder:text-gray-400"
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                />
              </div>

              {/* Upload Area */}
              <div className="relative min-h-[12rem] border-2 border-dashed border-yellow-500/30 rounded-[2.5rem] flex flex-col items-center justify-center bg-yellow-50/30 hover:bg-yellow-50/50 transition-colors cursor-pointer overflow-hidden group">
                {previewUrl ? (
                  <div className="relative w-full h-full flex flex-col items-center p-4">
                    <img src={previewUrl} alt="Receipt Preview" className="max-h-32 rounded-xl shadow-md mb-2 object-cover" />
                    <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-green-100">
                      <CheckCircle size={14} className="text-green-500" />
                      <p className="text-gray-700 font-bold text-[10px] truncate max-w-[150px]">{file?.name}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={40} className="text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-gray-900 font-black text-lg">Upload Receipt</p>
                    <p className="text-xs text-gray-400 font-bold">Tap to select image</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center space-x-3 text-red-600"
                >
                  <AlertCircle size={20} />
                  <p className="text-sm font-bold">{error}</p>
                </motion.div>
              )}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading || success}
                  className={`w-full py-5 text-white rounded-2xl font-black text-xl shadow-xl active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center space-x-2 ${
                    success ? 'bg-green-500 shadow-green-200' : 'yellow-gradient shadow-yellow-200'
                  }`}
                >
                  {loading && (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{success ? "Completed" : (loading ? processingStep || "Processing..." : "Recharge Complete")}</span>
                </button>
                {success && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-green-600 font-bold text-sm"
                  >
                    Request submitted! Please wait for admin approval.
                  </motion.p>
                )}
              </div>
            </form>

              {/* Notice */}
              <div className="bg-white p-8 rounded-[2.5rem] space-y-4 border border-gray-100 shadow-sm">
                <div className="flex items-center space-x-2 text-yellow-600">
                  <AlertCircle size={18} />
                  <span className="text-sm font-black uppercase tracking-wider">Notice</span>
                </div>
                <ul className="text-sm text-gray-500 space-y-3 font-bold">
                  <li className="flex items-start space-x-3">
                    <span className="text-yellow-600">1.</span>
                    <span>Double-check that the bank details are correct.</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-yellow-600">2.</span>
                    <span>Minimum deposit amount is 300 LKR.</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-yellow-600">3.</span>
                    <span>Deposits may take up to 24 hours to be successful.</span>
                  </li>
                </ul>
              </div>

              {/* Pending Deposits List */}
              {pendingDeposits.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-black text-gray-900">Recent Deposits</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last 5 requests</span>
                  </div>
                  <div className="space-y-3">
                    {pendingDeposits.map((deposit) => (
                      <div key={deposit.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            deposit.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                            deposit.status === 'success' ? 'bg-green-50 text-green-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {deposit.status === 'pending' ? <Clock size={24} /> :
                             deposit.status === 'success' ? <CheckCircle2 size={24} /> :
                             <XCircle size={24} />}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg">Rs. {deposit.amount.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              {new Date(deposit.createdAt).toLocaleDateString()} • {new Date(deposit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          deposit.status === 'success' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {deposit.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-24 left-1/2 px-6 py-3 rounded-full shadow-2xl z-[200] flex items-center space-x-2 border ${
              toast.type === 'success' ? 'bg-white text-green-600 border-green-50' : 'bg-red-500 text-white border-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="font-black text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BankDetail({ label, value, onCopy }: { label: string, value: string, onCopy: () => void }) {
  return (
    <div className="bg-gray-50/50 p-4 rounded-2xl flex justify-between items-center group">
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-gray-900 font-black text-sm">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="p-2 bg-white rounded-xl text-yellow-600 shadow-sm active:scale-90 transition-all"
      >
        <Copy size={18} />
      </button>
    </div>
  );
}
