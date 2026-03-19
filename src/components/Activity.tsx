import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Play, CheckCircle, Clock, ExternalLink, Zap, AlertCircle, Key, Send, ArrowLeft } from 'lucide-react';
import { UserProfile, AdTask, UserTaskCompletion } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  increment,
  getDocs,
  limit,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

export default function Activity({ profile, onClose }: { profile: UserProfile | null, onClose: () => void }) {
  const [adTasks, setAdTasks] = useState<AdTask[]>([]);
  const [completions, setCompletions] = useState<UserTaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }

    // Countdown timer for daily sign-in
    const timer = setInterval(() => {
      if (profile.lastDailyBonusClaimDate) {
        const lastClaim = new Date(profile.lastDailyBonusClaimDate).getTime();
        const nextClaim = lastClaim + (24 * 60 * 60 * 1000); // 24 hours later
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

    // Fetch Ad Tasks
    const tasksUnsubscribe = onSnapshot(collection(db, 'ad_tasks'), (snapshot) => {
      setAdTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdTask)));
    }, (error) => {
      console.error("Tasks snapshot error:", error);
    });

    // Fetch User Completions for today (for ads)
    const todayStr = new Date().toISOString().split('T')[0];
    const completionsQuery = query(
      collection(db, 'user_task_completions'),
      where('uid', '==', profile.uid),
      where('dateStr', '==', todayStr)
    );

    const completionsUnsubscribe = onSnapshot(completionsQuery, (snapshot) => {
      const todayCompletions = snapshot.docs.map(doc => doc.data() as UserTaskCompletion);
      setCompletions(todayCompletions);
      setLoading(false);
    }, (error) => {
      console.error("Completions snapshot error:", error);
      setLoading(false);
    });

    return () => {
      clearInterval(timer);
      tasksUnsubscribe();
      completionsUnsubscribe();
    };
  }, [profile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDailySignIn = async () => {
    if (!profile) {
      showToast("User profile not found. Please refresh.", 'error');
      return;
    }
    
    // Check 24h cooldown
    if (profile.lastDailyBonusClaimDate) {
      const lastClaim = new Date(profile.lastDailyBonusClaimDate).getTime();
      const nextClaim = lastClaim + (24 * 60 * 60 * 1000);
      if (new Date().getTime() < nextClaim) {
        showToast(`Please wait ${timeLeft} before claiming again.`, 'error');
        return;
      }
    }

    setIsProcessing('daily_signin');
    try {
      const reward = Math.floor(Math.random() * 10) + 1; // 1-10 LKR
      const now = new Date();

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', profile.uid);
        
        // 1. Update user balance and lastDailyBonusClaimDate
        transaction.update(userRef, {
          balance: increment(reward),
          totalProfits: increment(reward),
          withdrawableBalance: increment(reward),
          totalAssets: increment(reward),
          lastDailyBonusClaimDate: now.toISOString()
        });

        // 2. Record transaction
        const transRef = doc(collection(db, 'transactions'));
        transaction.set(transRef, {
          uid: profile.uid,
          amount: reward,
          type: 'daily_bonus',
          description: 'Daily Activity Sign-in Bonus',
          createdAt: now.toISOString()
        });
      });

      setShowSuccess(reward);
      showToast(`Daily bonus claimed: Rs. ${reward}`, 'success');
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (err: any) {
      console.error("Claim bonus error:", err);
      showToast(`Failed to claim bonus: ${err.message}`, 'error');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleWatchAd = async (task: AdTask) => {
    if (!profile) {
      showToast("User profile not found. Please refresh.", 'error');
      return;
    }
    const isDone = completions.some(c => c.taskId === task.id);
    if (isDone) {
      showToast("You have already completed this task today!", 'error');
      return;
    }

    setIsProcessing(task.id);
    
    // Open ad in new tab
    window.open(task.adUrl, '_blank');

    // Simulate watching time or just reward after click for simplicity in this demo
    setTimeout(async () => {
      try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const completionId = `ad_${task.id}_${profile.uid}_${todayStr}`;

        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', profile.uid);
          const completionRef = doc(db, 'user_task_completions', completionId);
          
          const completionDoc = await transaction.get(completionRef);
          if (completionDoc.exists()) {
            throw new Error("Already completed today");
          }

          // 1. Record completion
          transaction.set(completionRef, {
            uid: profile.uid,
            taskId: task.id,
            completedAt: now.toISOString(),
            dateStr: todayStr
          });

          // 2. Update user balance
          transaction.update(userRef, {
            balance: increment(task.reward),
            totalProfits: increment(task.reward),
            withdrawableBalance: increment(task.reward),
            totalAssets: increment(task.reward)
          });

          // 3. Record transaction
          const transRef = doc(collection(db, 'transactions'));
          transaction.set(transRef, {
            uid: profile.uid,
            amount: task.reward,
            type: 'daily_bonus',
            description: `Watch Ad Reward: ${task.title}`,
            createdAt: now.toISOString()
          });
        });

        setShowSuccess(task.reward);
        showToast(`Ad reward claimed: Rs. ${task.reward}`, 'success');
        setTimeout(() => setShowSuccess(null), 3000);
      } catch (err: any) {
        console.error("Ad reward error:", err);
        showToast(`Failed to claim ad reward: ${err.message}`, 'error');
      } finally {
        setIsProcessing(null);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      <header className="bg-[#000814] text-white px-4 py-4 flex items-center space-x-4 sticky top-0 z-50">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black tracking-tight">Daily Activity</h1>
      </header>

      <div className="p-4 space-y-6">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50, x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.5, y: -50, x: '-50%' }}
              className="fixed top-24 left-1/2 z-[100] bg-green-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-3 font-black border-4 border-white/20 backdrop-blur-md"
            >
              <div className="bg-white/20 p-1 rounded-full">
                <CheckCircle size={20} />
              </div>
              <span className="text-lg">+{showSuccess} LKR Claimed!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-yellow-500 rounded-xl text-white">
            <Zap size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Earn Rewards</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Complete tasks every 24 hours</p>
          </div>
        </div>

        {/* Daily Sign In Task */}
        <TaskCard 
          title="Daily Sign-in Bonus"
          reward="1 - 10 LKR"
          icon={<Gift className="text-orange-500" />}
          isCompleted={!!timeLeft}
          isProcessing={isProcessing === 'daily_signin'}
          onClick={handleDailySignIn}
          description={timeLeft ? `Next claim in: ${timeLeft}` : "Click to claim your daily activity bonus"}
          buttonText={timeLeft ? "Wait" : "Claim Now"}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-gray-900">Watch Ads</h3>
            <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded-full">
              {adTasks.length} Available
            </span>
          </div>

          {adTasks.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-gray-200">
              <Play size={40} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm font-bold">No ad tasks available yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {adTasks.map((task) => (
                <TaskCard 
                  key={task.id}
                  title={task.title}
                  reward={`${task.reward} LKR`}
                  icon={<Play className="text-blue-500" />}
                  isCompleted={completions.some(c => c.taskId === task.id)}
                  isProcessing={isProcessing === task.id}
                  onClick={() => handleWatchAd(task)}
                  description="Watch this ad to earn rewards"
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl flex items-start space-x-3 border border-blue-100">
          <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 font-medium leading-relaxed">
            Tasks reset every day at 12:00 AM. Make sure to complete all tasks daily to maximize your earnings!
          </p>
        </div>
      </div>

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
    </div>
  );
}

