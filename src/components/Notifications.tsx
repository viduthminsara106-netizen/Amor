import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Info, AlertCircle, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export default function Notifications({ uid }: { uid: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      setLoading(false);
    }, (error) => {
      console.error("Notifications fetch error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-green-500" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      {notifications.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <Bell size={48} className="mx-auto text-gray-300 opacity-20" />
          <p className="text-gray-400 font-bold">No notifications yet</p>
        </div>
      ) : (
        notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border transition-all ${
              notif.read 
                ? 'bg-gray-50/50 border-gray-100 dark:bg-white/5 dark:border-white/10' 
                : 'bg-white border-yellow-100 shadow-sm dark:bg-yellow-500/5 dark:border-yellow-500/20'
            }`}
            onClick={() => !notif.read && markAsRead(notif.id)}
          >
            <div className="flex space-x-3">
              <div className="mt-1">{getIcon(notif.type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-black ${notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                    {notif.title}
                  </h4>
                  {!notif.read && <span className="w-2 h-2 bg-yellow-500 rounded-full" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {notif.message}
                </p>
                <div className="flex items-center space-x-1 text-[10px] text-gray-400 pt-1">
                  <Clock size={10} />
                  <span>{new Date(notif.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
