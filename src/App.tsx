import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, TRANSLATIONS, Language } from './types';
import { useLanguage } from './contexts/LanguageContext';
import Auth from './components/Auth';
import Home from './components/Home';
import TradingView from './components/TradingView';
import VIP from './components/VIP';
import Team from './components/Team';
import Me from './components/Me';
import Activity from './components/Activity';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw';
import AdminPanel from './components/AdminPanel';
import TelegramChatWidget from './components/TelegramChatWidget';
import { Home as HomeIcon, TrendingUp, Shield, Users, User, LayoutDashboard, Ban, LogOut, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    async function testConnection() {
      try {
        const { getDocFromServer } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'platform_settings', 'connection_test'));
      } catch (error: any) {
        if (error.message?.includes('offline') || error.code === 'unavailable') {
          console.error("Firestore connection test failed: The client is offline. Please check your Firebase configuration.");
          setConnectionError(true);
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      } else {
        // Clear login error when a user successfully logs in and has a profile
        setLoginError(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          
          // Two-way sync for mobile number recovery
          let currentMobile = data.mobile;
          
          // 1. If profile has '0000000000', try to recover from Auth
          if (currentMobile === '0000000000') {
            if (user.displayName && /^\d+$/.test(user.displayName)) {
              currentMobile = user.displayName;
            } else if (user.email && user.email.endsWith('@auratrade.com')) {
              currentMobile = user.email.split('@')[0];
            }
            
            if (currentMobile !== '0000000000') {
              try {
                await updateDoc(doc(db, 'users', user.uid), { mobile: currentMobile });
                data.mobile = currentMobile;
              } catch (e) {
                console.error("Mobile sync error:", e);
              }
            }
          } 
          // 2. If Auth has no displayName but profile has a valid mobile, sync to Auth
          else if (!user.displayName && currentMobile && currentMobile !== '0000000000') {
            try {
              const { updateProfile } = await import('firebase/auth');
              await updateProfile(user, { displayName: currentMobile });
            } catch (e) {
              console.error("Auth profile sync error:", e);
            }
          }
          
          // Force admin role for the specific admin numbers or email
          const adminNumbers = ['0711452788', '0711452778', '12345678'];
          const adminEmails = ['viduthminsara106@gmail.com'];
          const normalizedMobile = data.mobile.replace(/^0/, '');
          const isAdminUser = adminNumbers.includes(data.mobile) || 
                             adminNumbers.includes(normalizedMobile) || 
                             adminEmails.includes(data.email) ||
                             (user.email && adminEmails.includes(user.email));
          
          // Daily reset logic for trades
          const today = new Date().toISOString().split('T')[0];
          if (data.lastSignInDate !== today) {
            try {
              await updateDoc(doc(db, 'users', user.uid), {
                dailyTradesDone: 0,
                dailyProfit: 0,
                lastSignInDate: today
              });
              data.dailyTradesDone = 0;
              data.dailyProfit = 0;
              data.lastSignInDate = today;
            } catch (e) {
              console.error("Daily reset error:", e);
            }
          }

          if (isAdminUser && data.role !== 'admin') {
            try {
              await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
              setProfile({ uid: snapshot.id, ...data, role: 'admin' });
            } catch (e) {
              console.error("Admin role sync error:", e);
              setProfile({ uid: snapshot.id, ...data } as UserProfile);
            }
          } else if (!isAdminUser && data.role === 'admin') {
            try {
              await updateDoc(doc(db, 'users', user.uid), { role: 'user' });
              setProfile({ uid: snapshot.id, ...data, role: 'user' });
            } catch (e) {
              console.error("Admin role sync error:", e);
              setProfile({ uid: snapshot.id, ...data } as UserProfile);
            }
          } else {
            setProfile({ uid: snapshot.id, ...data } as UserProfile);
          }
          setLoading(false);
        } else {
          // If profile doesn't exist, it might be a new registration in progress
          // Check if user is very new (less than 30 seconds old)
          const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
          const now = new Date().getTime();
          // Use a more generous grace period and also check if we just registered in this session
          const isNewUser = (Math.abs(now - creationTime) < 45000) || sessionStorage.getItem('justRegistered') === 'true';

          if (!isNewUser) {
            // If profile doesn't exist and not a new user, it means the account was deleted by admin
            setLoginError("Account profile not found. Please contact support.");
            await signOut(auth);
            setProfile(null);
            setLoading(false);
          } else {
            // Just wait for the profile to be created
            console.log("Waiting for profile creation for new user...");
            // Set a timeout to prevent infinite loading
            const timeout = setTimeout(() => {
              if (!profile && user) {
                console.log("Profile creation timeout reached");
                setLoading(false);
              }
            }, 10000);
            return () => clearTimeout(timeout);
          }
        }
      }, (error) => {
        console.error("Profile fetch error:", error);
        // If it's a permission error, it might be because the user is banned or profile is missing
        if (error.message.includes('permission-denied')) {
          setLoginError("Access denied. Please contact support.");
          signOut(auth);
        }
        setLoading(false);
      });
      return unsubscribe;
    }
  }, [user]);

  if (connectionError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Ban size={40} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h1>
        <p className="text-gray-500 max-w-xs mb-6">
          Could not connect to the database. This might be due to a configuration issue or a temporary network problem.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-yellow-500 text-white rounded-xl font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Auth externalError={loginError} onClearError={() => setLoginError(null)} />;
  }

  if (profile?.status === 'banned') {
    return (
      <div className="min-h-screen bg-[#000814] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
          <Ban size={48} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Account Banned</h1>
        <p className="text-gray-400 max-w-xs mb-8">
          Your account has been suspended for violating our terms of service. Please contact support if you believe this is a mistake.
        </p>
        <button
          onClick={() => signOut(auth)}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10 flex items-center space-x-2"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    );
  }

  const renderTab = () => {
    if (profile?.role === 'admin') {
      return <AdminPanel />;
    }

    switch (activeTab) {
      case 'home': return <Home profile={profile} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'trading': return <TradingView profile={profile} />;
      case 'activity': return <Activity profile={profile} onClose={() => setActiveTab('home')} />;
      case 'vip': return <VIP profile={profile} onUnlock={() => setActiveTab('recharge')} />;
      case 'team': return <Team profile={profile} />;
      case 'me': return <Me profile={profile} onSignOut={() => signOut(auth)} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'recharge': return <Deposit profile={profile} onClose={() => setActiveTab('home')} />;
      case 'withdraw': return <Withdraw profile={profile} onClose={() => setActiveTab('home')} />;
      default: return <Home profile={profile} onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  const showNav = !['recharge', 'withdraw', 'activity'].includes(activeTab) && profile?.role !== 'admin';

  return (
    <div className={`min-h-screen bg-gray-50 font-sans text-gray-900 ${showNav ? 'pb-20' : ''}`}>
      {/* Top Header */}
      {showNav && (
        <header className="bg-[#000814] text-white px-4 py-3 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <TrendingUp size={20} className="text-yellow-500" />
            <h1 className="text-lg font-black tracking-tight">
              AuraTrade<span className="text-purple-400">LKR</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Icons removed as per request */}
          </div>
        </header>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={profile?.role === 'admin' ? 'admin' : activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 pointer-events-auto"
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>

      {/* Floating Support Button - Visible on all tabs except for admin */}
      {profile?.role !== 'admin' && <TelegramChatWidget />}

      {/* Bottom Navigation */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-1 flex justify-around items-center z-50">
          <NavButton icon={<HomeIcon size={22} />} label={t.home} active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavButton icon={<TrendingUp size={22} />} label={t.trading} active={activeTab === 'trading'} onClick={() => setActiveTab('trading')} />
          <NavButton icon={<Zap size={22} />} label={t.vip} active={activeTab === 'vip'} onClick={() => setActiveTab('vip')} />
          <NavButton icon={<Users size={22} />} label={t.team} active={activeTab === 'team'} onClick={() => setActiveTab('team')} />
          <NavButton icon={<User size={22} />} label={t.me} active={activeTab === 'me'} onClick={() => setActiveTab('me')} />
        </nav>
      )}
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-1 transition-all ${active ? 'bg-yellow-50/50 rounded-xl' : ''}`}
    >
      <div className={`${active ? 'text-yellow-600' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold mt-1 ${active ? 'text-yellow-600' : 'text-gray-400'}`}>{label}</span>
    </button>
  );
}
