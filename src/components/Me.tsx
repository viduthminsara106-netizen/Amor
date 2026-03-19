import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Shield, 
  CreditCard, 
  Users, 
  Headphones, 
  LogOut, 
  ChevronRight, 
  Star, 
  Wallet, 
  History, 
  Download, 
  Bell,
  Info,
  Smartphone,
  Send,
  HelpCircle,
  BookOpen,
  Globe,
  TrendingUp,
  Zap
} from 'lucide-react';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import TransactionHistory from './TransactionHistory';
import HelpCenter from './HelpCenter';
import DownloadApp from './DownloadApp';
import SecurityCenter from './SecurityCenter';
import Notifications from './Notifications';
import AboutUs from './AboutUs';
import CommonProblems from './CommonProblems';
import TradingTutorial from './TradingTutorial';
import Referrals from './Referrals';
import Modal from './Modal';

export default function Me({ profile, onSignOut, onNavigate }: { profile: UserProfile | null, onSignOut: () => void, onNavigate: (tab: string) => void }) {
  const { language, setLanguage, t } = useLanguage();
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showProblems, setShowProblems] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);

  const handleLogout = () => {
    onSignOut();
  };

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Profile Header */}
      <div className="dark-blue-gradient pt-16 pb-24 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-white/10 rounded-[2rem] backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
                alt="Avatar" 
                className="w-20 h-20"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white p-2 rounded-xl border-4 border-[#001d3d]">
              <Star size={16} fill="currentColor" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">{profile?.mobile || 'User'}</h2>
            <div className="flex items-center space-x-2">
              <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-yellow-500/20">
                Package {profile?.vipLevel}
              </span>
            </div>
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">ID: {profile?.uid.slice(0, 8)}</p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px]"></div>
      </div>

      {/* Balance Card Overlay */}
      <div className="px-6 -mt-12">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{t.balance}</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-black text-gray-900">{profile?.balance.toFixed(2)}</h3>
              <span className="text-gray-400 font-bold text-xs">LKR</span>
            </div>
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-2">Withdrawable: {(profile?.withdrawableBalance || 0).toFixed(2)} LKR</p>
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600 hover:bg-yellow-100 transition-colors"
          >
            <History size={24} />
          </button>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-6 mt-8 space-y-6">
        <MenuSection title="Account Settings">
          <MenuItem icon={<Shield size={20} />} label={t.securityCenter} color="text-green-500" onClick={() => setShowSecurity(true)} />
          <MenuItem icon={<Bell size={20} />} label="Notifications" color="text-orange-500" onClick={() => setShowNotifications(true)} />
          <MenuItem icon={<History size={20} />} label={t.transactionHistory} color="text-blue-500" onClick={() => setShowHistory(true)} />
          <MenuItem icon={<Users size={20} />} label="Referrals" color="text-yellow-500" onClick={() => setShowReferrals(true)} />
          <MenuItem icon={<Globe size={20} />} label={t.languageSettings} color="text-indigo-500" onClick={() => setShowLanguage(true)} />
        </MenuSection>

        <MenuSection title="Support & Community">
          <MenuItem icon={<Globe size={20} />} label="Visit Official Website" color="text-blue-400" onClick={() => window.open('https://www.tradingview.com', '_blank')} />
          <MenuItem icon={<Headphones size={20} />} label={t.helpCenter} color="text-purple-500" onClick={() => setShowHelp(true)} />
          <MenuItem icon={<HelpCircle size={20} />} label={t.commonProblems} color="text-yellow-600" onClick={() => setShowProblems(true)} />
          <MenuItem icon={<BookOpen size={20} />} label={t.tradingTutorial} color="text-emerald-500" onClick={() => setShowTutorial(true)} />
          <MenuItem icon={<Send size={20} />} label={t.telegramChannel} color="text-blue-600" onClick={() => window.open('https://t.me/auratrade09', '_blank')} />
          <MenuItem icon={<Download size={20} />} label={t.downloadApp} color="text-pink-500" onClick={() => setShowDownload(true)} />
        </MenuSection>

        <MenuSection title="About Platform">
          <MenuItem icon={<Info size={20} />} label={t.aboutUs} color="text-gray-600" onClick={() => setShowAbout(true)} />
          <MenuItem icon={<Star size={20} />} label="Package Benefits" color="text-yellow-500" onClick={() => onNavigate('vip')} />
        </MenuSection>

        <button 
          onClick={handleLogout}
          className="w-full bg-white rounded-[2rem] p-6 flex items-center justify-center space-x-3 text-red-500 font-black shadow-sm border border-red-50 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span>{t.signOut}</span>
        </button>

        <div className="text-center space-y-1 py-4">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">AuraTradeLKR v2.4.0</p>
          <p className="text-[10px] font-bold text-gray-200">Premium Trading Experience</p>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showHistory && (
          <Modal title="Transaction History" onClose={() => setShowHistory(false)}>
            <TransactionHistory profile={profile} />
          </Modal>
        )}
        {showHelp && (
          <Modal title="Support" onClose={() => setShowHelp(false)}>
            <HelpCenter />
          </Modal>
        )}
        {showDownload && (
          <Modal title="Download App" onClose={() => setShowDownload(false)}>
            <DownloadApp />
          </Modal>
        )}
        {showSecurity && (
          <Modal title="Security Center" onClose={() => setShowSecurity(false)}>
            <SecurityCenter onClose={() => setShowSecurity(false)} />
          </Modal>
        )}
        {showNotifications && (
          <Modal title="Notifications" onClose={() => setShowNotifications(false)}>
            <Notifications uid={profile?.uid || ''} />
          </Modal>
        )}
        {showAbout && (
          <Modal title="About AuraTradeLKR" onClose={() => setShowAbout(false)}>
            <AboutUs />
          </Modal>
        )}
        {showProblems && (
          <Modal title="Common Problems" onClose={() => setShowProblems(false)}>
            <CommonProblems />
          </Modal>
        )}
        {showTutorial && (
          <Modal title="Trading Tutorial" onClose={() => setShowTutorial(false)}>
            <TradingTutorial />
          </Modal>
        )}
        {showReferrals && (
          <Modal title="Referrals" onClose={() => setShowReferrals(false)}>
            <Referrals profile={profile} />
          </Modal>
        )}
        {showLanguage && (
          <Modal title={t.languageSettings} onClose={() => setShowLanguage(false)}>
            <div className="space-y-4 p-4">
              <button 
                onClick={() => { setLanguage('en'); setShowLanguage(false); }}
                className={`w-full p-6 rounded-3xl flex items-center justify-between transition-all ${language === 'en' ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-gray-50 border-2 border-transparent'}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">🇺🇸</span>
                  <span className="font-black text-gray-900">English</span>
                </div>
                {language === 'en' && <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-200" />}
              </button>
              <button 
                onClick={() => { setLanguage('si'); setShowLanguage(false); }}
                className={`w-full p-6 rounded-3xl flex items-center justify-between transition-all ${language === 'si' ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-gray-50 border-2 border-transparent'}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">🇱🇰</span>
                  <span className="font-black text-gray-900">සිංහල</span>
                </div>
                {language === 'si' && <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-200" />}
              </button>
              <button 
                onClick={() => { setLanguage('ta'); setShowLanguage(false); }}
                className={`w-full p-6 rounded-3xl flex items-center justify-between transition-all ${language === 'ta' ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-gray-50 border-2 border-transparent'}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">🇱🇰</span>
                  <span className="font-black text-gray-900">தமிழ்</span>
                </div>
                {language === 'ta' && <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-200" />}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</h4>
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100">
        {children}
      </div>
    </div>
  );
}

function MenuItem({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
    >
      <div className="flex items-center space-x-4">
        <div className={`${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <span className="text-sm font-bold text-gray-700">{label}</span>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
    </button>
  );
}
