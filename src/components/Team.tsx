import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Users, TrendingUp, DollarSign, Copy } from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Team({ profile, isAdmin = false }: { profile: UserProfile | null, isAdmin?: boolean }) {
  const [referrals, setReferrals] = useState<UserProfile[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [activeLevel, setActiveLevel] = useState(1);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);

    // Fetch Level 1 referrals
    const q = query(collection(db, 'users'), where('referredBy', '==', profile.referralCode));
    const unsubscribeReferrals = onSnapshot(q, (snapshot) => {
      setReferrals(snapshot.docs.map(doc => doc.data() as UserProfile));
      setLoading(false);
    }, (error) => {
      console.error("Team snapshot error:", error);
      setLoading(false);
    });

    // Fetch total referral earnings
    const qEarnings = query(
      collection(db, 'transactions'), 
      where('uid', '==', profile.uid), 
      where('type', '==', 'referral_commission')
    );
    const unsubscribeEarnings = onSnapshot(qEarnings, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().amount || 0;
      });
      setTotalEarnings(total);
    });

    return () => {
      unsubscribeReferrals();
      unsubscribeEarnings();
    };
  }, [profile]);

  const inviteLink = `${window.location.origin}?ref=${profile?.referralCode}`;

  const handleCopy = (type: 'code' | 'link', text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="premium-card p-6 yellow-gradient text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black">My Team</h3>
          <button 
            onClick={() => handleCopy('link', inviteLink)} 
            className="p-2 bg-white/20 rounded-xl backdrop-blur-md relative"
          >
            <Share2 size={20} />
            {copied === 'link' && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] px-2 py-1 rounded">Copied!</span>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
            <p className="text-white/60 text-[10px] font-bold uppercase">Team Total</p>
            <p className="text-xl font-black">{referrals.length}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
            <p className="text-white/60 text-[10px] font-bold uppercase">Total Earnings</p>
            <p className="text-xl font-black">Rs. {totalEarnings.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-2">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Invitation Link</p>
              <button 
                onClick={() => handleCopy('link', inviteLink)}
                className="text-white/80 hover:text-white flex items-center space-x-1 text-[10px] font-bold uppercase"
              >
                <Copy size={14} />
                <span>{copied === 'link' ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
            <p className="text-xs font-medium truncate opacity-90 bg-black/10 p-2 rounded-lg">{inviteLink}</p>
          </div>

          <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md flex justify-between items-center">
            <div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Referral Code</p>
              <p className="text-2xl font-black tracking-widest">{profile?.referralCode}</p>
            </div>
            <button 
              onClick={() => handleCopy('code', profile?.referralCode || '')}
              className="bg-white text-yellow-600 px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg active:scale-95 transition-all"
            >
              {copied === 'code' ? 'Copied' : 'Copy Code'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
        {[1, 2, 3].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setActiveLevel(lvl)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeLevel === lvl ? 'bg-yellow-500 text-white shadow-md' : 'text-gray-500'}`}
          >
            Level {lvl}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">No referrals found in Level {activeLevel}</p>
          </div>
        ) : (
          referrals.map((ref, idx) => (
            <div key={idx} className="premium-card p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
                  <Users size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {isAdmin ? ref.mobile : ref.mobile.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Joined: {new Date(ref.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-yellow-600">Rs. {ref.balance.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Balance</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100">
        <h4 className="font-black text-yellow-600 mb-4 uppercase text-xs tracking-widest">Commission Rules</h4>
        <div className="space-y-3">
          <CommissionRule level={1} percent={25} />
          <CommissionRule level={2} percent={2} />
          <CommissionRule level={3} percent={1} />
        </div>
        <p className="mt-4 text-[10px] text-yellow-600/60 font-medium italic">
          * Commissions are earned only on the first deposit of each referral.
        </p>
      </div>
    </div>
  );
}

function CommissionRule({ level, percent }: { level: number, percent: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-bold text-gray-700">Level {level}</span>
      <span className="text-sm font-black text-yellow-600">{percent}%</span>
    </div>
  );
}
