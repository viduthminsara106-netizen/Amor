import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Clock, TrendingUp, Wallet, Zap } from 'lucide-react';

export default function TransactionHistory({ profile }: { profile: UserProfile | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const qTransactions = query(
      collection(db, 'transactions'),
      where('uid', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const qDeposits = query(
      collection(db, 'deposits'),
      where('uid', '==', profile.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const qWithdrawals = query(
      collection(db, 'withdrawals'),
      where('uid', '==', profile.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    let txs: any[] = [];
    let deps: any[] = [];
    let withs: any[] = [];

    const updateItems = () => {
      const all = [...txs, ...deps, ...withs].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(all);
      setLoading(false);
    };

    const unsubTxs = onSnapshot(qTransactions, (s) => {
      txs = s.docs.map(d => ({ id: d.id, ...d.data(), isTransaction: true }));
      updateItems();
    });

    const unsubDeps = onSnapshot(qDeposits, (s) => {
      deps = s.docs.map(d => ({ id: d.id, ...d.data(), isDeposit: true }));
      updateItems();
    });

    const unsubWiths = onSnapshot(qWithdrawals, (s) => {
      withs = s.docs.map(d => ({ id: d.id, ...d.data(), isWithdrawal: true }));
      updateItems();
    });

    return () => {
      unsubTxs();
      unsubDeps();
      unsubWiths();
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Clock size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-bold">No transactions yet</p>
        </div>
      ) : (
        items.map((item) => {
          const isPending = item.status === 'pending';
          const type = item.isDeposit ? 'recharge' : item.isWithdrawal ? 'withdraw' : item.type;
          const description = item.isDeposit ? 'Deposit Request' : item.isWithdrawal ? 'Withdrawal Request' : item.description;
          const amount = item.isWithdrawal ? -item.amount : item.amount;

          return (
            <div key={item.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${getTransactionColor(type)}`}>
                  {getTransactionIcon(type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-black text-gray-900">{description}</p>
                    {isPending && (
                      <span className="text-[8px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className={`text-right ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <p className="text-lg font-black tracking-tight">
                  {amount >= 0 ? '+' : ''}{amount.toFixed(2)}
                </p>
                <p className="text-[10px] font-bold uppercase opacity-60">LKR</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function getTransactionIcon(type: string) {
  switch (type) {
    case 'recharge': return <Wallet size={20} />;
    case 'withdraw': return <ArrowDownLeft size={20} />;
    case 'trade_profit': return <TrendingUp size={20} />;
    case 'trade_loss': return <TrendingUp size={20} className="rotate-180" />;
    case 'bonus': return <Zap size={20} fill="currentColor" />;
    default: return <Clock size={20} />;
  }
}

function getTransactionColor(type: string) {
  switch (type) {
    case 'recharge': return 'bg-blue-100 text-blue-600';
    case 'withdraw': return 'bg-orange-100 text-orange-600';
    case 'trade_profit': return 'bg-green-100 text-green-600';
    case 'trade_loss': return 'bg-red-100 text-red-600';
    case 'bonus': return 'bg-yellow-100 text-yellow-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}
