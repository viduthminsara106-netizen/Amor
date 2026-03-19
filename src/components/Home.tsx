import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowDownToLine, HelpCircle, Users, Download, Activity, UserPlus, ChevronRight, TrendingUp as TrendingUpIcon, Star, Gift, Zap, X, Loader2, Send } from 'lucide-react';
import { UserProfile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import DailyBonus from './DailyBonus';
import DownloadApp from './DownloadApp';
import HelpCenter from './HelpCenter';
import Modal from './Modal';

interface MarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function Home({ profile, onNavigate }: { profile: UserProfile | null, onNavigate: (tab: string) => void }) {
  const { t } = useLanguage();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);

  const banners = [
    { title: "Platform Overview", desc: "AuraTradeLKR is Sri Lanka's leading AI-driven trading platform.", image: "https://images.unsplash.com/photo-1611974717484-788cff8fca51?auto=format&fit=crop&w=800&q=80" },
    { title: "How to Start", desc: "Deposit LKR, activate an AI bot, and start earning daily profits.", image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=800&q=80" },
    { title: "Trading Hours", desc: "Our advanced AI bots operate 24/7 in global crypto markets.", image: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=800&q=80" },
    { title: "Withdrawal Policy", desc: "Withdrawals are processed daily from 9:00 AM to 6:00 PM LKR.", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80" },
    { title: "Referral System", desc: "Invite friends and earn 25% commission on their first deposit.", image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=800&q=80" },
    { title: "Package Benefits", desc: "Higher packages unlock higher daily profit rates with AI bot trading.", image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80" },
    { title: "Security First", desc: "Your assets are protected by bank-grade encryption and security.", image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80" },
    { title: "Official Support", desc: "Join our Telegram channel for 24/7 expert customer assistance.", image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80" },
    { title: "Daily Activity", desc: "Check in daily to claim special bonuses and boost your balance.", image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80" },
    { title: "Community Rules", desc: "Follow our guidelines for a safe and profitable trading experience.", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000); // Slightly faster rotation

    const fetchMarketData = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1&sparkline=false');
        if (response.status === 429) {
          console.warn('Rate limit hit, skipping update');
          return;
        }
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (Array.isArray(data)) {
          setMarketData(data);
        }
      } catch (error) {
        console.warn('Market data fetch failed, using fallback:', error);
        // Only set fallback if we don't have any data yet
        setMarketData(prev => prev.length > 0 ? prev : [
          { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 67475.70, price_change_percentage_24h: -0.04 },
          { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 3842.50, price_change_percentage_24h: 1.25 },
          { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png', current_price: 592.10, price_change_percentage_24h: 0.45 },
          { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 145.30, price_change_percentage_24h: 2.10 },
          { id: 'ripple', symbol: 'xrp', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price: 0.62, price_change_percentage_24h: -0.15 },
          { id: 'cardano', symbol: 'ada', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', current_price: 0.72, price_change_percentage_24h: 0.85 }
        ]);
      } finally {
        setMarketLoading(false);
      }
    };

    fetchMarketData();
    const marketTimer = setInterval(fetchMarketData, 60000); // Update every 60 seconds instead of 30 to save bandwidth

    return () => {
      clearInterval(timer);
      clearInterval(marketTimer);
    };
  }, []);

  return (
    <div className="pb-6 space-y-6">
      {/* Total Balance Card */}
      <div className="px-4 pt-4">
        <div className="dark-blue-gradient rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="mb-6">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{t.balance}</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-5xl font-black tracking-tight">
                  {profile?.balance.toFixed(2)}
                </h3>
                <span className="text-gray-400 font-bold">LKR</span>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{t.withdrawableBalance}</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-5xl font-black tracking-tight text-green-400">
                  {profile?.withdrawableBalance?.toFixed(2) || '0.00'}
                </h3>
                <span className="text-gray-400 font-bold">LKR</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <div className="bg-[#1a2b3c] rounded-2xl p-3 flex-1 border border-white/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{t.dailyProfit}</p>
                <div className="flex items-center space-x-1 text-yellow-500">
                  <TrendingUpIcon size={12} />
                  <span className="text-sm font-black">{(profile?.dailyProfit || 0).toFixed(2)} LKR</span>
                </div>
              </div>
              <div className="bg-[#1a2b3c] rounded-2xl p-3 flex-1 border border-white/5">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{t.level}</p>
                <div className="flex items-center space-x-1 text-blue-400">
                  <Zap size={12} fill="currentColor" />
                  <span className="text-sm font-black">{profile?.vipLevel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Icon */}
          <div className="absolute top-8 right-8 bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
            <TrendingUpIcon size={24} className="text-yellow-500" />
          </div>
          
          {/* Subtle Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
        </div>
      </div>

      {/* Banner */}
      <div className="px-4">
        <div className="h-56 rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col items-center justify-center text-center text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img 
                src={banners[currentBanner].image} 
                alt={banners[currentBanner].title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 backdrop-blur-[1px]"></div>
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <h3 className="text-3xl font-black tracking-tighter leading-none uppercase">{banners[currentBanner].title}</h3>
                <p className="text-sm font-medium text-white/80 max-w-[280px] mx-auto leading-tight">{banners[currentBanner].desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Pagination */}
          <div className="absolute bottom-4 flex space-x-2 z-20">
            {banners.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${currentBanner === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-4">
        <div className="grid grid-cols-4 gap-y-8">
          <GridItem icon={<Wallet size={24} />} label={t.recharge} color="bg-orange-50 text-orange-500" onClick={() => onNavigate('recharge')} />
          <GridItem icon={<ArrowDownToLine size={24} />} label={t.withdraw} color="bg-green-50 text-green-500" onClick={() => onNavigate('withdraw')} />
          <GridItem icon={<HelpCircle size={24} />} label={t.helpCenter} color="bg-blue-50 text-blue-500" onClick={() => setShowHelp(true)} />
          <GridItem icon={<Users size={24} />} label={t.team} color="bg-purple-50 text-purple-500" onClick={() => onNavigate('team')} />
          <GridItem icon={<Download size={24} />} label={t.downloadApp} color="bg-pink-50 text-pink-500" onClick={() => setShowDownload(true)} />
          <GridItem icon={<Activity size={24} />} label={t.activity} color="bg-cyan-50 text-cyan-500" onClick={() => onNavigate('activity')} />
          <GridItem icon={<Send size={24} />} label={t.telegramChannel} color="bg-blue-50 text-blue-600" onClick={() => window.open('https://t.me/auratrade09', '_blank')} />
          <GridItem icon={<Gift size={24} />} label="Rewards" color="bg-red-50 text-red-500" onClick={() => setShowDailyBonus(true)} />
        </div>
      </div>

      {/* Live Market Section */}
      <div className="px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-gray-500 font-bold text-sm">Live Market</h4>
          {marketLoading && <Loader2 size={14} className="animate-spin text-gray-400" />}
        </div>
        <div className="space-y-2">
          {marketData.length > 0 ? (
            marketData.map((coin) => (
              <MarketRow 
                key={coin.id}
                image={coin.image}
                name={`${coin.symbol.toUpperCase()}/USD`}
                price={coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                change={`${coin.price_change_percentage_24h.toFixed(2)}%`}
                up={coin.price_change_percentage_24h >= 0}
              />
            ))
          ) : (
            <>
              <MarketRow symbol="BT" name="BTC/USD" price="67475.70" change="-0.04%" color="bg-orange-100 text-orange-600" />
              <MarketRow symbol="ET" name="ETH/USD" price="3842.50" change="+1.25%" color="bg-blue-100 text-blue-600" up />
              <MarketRow symbol="BN" name="BNB/USD" price="592.10" change="+0.45%" color="bg-yellow-100 text-yellow-600" up />
            </>
          )}
        </div>
      </div>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-yellow-100"
            >
              <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp size={40} className="text-yellow-600" />
              </div>
              <h3 className="text-2xl font-black yellow-text-gradient mb-2">Welcome to AuraTradeLKR</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Start your premium trading journey today with our advanced auto-bot system.
              </p>
              <button
                onClick={() => setShowWelcome(false)}
                className="w-full py-4 yellow-gradient text-white rounded-2xl font-bold shadow-lg shadow-yellow-200"
              >
                Get Started
              </button>
              <button
                onClick={() => window.open('https://t.me/auratrade09', '_blank')}
                className="w-full mt-3 py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold flex items-center justify-center space-x-2 border border-blue-100"
              >
                <Send size={18} />
                <span>Join Telegram Channel</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Daily Bonus Modal */}
      <AnimatePresence>
        {showDailyBonus && (
          <Modal title="Daily Gift Key" onClose={() => setShowDailyBonus(false)}>
            <DailyBonus profile={profile} onClose={() => setShowDailyBonus(false)} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Download Modal */}
      <AnimatePresence>
        {showDownload && (
          <Modal title="Download App" onClose={() => setShowDownload(false)}>
            <DownloadApp />
          </Modal>
        )}
      </AnimatePresence>

      {/* Help Center Modal */}
      <AnimatePresence>
        {showHelp && (
          <Modal title="Support" onClose={() => setShowHelp(false)}>
            <HelpCenter />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function GridItem({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center space-y-2 group">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
        {icon}
      </div>
      <span className="text-[11px] font-bold text-gray-500">{label}</span>
    </button>
  );
}

interface MarketRowProps {
  key?: any;
  symbol?: string;
  name: string;
  price: string;
  change: string;
  color?: string;
  up?: boolean;
  image?: string;
}

function MarketRow({ symbol, name, price, change, color, up, image }: MarketRowProps) {
  return (
    <div className="flex justify-between items-center py-2">
      <div className="flex items-center space-x-3">
        {image ? (
          <img src={image} alt={name} className="w-10 h-10 rounded-full object-contain bg-gray-50 p-1" referrerPolicy="no-referrer" />
        ) : (
          <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center font-bold text-xs`}>
            {symbol}
          </div>
        )}
        <span className="font-bold text-gray-800">{name}</span>
      </div>
      <div className="text-right">
        <p className="font-black text-gray-900">{price}</p>
        <div className={`flex items-center justify-end space-x-1 text-[11px] font-bold ${up ? 'text-green-500' : 'text-red-500'}`}>
          {up ? <TrendingUpIcon size={10} /> : <TrendingUpIcon size={10} className="rotate-180" />}
          <span>{change}</span>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center space-y-2">
      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-yellow-600 hover:bg-yellow-50 transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-gray-500 uppercase">{label}</span>
    </button>
  );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
