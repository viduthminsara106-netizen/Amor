import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { UserProfile, Transaction } from '../types';
import { Users, DollarSign, Loader2 } from 'lucide-react';

export default function Referrals({ profile }: { profile: UserProfile | null }) {
  const [referrals, setReferrals] = useState<UserProfile[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.referralCode || !profile?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch direct referrals (Level 1)
    const usersRef = collection(db, 'users');
    const qReferrals = query(
      usersRef, 
      where('referredBy', '==', profile.referralCode)
    );
    
    const unsubscribeReferrals = onSnapshot(qReferrals, (snapshot) => {
      const referralList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        referralList.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setReferrals(referralList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    }, (error) => {
      console.error("Referrals snapshot error:", error);
      setLoading(false);
    });

    // Fetch all referral earnings (from all levels)
    const transactionsRef = collection(db, 'transactions');
    const qTransactions = query(
      transactionsRef, 
      where('uid', '==', profile.uid), 
      where('type', '==', 'referral_commission')
    );
    
    const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        const transaction = doc.data() as Transaction;
        total += transaction.amount;
      });
      setTotalEarnings(total);
      setLoading(false);
    }, (error) => {
      console.error("Referral transactions error:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeReferrals();
      unsubscribeTransactions();
    };
  }, [profile?.referralCode, profile?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="animate-spin text-yellow-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Prominent Earnings Header */}
      <div className="bg-yellow-500 p-8 rounded-[2.5rem] shadow-xl shadow-yellow-500/20 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center space-y-2">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md mb-2">
            <DollarSign size={24} className="text-white" />
          </div>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Referral Program Rewards</p>
          <h3 className="text-2xl font-black tracking-tight">
            Total Earnings: Rs. {totalEarnings.toFixed(2)}
          </h3>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
      </div>

      {/* Direct Referrals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Direct Referrals</h4>
          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black">
            {referrals.length} {referrals.length === 1 ? 'User' : 'Users'}
          </span>
        </div>
        
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          {referrals.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Users size={24} className="text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold text-sm">No direct referrals yet</p>
              <p className="text-gray-300 text-[10px] font-medium">Share your link to start earning!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {referrals.map((ref) => (
                <div key={ref.uid} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600">
                      <Users size={20} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-black text-gray-900 text-sm">{ref.mobile}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Joined Platform</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      {new Date(ref.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
