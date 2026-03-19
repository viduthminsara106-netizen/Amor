import React from 'react';
import { Info, Shield, Globe, Users, Award } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2 mb-6">
        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto">
          <Info size={32} className="text-yellow-600" />
        </div>
        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">About AuraTradeLKR</h3>
        <p className="text-xs text-gray-400 font-bold uppercase">Our Vision and Mission</p>
      </div>

      <div className="space-y-6">
        <section className="space-y-2">
          <h4 className="text-sm font-black text-gray-900 uppercase flex items-center space-x-2">
            <Globe size={16} className="text-blue-500" />
            <span>Who We Are</span>
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            AuraTradeLKR is a leading AI-driven trading platform specifically designed for the Sri Lankan market. We leverage advanced quantitative trading algorithms to provide our users with consistent and secure investment opportunities in the global cryptocurrency markets.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-black text-gray-900 uppercase flex items-center space-x-2">
            <Shield size={16} className="text-green-500" />
            <span>Our Commitment</span>
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Security and transparency are at the core of everything we do. We are committed to providing a safe environment for your capital, utilizing state-of-the-art security protocols and real-time monitoring systems.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-2xl text-center space-y-1">
            <Users size={20} className="mx-auto text-purple-500" />
            <p className="text-[10px] font-black text-gray-400 uppercase">Users</p>
            <p className="text-sm font-black text-gray-900">50,000+</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl text-center space-y-1">
            <Award size={20} className="mx-auto text-orange-500" />
            <p className="text-[10px] font-black text-gray-400 uppercase">Experience</p>
            <p className="text-sm font-black text-gray-900">5+ Years</p>
          </div>
        </div>

        <section className="pt-4 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Version 2.4.0</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase">© 2026 AuraTradeLKR. All rights reserved.</p>
        </section>
      </div>
    </div>
  );
}
