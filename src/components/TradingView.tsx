import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, TrendingUp, Zap, CheckCircle, AlertCircle, Shield, Star, Crown, Gem, Trophy, Anchor, Flame } from 'lucide-react';
import { UserProfile, VIP_LEVELS } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, increment, addDoc, collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function TradingView({ profile }: { profile: UserProfile | null }) {
  const [isTrading, setIsTrading] = useState(false);
  const [tradeCount, setTradeCount] = useState(profile?.dailyTradesDone || 0);
  const [countdown, setCountdown] = useState("00:00:00");

  useEffect(() => {
    if (profile) {
      setTradeCount(profile.dailyTradesDone || 0);
    }
  }, [profile?.dailyTradesDone]);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const currentVip = VIP_LEVELS.find(v => v.level === profile?.vipLevel) || VIP_LEVELS[0];

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const reset = new Date();
      reset.setHours(24, 0, 0, 0);
      const diff = reset.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startAutoTrade = async () => {
    if (tradeCount >= (currentVip.dailyTrades || 10)) return;
    if (isTrading) return;

    setIsTrading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const biasedRandom = Math.pow(Math.random(), 2.5);
      const profitPercent = biasedRandom * (currentVip.profitMax - currentVip.profitMin) + currentVip.profitMin;
      const dailyTradesLimit = currentVip.dailyTrades || 10;
      const profit = (profile?.balance || 0) * (profitPercent / dailyTradesLimit);
      
      if (profile) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          balance: increment(profit),
          totalProfits: increment(profit),
          withdrawableBalance: increment(profit),
          dailyProfit: increment(profit),
          dailyTradesDone: increment(1),
          lastTradeTime: new Date().toISOString()
        });

        await addDoc(collection(db, 'transactions'), {
          uid: profile.uid,
          amount: profit,
          type: 'trade_profit',
          description: `Auto-bot profit (Trade ${tradeCount + 1}/${currentVip.dailyTrades || 10})`,
          createdAt: new Date().toISOString()
        });

        setTradeCount(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTrading(false);
    }
  };

  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      const q = query(
        collection(db, 'transactions'),
        where('uid', '==', profile.uid),
        where('type', 'in', ['trade_profit', 'trade_loss']),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setRecentTrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        console.error("Recent trades snapshot error:", error);
      });
      return unsubscribe;
    }
  }, [profile]);

  const getVipIcon = (level: number) => {
    switch (level) {
      case 1: return <Star size={20} className="text-gray-400" />;
      case 2: return <Crown size={20} className="text-yellow-500" />;
      case 3: return <Shield size={20} className="text-blue-400" />;
      case 4: return <Gem size={20} className="text-cyan-400" />;
      case 5: return <Trophy size={20} className="text-orange-500" />;
      case 6: return <Anchor size={20} className="text-indigo-400" />;
      case 7: return <Flame size={20} className="text-red-500" />;
      default: return <Star size={20} />;
    }
  };

  const activePackages = VIP_LEVELS.filter(v => v.level <= (profile?.vipLevel || 0));

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black text-gray-900">Trading</h2>
        <div className="flex items-center space-x-1">
          <span className="text-xl font-black text-yellow-600">{profile?.balance.toFixed(2)}</span>
          <span className="text-xs font-bold text-yellow-600">LKR</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="PACKAGE" value={profile?.vipLevel || 0} color="text-yellow-600" />
        <StatCard label="TODAY EARN" value={`${profile?.totalProfits.toFixed(0)} LKR`} color="text-green-500" />
        <StatCard label="RESET IN" value={countdown} color="text-blue-500" />
      </div>

      {/* Auto Bot Trading Card */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 shadow-xl border border-gray-100 flex flex-col items-center text-center space-y-6 min-h-[300px] justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" 
            alt="Trading Bot BG" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white/80" />
        </div>

        <div className="relative z-10 flex flex-col items-center space-y-6 w-full">
          <div className="flex items-center space-x-2 text-gray-900 font-black">
            <Zap size={24} className="text-yellow-500 animate-pulse" />
            <span className="text-xl tracking-tight">AI Auto Bot Trading</span>
          </div>

          {/* Animation Area */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <AnimatePresence>
              {isTrading ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full border-4 border-dashed border-yellow-500 rounded-full"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center"
                  >
                    <Zap size={32} className="text-yellow-600" fill="currentColor" />
                  </motion.div>
                  {/* Scanning Line */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-yellow-400 shadow-[0_0_10px_#f59e0b] z-20"
                  />
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <Play size={32} className="text-gray-400 ml-1" fill="currentColor" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1">
            <p className="text-gray-900 text-lg font-black">{tradeCount} / {currentVip.dailyTrades || 1} Trade Complete</p>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Daily Limit Reached: {tradeCount >= (currentVip.dailyTrades || 1) ? 'YES' : 'NO'}</p>
          </div>
          
          <button
            onClick={startAutoTrade}
            disabled={isTrading || tradeCount >= (currentVip.dailyTrades || 1) || (profile?.vipLevel || 0) === 0}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-2 shadow-lg active:scale-[0.98] ${
              isTrading || tradeCount >= (currentVip.dailyTrades || 1) || (profile?.vipLevel || 0) === 0
                ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                : 'yellow-gradient text-white shadow-yellow-200 hover:shadow-yellow-300'
            }`}
          >
            <Zap size={20} fill="currentColor" />
            <span>{isTrading ? 'BOT ANALYZING...' : tradeCount >= (currentVip.dailyTrades || 1) ? 'COMPLETED' : 'START AUTO BOT'}</span>
          </button>
          
          {(profile?.vipLevel || 0) === 0 && (
            <p className="text-red-500 text-xs font-bold bg-red-50 px-4 py-2 rounded-full">Activate a package to start trading</p>
          )}
        </div>
      </div>

      {/* My Activated Packages */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center space-x-2 text-gray-900 font-black">
          <Shield size={20} className="text-blue-500" />
          <span className="text-lg">My Activated Packages</span>
        </div>
        
        <div className="space-y-3">
          {activePackages.length === 0 ? (
            <div className="text-center py-6 text-gray-400 font-bold text-sm">
              No active packages found
            </div>
          ) : (
            activePackages.map((v) => (
              <div key={v.level} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    {getVipIcon(v.level)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{v.name}</p>
                    <p className="text-[10px] font-bold text-gray-400">Profit: {(v.profitMin * 100).toFixed(0)}% - {(v.profitMax * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  Active
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transaction Overview */}
      <div className="bg-white rounded-t-[2rem] p-6 shadow-sm border border-gray-100 min-h-[200px]">
        <h3 className="text-lg font-black text-gray-900 mb-4">Transaction Overview</h3>
        <div className="space-y-4">
          {recentTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <Clock size={48} className="mb-2 opacity-20" />
              <p className="text-sm font-bold">No recent transactions</p>
            </div>
          ) : (
            recentTrades.map((trade) => (
              <div key={trade.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${trade.type === 'trade_profit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <TrendingUp size={18} className={trade.type === 'trade_loss' ? 'rotate-180' : ''} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{trade.description}</p>
                    <p className="text-[10px] font-bold text-gray-400">{new Date(trade.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className={`text-sm font-black ${trade.type === 'trade_profit' ? 'text-green-600' : 'text-red-600'}`}>
                  {trade.type === 'trade_profit' ? '+' : ''}{trade.amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
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
            {toast.type === 'success' ? <CheckCircle size={18} /> : <Zap size={18} />}
            <span className="font-black text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center flex flex-col justify-center space-y-1">
      <p className="text-[10px] text-gray-400 font-bold tracking-wider">{label}</p>
      <p className={`text-sm font-black ${color}`}>{value}</p>
    </div>
  );
}
