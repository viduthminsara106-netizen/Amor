import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, addDoc, getDoc, where, getDocs, deleteDoc, writeBatch, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';
import { UserProfile, DepositRequest, WithdrawalRequest, VIP_LEVELS } from '../types';
import TransactionHistory from './TransactionHistory';
import Team from './Team';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, User, Wallet, ArrowUpRight, ArrowDownLeft, Ban, CheckCircle, LogOut, Trash2, AlertTriangle, Settings, Shield, Eye, Users, Pencil, History, UserMinus, UserPlus, TrendingUp, Search, Clock } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [adTasks, setAdTasks] = useState<any[]>([]);
  const [giftKeys, setGiftKeys] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'tasks' | 'giftkeys' | 'system'>('users');
  const [newTask, setNewTask] = useState({ title: '', adUrl: '', reward: 1 });
  const [newGiftKey, setNewGiftKey] = useState({ key: '', reward: 10, maxUses: 100 });
  const [isClearingData, setIsClearingData] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const [bulkKeys, setBulkKeys] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isFixingBalances, setIsFixingBalances] = useState(false);
  const [isDeletingUsers, setIsDeletingUsers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{uid: string, mobile: string} | null>(null);
  const [showFixConfirm, setShowFixConfirm] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAdminMessage({ text, type });
    setTimeout(() => setAdminMessage(null), 5000);
  };

  // New Admin Modals State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDashboard, setShowUserDashboard] = useState(false);
  const [showUserTransactions, setShowUserTransactions] = useState(false);
  const [showUserReferrals, setShowUserReferrals] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editFormData, setEditFormData] = useState({ balance: 0, withdrawableBalance: 0, vipLevel: 1 });
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
    const qDeps = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'), limit(50));
    const qWiths = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'), limit(50));
    const qTasks = query(collection(db, 'ad_tasks'), orderBy('createdAt', 'desc'));
    const qGifts = query(collection(db, 'gift_keys'), orderBy('createdAt', 'desc'), limit(50));

    const unsubUsers = onSnapshot(qUsers, (s) => setUsers(s.docs.map(d => ({ ...d.data() } as UserProfile))), (e) => console.error("Admin Users error:", e));
    const unsubDeps = onSnapshot(qDeps, (s) => setDeposits(s.docs.map(d => ({ id: d.id, ...d.data() } as DepositRequest))), (e) => console.error("Admin Deposits error:", e));
    const unsubWiths = onSnapshot(qWiths, (s) => setWithdrawals(s.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest))), (e) => console.error("Admin Withdrawals error:", e));
    const unsubTasks = onSnapshot(qTasks, (s) => setAdTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => console.error("Admin Tasks error:", e));
    const unsubGifts = onSnapshot(qGifts, (s) => setGiftKeys(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => console.error("Admin Gifts error:", e));

    return () => { unsubUsers(); unsubDeps(); unsubWiths(); unsubTasks(); unsubGifts(); };
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    // Artificial delay to show the user that something is happening, 
    // since onSnapshot is already real-time.
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.adUrl) return;
    try {
      await addDoc(collection(db, 'ad_tasks'), {
        ...newTask,
        createdAt: new Date().toISOString()
      });
      setNewTask({ title: '', adUrl: '', reward: 1 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAdTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ad_tasks', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGiftKey = async () => {
    if (!newGiftKey.key) return;
    try {
      await addDoc(collection(db, 'gift_keys'), {
        ...newGiftKey,
        usedCount: 0,
        createdAt: new Date().toISOString()
      });
      setNewGiftKey({ key: '', reward: 10, maxUses: 100 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGiftKey = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gift_keys', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkKeys.trim()) return;
    setIsImporting(true);
    try {
      const keys = bulkKeys.split(/[\s,]+/).filter(k => k.trim().length > 0);
      for (const k of keys) {
        const keyUpper = k.trim().toUpperCase();
        // Check if exists
        const q = query(collection(db, 'gift_keys'), where('key', '==', keyUpper));
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(collection(db, 'gift_keys'), {
            key: keyUpper,
            reward: 10, // Default reward
            maxUses: 1000,
            usedCount: 0,
            createdAt: new Date().toISOString()
          });
        }
      }
      setBulkKeys('');
      showMessage(`Imported ${keys.length} keys successfully!`, 'success');
    } catch (err) {
      console.error(err);
      showMessage('Error importing keys', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleApproveDeposit = async (dep: DepositRequest) => {
    if (!dep.id) return;
    try {
      const userRef = doc(db, 'users', dep.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data() as UserProfile;

      // Determine VIP level based on deposit amount
      let newVipLevel = userData.vipLevel;
      const availableVips = VIP_LEVELS.filter(v => !v.comingSoon && dep.amount >= v.min);
      if (availableVips.length > 0) {
        newVipLevel = availableVips[availableVips.length - 1].level;
      }

      // Check if this is the first approved deposit BEFORE approving it
      const qFirst = query(collection(db, 'deposits'), where('uid', '==', dep.uid), where('status', '==', 'approved'));
      const snapshotFirst = await getDocs(qFirst);
      const isFirstDeposit = snapshotFirst.size === 0;

      await updateDoc(doc(db, 'deposits', dep.id), { status: 'approved' });
      await updateDoc(userRef, { 
        balance: increment(dep.amount),
        vipLevel: newVipLevel
      });

      // Referral commission logic
      if (userData.referredBy) {
        // Find Level 1 referrer by referralCode
        const q1 = query(collection(db, 'users'), where('referralCode', '==', userData.referredBy));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) {
          const l1Doc = snap1.docs[0];
          const l1Ref = l1Doc.ref;
          const l1Data = l1Doc.data() as UserProfile;
          
          // Level 1 Commission: 25% on first deposit, 2% on subsequent
          const comm1Rate = isFirstDeposit ? 0.25 : 0.02;
          const comm1 = dep.amount * comm1Rate;
          
          await updateDoc(l1Ref, { 
            balance: increment(comm1),
            withdrawableBalance: increment(comm1)
          });
          await addDoc(collection(db, 'transactions'), {
            uid: l1Doc.id,
            amount: comm1,
            type: 'referral_commission',
            description: `L1 Referral commission (${isFirstDeposit ? '25%' : '2%'}) from ${userData.mobile}`,
            createdAt: new Date().toISOString()
          });

          // Level 2 Commission (2% on all deposits)
          if (l1Data.referredBy) {
            const q2 = query(collection(db, 'users'), where('referralCode', '==', l1Data.referredBy));
            const snap2 = await getDocs(q2);
            if (!snap2.empty) {
              const l2Doc = snap2.docs[0];
              const l2Ref = l2Doc.ref;
              const l2Data = l2Doc.data() as UserProfile;
              const comm2 = dep.amount * 0.02;
              
              await updateDoc(l2Ref, { 
                balance: increment(comm2),
                withdrawableBalance: increment(comm2)
              });
              await addDoc(collection(db, 'transactions'), {
                uid: l2Doc.id,
                amount: comm2,
                type: 'referral_commission',
                description: `L2 Referral commission (2%) from ${userData.mobile}`,
                createdAt: new Date().toISOString()
              });

              // Level 3 Commission (1% on all deposits)
              if (l2Data.referredBy) {
                const q3 = query(collection(db, 'users'), where('referralCode', '==', l2Data.referredBy));
                const snap3 = await getDocs(q3);
                if (!snap3.empty) {
                  const l3Doc = snap3.docs[0];
                  const l3Ref = l3Doc.ref;
                  const comm3 = dep.amount * 0.01;
                  
                  await updateDoc(l3Ref, { 
                    balance: increment(comm3),
                    withdrawableBalance: increment(comm3)
                  });
                  await addDoc(collection(db, 'transactions'), {
                    uid: l3Doc.id,
                    amount: comm3,
                    type: 'referral_commission',
                    description: `L3 Referral commission (1%) from ${userData.mobile}`,
                    createdAt: new Date().toISOString()
                  });
                }
              }
            }
          }
        }
      }

      await addDoc(collection(db, 'transactions'), {
        uid: dep.uid,
        amount: dep.amount,
        type: 'deposit',
        description: 'Deposit approved',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    await updateDoc(doc(db, 'deposits', id), { status: 'rejected' });
  };

  const handleUpdateBalance = async (uid: string, newBalance: number) => {
    await updateDoc(doc(db, 'users', uid), { balance: newBalance });
  };

  const handleApproveWithdrawal = async (withd: WithdrawalRequest) => {
    if (!withd.id) return;
    try {
      await updateDoc(doc(db, 'withdrawals', withd.id), { status: 'approved' });
      await addDoc(collection(db, 'transactions'), {
        uid: withd.uid,
        amount: -withd.amount,
        type: 'withdrawal',
        description: 'Withdrawal approved',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectWithdrawal = async (id: string, uid: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'withdrawals', id), { status: 'rejected' });
      // Refund balance on rejection
      await updateDoc(doc(db, 'users', uid), { 
        balance: increment(amount),
        withdrawableBalance: increment(amount),
        totalWithdrawals: increment(-amount)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllData = async () => {
    setIsClearingData(true);
    try {
      const collectionsToClear = [
        'users', 
        'deposits', 
        'withdrawals', 
        'transactions', 
        'ad_tasks', 
        'gift_keys', 
        'user_task_completions',
        'notifications'
      ];

      for (const collName of collectionsToClear) {
        let snapshot;
        try {
          const q = query(collection(db, collName));
          snapshot = await getDocs(q);
        } catch (err) {
          handleFirestoreError(err, OperationType.LIST, collName);
          return;
        }
        
        const docs = snapshot.docs;

        // Chunk deletions into batches of 500 (Firestore limit)
        for (let i = 0; i < docs.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 500);
          
          chunk.forEach((docSnap) => {
            // Preserve admin accounts in 'users' collection
            if (collName === 'users') {
              const userData = docSnap.data();
              const adminNumbers = ['0711452788', '12345678'];
              if (userData.role === 'admin' || adminNumbers.includes(userData.mobile)) {
                return;
              }
            }
            batch.delete(docSnap.ref);
          });
          
          try {
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, collName);
            return;
          }
        }
      }

      showMessage("Database cleared successfully! (Admins preserved)\n\nNote: Mobile numbers are still registered in Firebase Auth. To reuse them, delete users from the Firebase Console Auth tab.", 'success');
      setShowClearConfirm(false);
    } catch (err) {
      console.error("Error clearing database:", err);
      showMessage("Failed to clear database. Check console for details.", 'error');
    } finally {
      setIsClearingData(false);
    }
  };

  const handleFixBalances = async () => {
    setIsFixingBalances(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      let count = 0;

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const uid = userDoc.id;

        // Fetch all transactions for this user
        const txQuery = query(collection(db, 'transactions'), where('uid', '==', uid));
        const txSnap = await getDocs(txQuery);
        
        let calculatedBalance = 0;
        txSnap.docs.forEach(txDoc => {
          calculatedBalance += txDoc.data().amount;
        });

        // Also check pending withdrawals/deposits? 
        // Usually balance is updated on approval, and transactions are created then too.
        // So summing transactions should be accurate if transactions are always created.

        if (Math.abs(userData.balance - calculatedBalance) > 0.01) {
          batch.update(userDoc.ref, { balance: calculatedBalance });
          count++;
        }
      }

      await batch.commit();
      showMessage(`Balances synchronized for ${count} users.`, 'success');
      setShowFixConfirm(false);
    } catch (err) {
      console.error("Error fixing balances:", err);
      showMessage("Failed to fix balances.", 'error');
    } finally {
      setIsFixingBalances(false);
    }
  };

  const handleToggleBan = async (user: UserProfile) => {
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    try {
      await updateDoc(doc(db, 'users', user.uid), { status: newStatus });
      showMessage(`User ${user.mobile} ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully.`, 'success');
    } catch (err) {
      console.error(err);
      showMessage('Error updating user status', 'error');
    }
  };

  const handleSaveUserEdit = async () => {
    if (!selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), { 
        balance: editFormData.balance,
        withdrawableBalance: editFormData.withdrawableBalance,
        vipLevel: editFormData.vipLevel
      });
      showMessage('User updated successfully!', 'success');
      setShowEditUser(false);
    } catch (err) {
      console.error(err);
      showMessage('Error updating user', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUsers(true);
    try {
      const batch = writeBatch(db);
      const uid = userToDelete.uid;

      // 1. Delete user document
      batch.delete(doc(db, 'users', uid));

      // 2. Find and delete all related documents
      const collectionsToClean = [
        'deposits',
        'withdrawals',
        'transactions',
        'user_task_completions',
        'notifications'
      ];

      for (const collName of collectionsToClean) {
        const q = query(collection(db, collName), where('uid', '==', uid));
        const snap = await getDocs(q);
        snap.docs.forEach(d => batch.delete(d.ref));
      }

      await batch.commit();
      showMessage('User and all related data deleted successfully.', 'success');
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      showMessage('Error deleting user data', 'error');
    } finally {
      setIsDeletingUsers(false);
    }
  };

  const totalDeposits = deposits.filter(d => d.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);
  const totalWithdrawals = withdrawals.filter(w => w.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = withdrawals.filter(w => w.status === 'pending').length + deposits.filter(d => d.status === 'pending').length;

  const filteredUsers = users.filter(u => 
    u.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeposits = deposits.filter(d => {
    const user = users.find(u => u.uid === d.uid);
    const matchesSearch = (
      user?.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.uid.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesFilter = showPendingOnly ? d.status === 'pending' : true;
    return matchesSearch && matchesFilter;
  });

  const filteredWithdrawals = withdrawals.filter(w => {
    const user = users.find(u => u.uid === w.uid);
    const matchesSearch = (
      user?.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.bankDetails.accNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.bankDetails.accName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesFilter = showPendingOnly ? w.status === 'pending' : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="relative z-10 pointer-events-auto p-6 space-y-8 bg-[#0a0a0c] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-[#f59e0b] rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Shield size={32} className="text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Admin Dashboard</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Cyber Click Management</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-6 py-2.5 bg-white text-yellow-600 rounded-xl font-black text-sm border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            <History size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            onClick={() => setShowFixConfirm(true)}
            disabled={isFixingBalances}
            className="px-6 py-2.5 bg-white text-emerald-500 rounded-xl font-black text-sm border border-emerald-100 hover:bg-emerald-50 transition-all disabled:opacity-50"
          >
            {isFixingBalances ? 'Fixing...' : 'Fix Balances'}
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)}
            disabled={isClearingData}
            className="px-6 py-2.5 bg-white text-rose-500 rounded-xl font-black text-sm border border-rose-100 hover:bg-rose-50 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Trash2 size={16} />
            <span>{isClearingData ? 'Clearing...' : 'Clear All Data'}</span>
          </button>
          <button 
            onClick={() => signOut(auth)}
            className="px-6 py-2.5 bg-white text-rose-500 rounded-xl font-black text-sm border border-rose-100 hover:bg-rose-50 transition-all flex items-center space-x-2"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<User className="text-yellow-500" size={20} />}
          label="Total Users"
          value={users.length.toString()}
          valueColor="text-white"
        />
        <StatCard 
          icon={<ArrowDownLeft className="text-emerald-500" size={20} />}
          label="Total Deposits"
          value={totalDeposits.toFixed(2)}
          valueColor="text-emerald-500"
        />
        <StatCard 
          icon={<ArrowUpRight className="text-rose-500" size={20} />}
          label="Total Withdrawals"
          value={totalWithdrawals.toFixed(2)}
          valueColor="text-rose-500"
        />
        <StatCard 
          icon={<Settings className="text-yellow-500" size={20} />}
          label="Pending"
          value={pendingCount.toString()}
          valueColor="text-yellow-500"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder={`Search ${activeTab === 'users' ? 'users by mobile' : activeTab === 'deposits' ? 'deposits by mobile' : activeTab === 'withdrawals' ? 'withdrawals by mobile or account' : '...'}`}
              className="w-full pl-12 pr-4 py-3 bg-[#16161a] border border-white/5 rounded-2xl text-white text-sm focus:border-yellow-500/50 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {(activeTab === 'deposits' || activeTab === 'withdrawals') && (
            <button
              onClick={() => setShowPendingOnly(!showPendingOnly)}
              className={`px-6 py-3 rounded-2xl font-black text-sm border transition-all flex items-center space-x-2 whitespace-nowrap ${
                showPendingOnly 
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' 
                : 'bg-[#16161a] border-white/5 text-gray-400 hover:border-white/10'
              }`}
            >
              <Clock size={16} />
              <span>Pending Only</span>
            </button>
          )}
        </div>
        <div className="flex bg-[#16161a] p-1.5 rounded-2xl border border-white/5 overflow-x-auto">
          <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" />
          <TabBtn active={activeTab === 'deposits'} onClick={() => setActiveTab('deposits')} label="Deposits" />
          <TabBtn active={activeTab === 'withdrawals'} onClick={() => setActiveTab('withdrawals')} label="Withdrawals" />
          <TabBtn active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Tasks" />
          <TabBtn active={activeTab === 'giftkeys'} onClick={() => setActiveTab('giftkeys')} label="Gift Keys" />
          <TabBtn active={activeTab === 'system'} onClick={() => setActiveTab('system')} label="System" />
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-9 gap-4 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <span>No.</span>
            <span>Mobile</span>
            <span>Joined</span>
            <span>Referred By</span>
            <span>Deposited</span>
            <span>Balance</span>
            <span>Ref Earnings</span>
            <span>Withdrawable</span>
            <span className="text-right">Actions</span>
          </div>
          {filteredUsers.map((u, idx) => {
            const depositedBalance = deposits
              .filter(d => d.uid === u.uid && d.status === 'approved')
              .reduce((acc, curr) => acc + curr.amount, 0);
            
            const referrer = users.find(user => user.uid === u.referredBy);

            return (
              <div key={u.uid} className="bg-[#16161a] border border-white/5 rounded-3xl p-5 md:grid md:grid-cols-9 md:items-center gap-4 hover:border-white/10 transition-all">
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs font-bold text-gray-500">No: </span>
                  <p className="font-bold text-sm text-gray-500">#{idx + 1}</p>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs font-bold text-gray-500">Mobile: </span>
                  <p className="font-bold text-sm text-white">{u.mobile}</p>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs font-bold text-gray-500">Joined: </span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs font-bold text-gray-500">Referred By: </span>
                  <p className="text-sm text-gray-400">{referrer ? referrer.mobile : 'Direct'}</p>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs font-bold text-gray-500">Deposited: </span>
                  <p className="font-bold text-sm text-emerald-500">Rs. {depositedBalance.toLocaleString()}</p>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs font-bold text-gray-500">Balance: </span>
                  <p className="font-black text-emerald-500">Rs. {u.balance.toLocaleString()}</p>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs font-bold text-gray-500">Ref Earnings: </span>
                  <p className="text-sm text-blue-400">Rs. 0.00</p>
                </div>
                <div className="flex justify-between md:block">
                  <span className="md:hidden text-xs font-bold text-gray-500">Withdrawable: </span>
                  <p className="font-bold text-sm text-white">Rs. {u.balance.toLocaleString()}</p>
                </div>
                <div className="flex justify-end space-x-1 mt-4 md:mt-0">
                  <button 
                    onClick={() => {
                      setSelectedUser(u);
                      setShowUserDashboard(true);
                    }}
                    className="p-2 bg-white/5 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-all border border-cyan-500/20"
                    title="View Dashboard"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedUser(u);
                      setShowUserTransactions(true);
                    }}
                    className="p-2 bg-white/5 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all border border-blue-500/20"
                    title="Transaction History"
                  >
                    <History size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedUser(u);
                      setShowUserReferrals(true);
                    }}
                    className="p-2 bg-white/5 text-purple-400 rounded-lg hover:bg-purple-500/10 transition-all border border-purple-500/20"
                    title="Referral Chain"
                  >
                    <Users size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedUser(u);
                      setEditFormData({ balance: u.balance, withdrawableBalance: u.withdrawableBalance || 0, vipLevel: u.vipLevel });
                      setShowEditUser(true);
                    }}
                    className="p-2 bg-white/5 text-orange-400 rounded-lg hover:bg-orange-500/10 transition-all border border-orange-500/20"
                    title="Edit User"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => handleToggleBan(u)}
                    className={`p-2 bg-white/5 rounded-lg transition-all border ${u.status === 'banned' ? 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10' : 'text-rose-400 border-rose-500/20 hover:bg-rose-500/10'}`}
                    title={u.status === 'banned' ? 'Unban User' : 'Ban User'}
                  >
                    {u.status === 'banned' ? <UserPlus size={16} /> : <Ban size={16} />}
                  </button>
                  <button 
                    onClick={() => {
                      setUserToDelete({ uid: u.uid, mobile: u.mobile });
                      setShowDeleteConfirm(true);
                    }}
                    className="p-2 bg-white/5 text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all border border-rose-500/20"
                    title="Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="bg-[#16161a] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Table Header */}
              <div className="grid grid-cols-8 gap-4 p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">No.</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Mobile</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Amount</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Status</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Method</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Receipt</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Date</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 text-right">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                {filteredDeposits.map((d, idx) => {
                  const user = users.find(u => u.uid === d.uid);
                  return (
                    <div key={d.id} className="grid grid-cols-8 gap-4 p-6 items-center hover:bg-white/[0.02] transition-all group">
                      <div className="text-xs font-bold text-gray-500">#{idx + 1}</div>
                      <div className="text-sm font-bold text-white">{user?.mobile || 'Unknown'}</div>
                      <div className="text-sm font-black text-emerald-500">Rs. {d.amount.toLocaleString()}</div>
                      <div><StatusBadge status={d.status} /></div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {d.accNo === '001022368055' ? 'NALIN' : d.accNo === '001022391633' ? 'Kumara' : (d.bankName || 'Bank')}
                      </div>
                      <div>
                        {d.receiptUrl ? (
                          <button 
                            onClick={() => setSelectedReceipt(d.receiptUrl || null)}
                            className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors flex items-center space-x-1"
                          >
                            <span>View Receipt</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">No Receipt</span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                        {new Date(d.createdAt).toLocaleString()}
                      </div>
                      <div className="flex justify-end gap-2">
                        {d.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveDeposit(d)} 
                              className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => d.id && handleRejectDeposit(d.id)} 
                              className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-all border border-rose-500/20"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'withdrawals' && (
        <div className="bg-[#16161a] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Table Header */}
              <div className="grid grid-cols-10 gap-4 p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">No.</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Mobile</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Amount</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Status</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Method</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Holder Name</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Bank Name</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Bank Account</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Date</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 text-right">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                {filteredWithdrawals.map((w, idx) => {
                  const user = users.find(u => u.uid === w.uid);
                  return (
                    <div key={w.id} className="grid grid-cols-10 gap-4 p-6 items-center hover:bg-white/[0.02] transition-all group">
                      <div className="text-xs font-bold text-gray-500">#{idx + 1}</div>
                      <div className="text-sm font-bold text-white">{user?.mobile || 'Unknown'}</div>
                      <div>
                        <div className="text-sm font-black text-rose-500">Rs. {w.amount.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Net: Rs. {(w.amount - w.fee).toLocaleString()}</div>
                      </div>
                      <div><StatusBadge status={w.status} /></div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Transfer</div>
                      <div className="text-sm font-bold text-white">{w.bankDetails.accName}</div>
                      <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider">{w.bankDetails.bankName}</div>
                      <div className="text-sm font-bold text-white tracking-tight">{w.bankDetails.accNo}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                        {new Date(w.createdAt).toLocaleString()}
                      </div>
                      <div className="flex justify-end gap-2">
                        {w.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveWithdrawal(w)} 
                              className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => w.id && handleRejectWithdrawal(w.id, w.uid, w.amount)} 
                              className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-all border border-rose-500/20"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-[#16161a] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-black text-white">Add New Ad Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Task Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Watch Ad 1" 
                  className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white text-sm focus:border-yellow-500/50 transition-all outline-none"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Ad URL</label>
                <input 
                  type="text" 
                  placeholder="Adsterra link" 
                  className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white text-sm focus:border-yellow-500/50 transition-all outline-none"
                  value={newTask.adUrl}
                  onChange={e => setNewTask({...newTask, adUrl: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Reward (LKR)</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white text-sm focus:border-yellow-500/50 transition-all outline-none"
                  value={newTask.reward}
                  onChange={e => setNewTask({...newTask, reward: Number(e.target.value)})}
                />
              </div>
            </div>
            <button 
              onClick={handleAddTask}
              className="w-full py-4 bg-yellow-500 text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
            >
              Create Task
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adTasks.map(t => (
              <div key={t.id} className="bg-[#16161a] border border-white/5 p-6 rounded-3xl flex justify-between items-center hover:border-white/10 transition-all">
                <div>
                  <p className="font-bold text-white">{t.title}</p>
                  <p className="text-[10px] text-gray-500 font-bold truncate max-w-[150px]">{t.adUrl}</p>
                  <p className="text-xs font-black text-emerald-500 mt-1">+{t.reward} LKR</p>
                </div>
                <button 
                  onClick={() => t.id && handleDeleteAdTask(t.id)}
                  className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all border border-rose-500/20"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'giftkeys' && (
        <div className="space-y-6">
          <div className="bg-[#16161a] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-black text-white">Generate Gift Keys</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Gift Key</label>
                <input 
                  type="text" 
                  placeholder="e.g. WELCOME2024" 
                  className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white text-sm font-bold uppercase focus:border-yellow-500/50 transition-all outline-none"
                  value={newGiftKey.key}
                  onChange={e => setNewGiftKey({...newGiftKey, key: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Reward (LKR)</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white text-sm focus:border-yellow-500/50 transition-all outline-none"
                  value={newGiftKey.reward}
                  onChange={e => setNewGiftKey({...newGiftKey, reward: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Max Uses</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white text-sm focus:border-yellow-500/50 transition-all outline-none"
                  value={newGiftKey.maxUses}
                  onChange={e => setNewGiftKey({...newGiftKey, maxUses: Number(e.target.value)})}
                />
              </div>
            </div>
            <button 
              onClick={handleAddGiftKey}
              className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              Create Gift Key
            </button>
          </div>

          <div className="bg-[#16161a] border border-white/5 p-8 rounded-[2.5rem] space-y-4">
            <h3 className="text-xl font-black text-white">Bulk Import Keys</h3>
            <textarea 
              className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white text-sm font-mono h-32 focus:border-yellow-500/50 transition-all outline-none"
              placeholder="WIN01, GIFT1, NEXT2..."
              value={bulkKeys}
              onChange={e => setBulkKeys(e.target.value)}
            />
            <button 
              onClick={handleBulkImport}
              disabled={isImporting || !bulkKeys.trim()}
              className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all shadow-lg disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Bulk Import (10 LKR Reward)'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {giftKeys.map(k => (
              <div key={k.id} className="bg-[#16161a] border border-white/5 p-6 rounded-3xl space-y-3 hover:border-white/10 transition-all">
                <div className="flex justify-between items-center">
                  <p className="font-black text-lg text-yellow-500 tracking-wider font-mono">{k.key}</p>
                  <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-lg text-[10px] font-black uppercase border border-white/10">
                    {k.usedCount} / {k.maxUses}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <p className="text-sm font-bold text-white">Rs. {k.reward}</p>
                  <button 
                    onClick={() => k.id && handleDeleteGiftKey(k.id)}
                    className="text-rose-500 hover:text-rose-400 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-[#16161a] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
            <div className="flex items-center space-x-4 text-rose-500">
              <AlertTriangle size={32} />
              <div>
                <h3 className="text-xl font-black text-white">System Management</h3>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Danger Zone</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <h4 className="font-bold text-white">Clear All Data</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  This will permanently delete all users (except admins), deposits, withdrawals, transactions, tasks, and gift keys from Firestore. 
                  <br /><br />
                  <span className="text-rose-400 font-bold">Note:</span> Mobile numbers will remain in Firebase Auth. You must manually delete them from the Firebase Console to reuse them for new registrations.
                </p>
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20"
                >
                  Clear Database
                </button>
              </div>

              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4 opacity-50">
                <h4 className="font-bold text-white">Maintenance Mode</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Temporarily disable user access to the platform for maintenance.
                </p>
                <button disabled className="w-full py-4 bg-white/10 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modals */}
      {/* Clear Data Confirmation */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#16161a] border border-rose-500/30 rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertTriangle className="text-rose-500" size={40} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-white">Are you absolutely sure?</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  This will permanently delete all user data, transactions, and requests. Only admin accounts will be preserved. This action is irreversible.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleClearAllData}
                  disabled={isClearingData}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {isClearingData ? 'Clearing...' : 'Yes, Clear All'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditUser && selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#16161a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white">Edit User: {selectedUser.mobile}</h3>
                <button onClick={() => setShowEditUser(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Balance (LKR)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-yellow-500/50"
                    value={editFormData.balance}
                    onChange={e => setEditFormData({...editFormData, balance: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Withdrawable Balance</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-yellow-500/50"
                    value={editFormData.withdrawableBalance}
                    onChange={e => setEditFormData({...editFormData, withdrawableBalance: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">VIP Level</label>
                  <select 
                    className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-yellow-500/50 appearance-none"
                    value={editFormData.vipLevel}
                    onChange={e => setEditFormData({...editFormData, vipLevel: Number(e.target.value)})}
                  >
                    <option value={0} className="bg-[#16161a]">No Package</option>
                    {VIP_LEVELS.map(v => (
                      <option key={v.level} value={v.level} className="bg-[#16161a]">
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleSaveUserEdit}
                className="w-full py-4 bg-yellow-500 text-black rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-400 transition-all"
              >
                Save Changes
              </button>
            </motion.div>
          </div>
        )}

        {showUserTransactions && selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#16161a] border border-white/10 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">Transactions: {selectedUser.mobile}</h3>
                <button onClick={() => setShowUserTransactions(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <TransactionHistory profile={selectedUser} />
              </div>
            </motion.div>
          </div>
        )}

        {showUserReferrals && selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#16161a] border border-white/10 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">Referrals: {selectedUser.mobile}</h3>
                <button onClick={() => setShowUserReferrals(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <Team profile={selectedUser} isAdmin={true} />
              </div>
            </motion.div>
          </div>
        )}

        {showUserDashboard && selectedUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#16161a] border border-white/10 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white">User Overview: {selectedUser.mobile}</h3>
                <button onClick={() => setShowUserDashboard(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard icon={<Wallet size={16}/>} label="Balance" value={`Rs. ${selectedUser.balance.toLocaleString()}`} valueColor="text-emerald-500" />
                  <StatCard icon={<TrendingUp size={16}/>} label="Total Profits" value={`Rs. ${selectedUser.totalProfits.toLocaleString()}`} valueColor="text-emerald-500" />
                  <StatCard icon={<ArrowUpRight size={16}/>} label="Total Assets" value={`Rs. ${selectedUser.totalAssets.toLocaleString()}`} valueColor="text-white" />
                  <StatCard icon={<ArrowDownLeft size={16}/>} label="Total Withdrawals" value={`Rs. ${selectedUser.totalWithdrawals.toLocaleString()}`} valueColor="text-rose-500" />
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Account Details</h4>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-[10px] font-black uppercase">UID</p>
                      <p className="font-mono text-xs">{selectedUser.uid}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] font-black uppercase">Referral Code</p>
                      <p className="font-bold">{selectedUser.referralCode}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] font-black uppercase">Joined At</p>
                      <p className="font-bold">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] font-black uppercase">Status</p>
                      <StatusBadge status={selectedUser.status} />
                    </div>
                  </div>
                </div>
                {selectedUser.savedBankDetails && (
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-500">Bank Details</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-white">{selectedUser.savedBankDetails.accName}</p>
                      <p className="text-xs text-gray-400">{selectedUser.savedBankDetails.bankName} - {selectedUser.savedBankDetails.accNo}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        {showFixConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#16161a] border border-emerald-500/20 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <Shield size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Sync Balances?</h3>
              <p className="text-gray-500 mb-8 leading-relaxed font-medium">
                This will recalculate all user balances based on their transaction history. This may take a moment.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleFixBalances}
                  disabled={isFixingBalances}
                  className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isFixingBalances ? 'Fixing...' : 'Yes, Sync Now'}
                </button>
                <button
                  onClick={() => setShowFixConfirm(false)}
                  className="w-full py-4 bg-white/5 text-white rounded-2xl font-black border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#16161a] border border-rose-500/30 rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                <Trash2 className="text-rose-500" size={40} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-white">Delete User?</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  Are you sure you want to delete user <span className="text-white font-bold">{userToDelete.mobile}</span>? This action cannot be undone and all their data will be lost.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteUser}
                  disabled={isDeletingUsers}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {isDeletingUsers ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Toast Message */}
      <AnimatePresence>
        {adminMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] px-6 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 min-w-[300px] ${
              adminMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              adminMessage.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}
          >
            {adminMessage.type === 'success' ? <CheckCircle size={20} /> : 
             adminMessage.type === 'error' ? <AlertTriangle size={20} /> : 
             <Shield size={20} />}
            <span className="font-bold text-sm">{adminMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Image Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            >
              <button
                onClick={() => setSelectedReceipt(null)}
                className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <img 
                src={selectedReceipt} 
                alt="Deposit Receipt" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabBtn({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center space-x-2 ${
        active 
          ? 'bg-white text-black shadow-lg shadow-white/5' 
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, valueColor }: { icon: React.ReactNode, label: string, value: string, valueColor: string }) {
  return (
    <div className="bg-[#16161a] border border-white/5 rounded-3xl p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className={`text-3xl font-black tracking-tight ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  );
}
