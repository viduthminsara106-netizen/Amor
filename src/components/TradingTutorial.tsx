import React from 'react';
import { PlayCircle, BookOpen, TrendingUp, ShieldCheck, Wallet } from 'lucide-react';

export default function TradingTutorial() {
  const steps = [
    {
      icon: <Wallet className="text-blue-500" />,
      title: "1. Recharge Your Account",
      desc: "Go to the Home tab and click 'Recharge'. Follow the instructions to deposit LKR into your account. Your balance will be updated instantly."
    },
    {
      icon: <BookOpen className="text-orange-500" />,
      title: "2. Choose a VIP Level",
      desc: "Higher VIP levels offer better daily profit percentages. Check the VIP tab to see the requirements and benefits for each level."
    },
    {
      icon: <PlayCircle className="text-green-500" />,
      title: "3. Start Auto-Bot Trading",
      desc: "Navigate to the Trading tab and click 'Start Trading'. Our advanced AI bot will execute trades automatically to generate profits for you."
    },
    {
      icon: <TrendingUp className="text-yellow-500" />,
      title: "4. Collect Daily Profits",
      desc: "Profits are credited to your account daily. You can track your earnings in the 'Activity' or 'Me' tab."
    },
    {
      icon: <ShieldCheck className="text-purple-500" />,
      title: "5. Secure Withdrawals",
      desc: "Withdraw your earnings anytime by going to the 'Withdraw' section. We process withdrawals quickly and securely to your linked account."
    }
  ];

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-6">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <PlayCircle size={32} className="text-green-500" />
        </div>
        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Trading Tutorial</h3>
        <p className="text-xs text-gray-400 font-bold uppercase">Learn how to maximize your earnings</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex space-x-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
              {step.icon}
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-gray-900 text-sm">{step.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
        <p className="text-[10px] font-black text-yellow-700 uppercase mb-1">Pro Tip</p>
        <p className="text-xs text-yellow-800 font-bold">
          Invite your friends to join AuraTradeLKR and earn up to 25% commission on their trading profits!
        </p>
      </div>
    </div>
  );
}