function TaskCard({ title, reward, icon, isCompleted, isProcessing, onClick, description, buttonText }: any) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isCompleted ? { scale: 1.02, translateY: -2 } : {}}
      whileTap={!isCompleted ? { scale: 0.98 } : {}}
      className={`bg-white rounded-[2rem] p-6 shadow-sm border transition-all flex items-center justify-between relative overflow-hidden ${
        isCompleted ? 'border-green-200 bg-green-50/50' : 'border-gray-100 hover:shadow-md'
      }`}
    >
      {isCompleted && (
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"
        />
      )}
      
      <div className="flex items-center space-x-4 relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
          isCompleted ? 'bg-green-500 text-white' : 'bg-gray-50'
        }`}>
          {isCompleted ? <CheckCircle size={28} /> : icon}
        </div>
        <div>
          <h4 className={`font-black text-base ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>{title}</h4>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{description}</p>
          <div className="flex items-center space-x-1 mt-1">
            <span className={`text-sm font-black ${isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
              {isCompleted ? 'Claimed' : `+${reward}`}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={onClick}
        disabled={isCompleted || isProcessing}
        className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center space-x-2 border-2 ${
          isCompleted 
            ? 'bg-green-500 text-white shadow-lg shadow-green-200 cursor-default border-white/20' 
            : isProcessing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent'
              : 'bg-[#000814] text-white shadow-lg shadow-gray-200 hover:bg-black hover:-translate-y-0.5 active:translate-y-0 border-yellow-500/20'
        }`}
      >
        {isCompleted ? (
          <>
            <CheckCircle size={14} />
            <span>{buttonText || 'Claimed'}</span>
          </>
        ) : isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          <span>{buttonText || 'Claim Now'}</span>
        )}
      </button>
    </motion.div>
  );
}
