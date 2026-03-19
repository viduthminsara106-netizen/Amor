import React from 'react';
import { MessageCircle, Send, Headphones, ExternalLink } from 'lucide-react';

export default function HelpCenter() {
  const supportLinks = [
    {
      title: "Official Telegram Channel",
      description: "Get the latest updates, news, and trading signals.",
      url: "https://t.me/auratrade09",
      icon: <Send size={24} className="text-blue-500" />,
      color: "bg-blue-50"
    },
    {
      title: "Telegram Customer Service",
      description: "24/7 support for your account and trading queries.",
      url: "https://t.me/auratrade_support", // Using a placeholder as requested
      icon: <Headphones size={24} className="text-purple-500" />,
      color: "bg-purple-50"
    }
  ];

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
          <MessageCircle size={40} className="text-blue-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-gray-900">Help Center</h3>
          <p className="text-gray-500 font-medium">How can we help you today?</p>
        </div>
      </div>

      <div className="space-y-4">
        {supportLinks.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-100 active:scale-95 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className={`${link.color} p-3 rounded-2xl`}>
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-gray-900">{link.title}</p>
                <p className="text-xs text-gray-400 font-bold leading-relaxed line-clamp-2">{link.description}</p>
              </div>
            </div>
            <ExternalLink size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
          </a>
        ))}
      </div>

      <div className="bg-yellow-50 p-6 rounded-[2rem] border border-yellow-100">
        <p className="text-xs text-yellow-700 font-bold leading-relaxed text-center">
          Our support team typically responds within minutes on Telegram.
        </p>
      </div>
    </div>
  );
}
