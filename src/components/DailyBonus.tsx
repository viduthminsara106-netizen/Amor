import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, CheckCircle, X, Sparkles, Key, Send, AlertCircle, Clock, Zap } from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, increment, collection, addDoc, query, where, getDocs, runTransaction } from 'firebase/firestore';

export default function DailyBonus({ profile, onClose }: { profile: UserProfile | null, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [giftKey, setGiftKey] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [giftStatus, setGiftStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const timer = setInterval(() => {
      if (profile.lastDailyBonusClaimDate) {
        const lastClaim = new Date(profile.lastDailyBonusClaimDate).getTime();
        const nextClaim = lastClaim + (24 * 60 * 60 * 1000);
        const now = new Date().getTime();
        const diff = nextClaim - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(null);
        }
      } else {
        setTimeLeft(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile]);

  const handleDailySignIn = async () => {
    if (!profile) return;
    
    if (timeLeft) return;

    setIsClaiming(true);
    setGiftStatus(null);
    try {
      const rewardAmount = Math.floor(Math.random() * 10) + 1;
      const now = new Date();

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', profile.uid);
        
        transaction.update(userRef, {
          balance: increment(rewardAmount),
          totalProfits: increment(rewardAmount),
          withdrawableBalance: increment(rewardAmount),
          totalAssets: increment(rewardAmount),
          lastDailyBonusClaimDate: now.toISOString()
        });

        const transRef = doc(collection(db, 'transactions'));
        transaction.set(transRef, {
          uid: profile.uid,
          amount: rewardAmount,
          type: 'daily_bonus',
          description: 'Daily Sign-in Bonus',
          createdAt: now.toISOString()
        });
      });

      setReward(rewardAmount);
    } catch (err: any) {
      console.error(err);
      setGiftStatus({ type: 'error', message: err.message || 'An error occurred. Please try again.' });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRedeemGiftKey = async () => {
    if (!profile || !giftKey.trim()) return;

    setIsRedeeming(true);
    setGiftStatus(null);

    try {
      const q = query(collection(db, 'gift_keys'), where('key', '==', giftKey.trim().toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setGiftStatus({ type: 'error', message: 'Invalid gift key' });
        return;
      }

      const keyDoc = snapshot.docs[0];
      const keyData = keyDoc.data();

      if (keyData.usedCount >= keyData.maxUses) {
        setGiftStatus({ type: 'error', message: 'Gift key has reached maximum uses' });
        return;
      }

      // Check if this user already used this key
      const completionQuery = query(
        collection(db, 'user_task_completions'),
        where('uid', '==', profile.uid),
        where('taskId', '==', `gift_key_${keyDoc.id}`)
      );
      const completionSnapshot = await getDocs(completionQuery);

      if (!completionSnapshot.empty) {
        setGiftStatus({ type: 'error', message: 'You have already redeemed this key' });
        return;
      }

      const now = new Date().toISOString();

      // Update user balance
      await updateDoc(doc(db, 'users', profile.uid), {
        balance: increment(keyData.reward),
        totalProfits: increment(keyData.reward),
        withdrawableBalance: increment(keyData.reward)
      });

      // Update key use count
      await updateDoc(doc(db, 'gift_keys', keyDoc.id), {
        usedCount: increment(1)
      });

      // Log completion
      await addDoc(collection(db, 'user_task_completions'), {
        uid: profile.uid,
        taskId: `gift_key_${keyDoc.id}`,
        completedAt: now
      });

      // Log transaction
      await addDoc(collection(db, 'transactions'), {
        uid: profile.uid,
        amount: keyData.reward,
        type: 'daily_bonus',
        description: `Gift Key Redeemed: ${giftKey.trim().toUpperCase()}`,
        createdAt: now
      });

      setGiftStatus({ type: 'success', message: `Successfully redeemed ${keyData.reward} LKR!` });
      setGiftKey('');
      setReward(keyData.reward);
    } catch (err) {
      console.error(err);
      setGiftStatus({ type: 'error', message: 'An error occurred. Please try again.' });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {!reward ? (
        <div className="space-y-8">
          <AnimatePresence>
            {giftStatus && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-xl text-[10px] font-black uppercase flex items-center space-x-2 ${
                  giftStatus.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}
              >
                {giftStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <span>{giftStatus.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Daily Sign-in Section */}
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500 rounded-xl text-white">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900">Daily Sign-in</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Claim 1-10 LKR daily</p>
                </div>
              </div>
              {timeLeft && (
                <div className="flex items-center space-x-1 text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                  <Clock size={12} />
                  <span className="text-[10px] font-black">{timeLeft}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleDailySignIn}
              disabled={isClaiming || !!timeLeft}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
                timeLeft 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-yellow-500 text-white shadow-lg shadow-yellow-200 active:scale-95'
              }`}
            >
              {isClaiming ? "Claiming..." : timeLeft ? "Already Claimed" : "Claim Daily Bonus"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-300 font-black">OR</span>
            </div>
          </div>

          {/* Gift Key Redemption Section */}
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <Gift size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Redeem Gift Key</h3>
              <p className="text-xs text-gray-400 font-bold uppercase">Enter your special code below</p>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Key size={18} />
              </div>
              <input 
                type="text" 
                placeholder="ENTER GIFT CODE" 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none text-sm font-black uppercase tracking-wider placeholder:text-gray-300"
                value={giftKey}
                onChange={(e) => setGiftKey(e.target.value)}
              />
            </div>

            <button 
              onClick={handleRedeemGiftKey}
              disabled={isRedeeming || !giftKey.trim()}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {isRedeeming ? "Redeeming..." : "Redeem Now"}
            </button>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 py-8"
        >
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-gray-900">Congratulations!</h3>
            <p className="text-gray-500 font-medium">You've received a reward of</p>
            <div className="text-5xl font-black text-red-500 py-4">
              {reward.toFixed(2)} <span className="text-xl text-gray-400">LKR</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xl shadow-xl shadow-gray-200 active:scale-95 transition-all"
          >
            Awesome!
          </button>
        </motion.div>
      )}
    </div>
  );
}
