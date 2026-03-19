import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Landmark, Wallet, Lock, XCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { sanitizeError } from '../utils/errorUtils';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';

export default function Withdraw({ profile, onClose }: { profile: UserProfile | null, onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accNo, setAccNo] = useState('');
  const [accName, setAccName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const isFrozen = !!profile?.savedBankDetails;

  useEffect(() => {
    if (profile?.savedBankDetails) {
      setBankName(profile.savedBankDetails.bankName);
      setAccNo(profile.savedBankDetails.accNo);
      setAccName(profile.savedBankDetails.accName);
    }
  }, [profile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    if (!bankName.trim() || !accNo.trim() || !accName.trim()) {
      setError("Please fill in all bank details.");
      return;
    }

    const withdrawAmount = Number(amount);
    const availableToWithdraw = profile.withdrawableBalance || 0;

    if (withdrawAmount < 300) {
      setError("Minimum withdrawal is 300 LKR");
      return;
    }
    if (withdrawAmount % 100 !== 0) {
      setError("Amount must be a multiple of 100");
      return;
    }
    if (withdrawAmount > availableToWithdraw) {
      setError("Insufficient withdrawal balance");
      return;
    }
    if (withdrawAmount > profile.balance) {
      setError("Insufficient total balance");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fee = withdrawAmount * 0.25;

      await addDoc(collection(db, 'withdrawals'), {
        uid: profile.uid,
        amount: withdrawAmount,
        bankDetails: { bankName, accNo, accName },
        status: 'pending',
        fee,
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'users', profile.uid), {
        balance: increment(-withdrawAmount),
        withdrawableBalance: increment(-withdrawAmount),
        totalWithdrawals: increment(withdrawAmount),
        ...(!profile.savedBankDetails && {
          savedBankDetails: { bankName, accNo, accName }
        })
      });

      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-2">Withdrawal Requested</h3>
        <p className="text-gray-500 text-center">Your funds will be processed within 24 hours.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#f8fafc] pb-12"
    >
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <h2 className="text-2xl font-black text-gray-900">Withdraw</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
          <svg size={20} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
            <div className="flex flex-col space-y-2 mb-4">
              <div className="flex items-center space-x-3 text-gray-900 font-black">
                <Wallet size={24} className="text-yellow-600" />
                <span className="text-xl">Total Balance: {profile?.balance.toFixed(2)} LKR</span>
              </div>
              <div className="flex items-center space-x-3 text-emerald-600 font-black">
                <Landmark size={20} className="text-emerald-500" />
                <span className="text-lg">Withdrawable: {(profile?.withdrawableBalance || 0).toFixed(2)} LKR</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider px-1">Withdrawal Amount</p>
              <input
                type="number"
                required
                placeholder="Min 300 LKR"
                className="w-full p-5 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-yellow-500/20 font-bold text-gray-700 placeholder:text-gray-400"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amount && (
                <div className="flex justify-between px-1 mt-2">
                  <p className="text-xs text-gray-400 font-bold">Fee (25%): <span className="text-red-500">Rs. {(Number(amount) * 0.25).toLocaleString()}</span></p>
                  <p className="text-xs text-gray-400 font-bold">Net: <span className="text-green-500">Rs. {(Number(amount) * 0.75).toLocaleString()}</span></p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bank Details</p>
              {isFrozen && (
                <div className="flex items-center space-x-1 text-gray-400">
                  <Lock size={12} />
                  <span className="text-[10px] font-bold uppercase">Frozen</span>
                </div>
              )}
            </div>
            <input
              type="text"
              required
              disabled={isFrozen}
              placeholder="Bank Name"
              className={`w-full p-5 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-yellow-500/20 font-bold text-gray-700 placeholder:text-gray-400 ${isFrozen ? 'opacity-70' : ''}`}
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <input
              type="text"
              required
              disabled={isFrozen}
              placeholder="Account Number"
              className={`w-full p-5 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-yellow-500/20 font-bold text-gray-700 placeholder:text-gray-400 ${isFrozen ? 'opacity-70' : ''}`}
              value={accNo}
              onChange={(e) => setAccNo(e.target.value)}
            />
            <input
              type="text"
              required
              disabled={isFrozen}
              placeholder="Account Holder Name"
              className={`w-full p-5 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-yellow-500/20 font-bold text-gray-700 placeholder:text-gray-400 ${isFrozen ? 'opacity-70' : ''}`}
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
            />
          </div>
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

        <div className="bg-white p-8 rounded-[2.5rem] space-y-4 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-2 text-yellow-600">
            <AlertCircle size={18} />
            <span className="text-sm font-black uppercase tracking-wider">Withdrawal Notice</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-3 font-bold">
            <li className="flex items-start space-x-3">
              <span className="text-yellow-600">•</span>
              <span>Double-check that your bank details are correct.</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-yellow-600">•</span>
              <span>Minimum withdraw amount is 300 LKR.</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-yellow-600">•</span>
              <span>A fee of 25% charged for all withdrawals.</span>
            </li>
            <li className="flex items-start space-x-3 text-red-500">
              <span className="">•</span>
              <span>Bank details will be frozen after the first withdrawal for security.</span>
            </li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 yellow-gradient text-white rounded-2xl font-black text-xl shadow-xl shadow-yellow-200 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {loading ? "Processing..." : "Withdraw Now"}
        </button>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center space-x-2 border ${
                toast.type === 'success' ? 'bg-white text-green-600 border-green-50' : 'bg-red-500 text-white border-red-600'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="font-black text-sm">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
