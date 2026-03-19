import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircle, Headphones, ExternalLink } from 'lucide-react';

export default function TelegramChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string, isBot: boolean, time: string }[]>([]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      const timer = setTimeout(() => {
        setMessages([
          { 
            text: "Hello! Welcome to AuraTradeLKR Support. How can we help you today?", 
            isBot: true, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length]);

  const handleOpenTelegram = () => {
    window.open('https://t.me/auratrade09', '_blank');
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[60] border-4 border-white"
      >
        <MessageCircle size={24} fill="currentColor" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-28 right-6 w-[320px] bg-white rounded-[2rem] shadow-2xl z-[70] overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Headphones size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm">Live Support</h4>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    <span className="text-[10px] font-bold uppercase opacity-80">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="h-[300px] p-4 overflow-y-auto bg-gray-50 space-y-4 flex flex-col">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="max-w-[85%] bg-white p-3 rounded-2xl shadow-sm border border-gray-100 self-start"
                >
                  <p className="text-xs font-medium text-gray-700 leading-relaxed">{msg.text}</p>
                  <p className="text-[8px] font-bold text-gray-400 mt-1 text-right uppercase">{msg.time}</p>
                </motion.div>
              ))}
              
              <div className="mt-auto pt-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider text-center">Connect via Telegram</p>
                  <p className="text-[11px] text-blue-800 font-medium text-center leading-relaxed">
                    For real-time assistance and secure communication, please continue on our official Telegram channel.
                  </p>
                  <button
                    onClick={handleOpenTelegram}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                  >
                    <Send size={14} fill="currentColor" />
                    <span>START CHAT NOW</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center space-x-2 text-gray-300">
                <div className="flex-1 h-10 bg-gray-50 rounded-xl px-4 flex items-center">
                  <span className="text-[10px] font-bold uppercase">Type on Telegram...</span>
                </div>
                <button 
                  onClick={handleOpenTelegram}
                  className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
