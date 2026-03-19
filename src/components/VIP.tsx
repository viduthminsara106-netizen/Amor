import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, ChevronDown, Star, Crown, Gem, Trophy, Flame, Anchor, Zap, Target, Percent } from 'lucide-react';
import { UserProfile, VIP_LEVELS } from '../types';

export default function VIP({ profile, onUnlock }: { profile: UserProfile | null, onUnlock: () => void }) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const getVipGradient = (level: number) => {
    switch (level) {
      case 1: return 'from-gray-700 to-gray-900';
      case 2: return 'from-yellow-700 to-yellow-900';
      case 3: return 'from-blue-900 to-indigo-950';
      case 4: return 'from-cyan-900 to-blue-950';
      case 5: return 'from-orange-800 to-red-950';
      case 6: return 'from-indigo-900 to-purple-950';
      case 7: return 'from-red-900 to-black';
      default: return 'from-gray-800 to-black';
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24">
      {/* Header */}
      <div className="flex flex-col items-center pt-10 pb-6 space-y-2">
        <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.5)]">
          <Zap size={32} className="text-gray-900" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">
          Trading <span className="text-yellow-500">Packages</span>
        </h1>
        <p className="text-gray-500 text-sm font-bold">Unlock exclusive trading packages</p>
      </div>

      {/* VIP Cards List */}
      <div className="px-4 space-y-6">
        {VIP_LEVELS.map((v) => (
          <motion.div
            key={v.level}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative rounded-[2rem] overflow-hidden shadow-2xl ${v.comingSoon ? 'opacity-70' : ''}`}
          >
            {/* Card Background with Chart Pattern */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getVipGradient(v.level)} opacity-95`} />
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 80 L20 60 L40 70 L60 40 L80 50 L100 20" stroke="white" fill="none" strokeWidth="0.5" />
                <path d="M0 90 L20 75 L40 85 L60 65 L80 75 L100 55" stroke="white" fill="none" strokeWidth="0.5" />
              </svg>
            </div>

            <div className="relative p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <Zap size={24} className="text-yellow-500" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">PACKAGE</span>
                      <span className="text-white text-2xl font-black">{v.level}</span>
                      <span className="text-white/40 text-sm font-bold">•</span>
                      <span className="text-white text-lg font-bold">{v.name}</span>
                    </div>
                    <p className="text-white/60 text-sm font-bold">
                      {v.min.toLocaleString()} — {v.max.toLocaleString()} LKR
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-wider">Daily Profit</p>
                  <p className="text-yellow-500 text-xl font-black">
                    {(v.profitMin * 100).toFixed(0)}—{(v.profitMax * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div 
                className="flex justify-between items-center text-white/60 text-xs font-bold cursor-pointer hover:text-white transition-colors py-1"
                onClick={() => setExpandedLevel(expandedLevel === v.level ? null : v.level)}
              >
                <div className="flex items-center space-x-1">
                  <span>{expandedLevel === v.level ? 'Hide details' : 'View details'}</span>
                  <motion.div
                    animate={{ rotate: expandedLevel === v.level ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={14} />
                  </motion.div>
                </div>
                {profile?.vipLevel === v.level && (
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg shadow-green-500/30">Active</span>
                )}
              </div>

              <AnimatePresence>
                {expandedLevel === v.level && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-3 border-t border-white/10">
                      <DetailRow icon={<Zap size={12} />} label="Daily Trades" value="1 Trade" />
                      <DetailRow icon={<Percent size={12} />} label="Commission" value="25% Level 1" />
                      <DetailRow icon={<Shield size={12} />} label="Withdrawal Fee" value="25%" />
                      <DetailRow icon={<Target size={12} />} label="Profit Range" value={`${(v.profitMin * 100).toFixed(0)}% - ${(v.profitMax * 100).toFixed(0)}%`} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!v.comingSoon ? (
                <button
                  onClick={onUnlock}
                  disabled={profile && profile.vipLevel === v.level}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${
                    profile && profile.vipLevel === v.level
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                  }`}
                >
                  {profile && profile.vipLevel === v.level ? 'Active' : `Need ${v.min.toLocaleString()} LKR`}
                </button>
              ) : (
                <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center space-x-2">
                  <Lock size={18} className="text-white/20" />
                  <span className="text-white/20 font-black text-lg uppercase tracking-widest">Coming Soon</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center space-x-2 text-white/40">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-white text-[11px] font-black">{value}</span>
    </div>
  );
}
