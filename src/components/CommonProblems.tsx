import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommonProblems() {
  const faqs = [
    {
      q: "How do I start trading?",
      a: "To start trading, you first need to recharge your account with a minimum balance. Then, go to the 'Trading' tab and click the 'Start Trading' button. The AI bot will handle the rest."
    },
    {
      q: "What are the withdrawal limits?",
      a: "Minimum withdrawal is 1,000 LKR. Withdrawals are processed within 24 hours. Please ensure your bank details are correctly linked in the 'Withdraw' section."
    },
    {
      q: "How does the VIP system work?",
      a: "VIP levels are determined by your total recharge amount or team size. Higher VIP levels unlock higher daily profit percentages and lower withdrawal fees."
    },
    {
      q: "Is my data secure?",
      a: "Yes, we use industry-standard encryption and secure Firebase infrastructure to protect your personal information and funds."
    },
    {
      q: "What if I forget my password?",
      a: "You can update your password in the 'Security Center' if you are logged in. If you cannot log in, please contact our 24/7 customer support via the 'Help Center'."
    },
    {
      q: "How can I earn referral commissions?",
      a: "Share your unique invitation link found in the 'Team' tab. You earn commissions from the trading profits of your Level 1, Level 2, and Level 3 subordinates."
    }
  ];

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-6">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
          <HelpCircle size={32} className="text-blue-500" />
        </div>
        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Common Problems</h3>
        <p className="text-xs text-gray-400 font-bold uppercase">Frequently Asked Questions</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <FAQItem key={idx} question={faq.q} answer={faq.a} />
        ))}
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string, key?: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-black text-gray-800">{question}</span>
        {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white text-xs font-medium text-gray-500 leading-relaxed border-t border-gray-100">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
