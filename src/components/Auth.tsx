import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Phone, Lock, UserPlus, LogIn } from 'lucide-react';
import { UserProfile } from '../types';
import { sanitizeError } from '../utils/errorUtils';

export default function Auth({ externalError, onClearError }: { externalError?: string | null, onClearError?: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    referralCode: new URLSearchParams(window.location.search).get('ref') || ''
  });

  const isReferralDisabled = !!new URLSearchParams(window.location.search).get('ref');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (onClearError) onClearError();

    const adminNumbers = ['0711452788', '0711452778', '12345678'];
    const adminEmails = ['viduthminsara106@gmail.com'];
    
    const checkIsAdmin = (mobile: string, email: string, authEmail?: string | null) => {
      const normalized = mobile.replace(/^0/, '');
      return adminNumbers.includes(mobile) || 
             adminNumbers.includes(normalized) || 
             adminEmails.includes(email) || 
             (authEmail && adminEmails.includes(authEmail));
    };

    const isEmail = formData.email.includes('@');
    const email = isEmail ? formData.email : `${formData.mobile}@auratrade.com`;

    try {

      if (isLogin) {
        sessionStorage.setItem('justRegistered', 'true');
        sessionStorage.setItem('registrationTime', Date.now().toString());
        console.log("Attempting login for:", email);
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, formData.password);
          const user = userCredential.user;

          // Ensure displayName is set to mobile for recovery
          if (!user.displayName) {
            await updateProfile(user, { displayName: formData.mobile });
          }

          // Check if Firestore profile exists
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (!profileDoc.exists()) {
            console.log("Profile missing for user:", user.uid);
            // If profile is missing, check if it's an admin number or admin email
            if (checkIsAdmin(formData.mobile, formData.email, user.email)) {
              console.log("Re-creating admin profile...");
              // Re-create admin profile
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || (isEmail ? formData.email : ''),
                mobile: formData.mobile || user.displayName || '0000000000',
                balance: 0,
                totalAssets: 0,
                totalProfits: 0,
                totalWithdrawals: 0,
                withdrawableBalance: 0,
                vipLevel: 0,
                referralCode: 'ADMIN-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
                createdAt: new Date().toISOString(),
                status: 'active',
                role: 'admin',
                dailyTradesDone: 0,
                dailyProfit: 0
              };
              await setDoc(doc(db, 'users', user.uid), newProfile);
            } else {
              // If profile is missing and not an admin, it means the account was deleted by admin
              await signOut(auth);
              throw new Error("Account profile not found. Please contact support.");
            }
          }
        } catch (loginErr: any) {
          // If admin account doesn't exist yet, create it automatically
          // Newer Firebase versions return 'invalid-credential' for both user-not-found and wrong-password
          const isUserNotFound = loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential';
          
          if (isUserNotFound && checkIsAdmin(formData.mobile, formData.email)) {
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
              const user = userCredential.user;
              
              // Set displayName to mobile for recovery
              await updateProfile(user, { displayName: formData.mobile });
              
              const newProfile: UserProfile = {
                uid: user.uid,
                email: isEmail ? formData.email : '',
                mobile: formData.mobile,
                balance: 0,
                totalAssets: 0,
                totalProfits: 0,
                totalWithdrawals: 0,
                withdrawableBalance: 0,
                vipLevel: 0,
                referralCode: 'ADMIN-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
                createdAt: new Date().toISOString(),
                status: 'active',
                role: 'admin',
                dailyTradesDone: 0,
                dailyProfit: 0
              };
              await setDoc(doc(db, 'users', user.uid), newProfile);
            } catch (createErr: any) {
              // If creation fails because user already exists, it means the original login failed due to wrong password
              if (createErr.code === 'auth/email-already-in-use') {
                throw loginErr;
              }
              throw createErr;
            }
          } else {
            throw loginErr;
          }
        }
      } else {
        console.log("Attempting registration for:", email);
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        const isAdmin = checkIsAdmin(formData.mobile, formData.email);
        
        if (formData.mobile.length < 9 || formData.mobile.length > 10) {
          if (!isAdmin) {
            throw new Error("Invalid mobile number. Please enter a 9 or 10 digit number.");
          }
        }

        let userCredential;
        try {
          userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
        } catch (authErr: any) {
          console.error("Auth creation failed:", authErr);
          throw authErr;
        }

        const user = userCredential.user;

        // Check if mobile number already exists in Firestore (now authenticated)
        const qMobile = query(collection(db, 'users'), where('mobile', '==', formData.mobile));
        const mobileSnap = await getDocs(qMobile);
        if (!mobileSnap.empty) {
          // If mobile exists, this user shouldn't have been able to create a new Auth account 
          // unless it's a zombie account or a different email.
          // We'll clean up the Auth account if it's not the one we just created (unlikely)
          // or just throw error.
          await signOut(auth);
          throw new Error("This mobile number is already registered.");
        }

        // Set displayName to mobile for recovery
        try {
          await updateProfile(user, { displayName: formData.mobile });
        } catch (profileErr) {
          console.error("Profile update failed:", profileErr);
          // Continue anyway, this is not critical
        }

        const newProfile: UserProfile = {
          uid: user.uid,
          email: formData.email || '',
          mobile: formData.mobile,
          balance: 0,
          totalAssets: 0,
          totalProfits: 0,
          totalWithdrawals: 0,
          withdrawableBalance: 0,
          vipLevel: 0,
          referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          referredBy: formData.referralCode || '',
          createdAt: new Date().toISOString(),
          status: 'active',
          role: checkIsAdmin(formData.mobile, formData.email) ? 'admin' : 'user',
          dailyTradesDone: 0,
          dailyProfit: 0
        };

        console.log("Creating profile for new user:", user.uid);
        try {
          await setDoc(doc(db, 'users', user.uid), newProfile);
          console.log("Profile created successfully");
          sessionStorage.setItem('justRegistered', 'true');
          sessionStorage.setItem('registrationTime', Date.now().toString());
        } catch (dbErr: any) {
          console.error("Firestore profile creation failed:", dbErr);
          throw dbErr;
        }
      }
    } catch (err: any) {
      console.error("Full Auth Error Object:", err);
      
      const isExpectedError = 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/email-already-in-use' ||
        err.code === 'auth/invalid-email' ||
        err.code === 'auth/weak-password' ||
        err.code === 'auth/operation-not-allowed' ||
        err.message === 'This mobile number is already registered.' ||
        err.message === 'Invalid mobile number. Please enter a 9 or 10 digit number.' ||
        err.message === 'Invalid mobile number or password.' ||
        err.message === 'Account profile not found. Please contact support.' ||
        err.message === 'Passwords do not match' ||
        err.message === 'Invalid mobile number';

      if (!isExpectedError) {
        console.error("Unexpected Auth process error:", err);
      }
      
      // Handle re-registration for "zombie" accounts (Auth exists but Firestore profile is missing)
      if (!isLogin && err.code === 'auth/email-already-in-use') {
        console.log("Zombie account detected, attempting recovery...");
        try {
          const isEmail = formData.email.includes('@');
          const email = isEmail ? formData.email : `${formData.mobile}@auratrade.com`;
          const userCredential = await signInWithEmailAndPassword(auth, email, formData.password);
          const user = userCredential.user;
          
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (!profileDoc.exists()) {
            console.log("Re-creating missing profile for zombie account...");
            // Re-create the profile
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || formData.email || '',
              mobile: formData.mobile || user.displayName || '0000000000',
              balance: 0,
              totalAssets: 0,
              totalProfits: 0,
              totalWithdrawals: 0,
              withdrawableBalance: 0,
              vipLevel: 0,
              referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
              referredBy: formData.referralCode || '',
              createdAt: new Date().toISOString(),
              status: 'active',
              role: checkIsAdmin(formData.mobile, formData.email, user.email) ? 'admin' : 'user',
              dailyTradesDone: 0,
              dailyProfit: 0
            };
            sessionStorage.setItem('justRegistered', 'true');
            sessionStorage.setItem('registrationTime', Date.now().toString());
            await setDoc(doc(db, 'users', user.uid), newProfile);
            console.log("Zombie profile recovered successfully");
            return; // Success
          } else {
            console.log("Profile actually exists for this account.");
            setError('This mobile number is already registered.');
            return;
          }
        } catch (reAuthErr: any) {
          if (reAuthErr.code !== 'auth/invalid-credential') {
            console.error("Recovery error:", reAuthErr);
          }
          setError(sanitizeError(err));
          return;
        }
      }
      setError(sanitizeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%)] from-yellow-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-yellow-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black yellow-text-gradient mb-2">AuraTradeLKR</h1>
          <p className="text-gray-500 font-medium">Premium Trading Experience</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
          <button
            onClick={() => { setIsLogin(true); if (onClearError) onClearError(); }}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); if (onClearError) onClearError(); }}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email (Optional)"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-yellow-500 transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          )}

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Mobile Number"
              required
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-yellow-500 transition-all"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-yellow-500 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && (
            <>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-yellow-500 transition-all"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Referral Code (Optional)"
                  disabled={isReferralDisabled}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-yellow-500 transition-all"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                />
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
          {externalError && !error && <p className="text-red-500 text-sm font-medium text-center">{externalError}</p>}

          {!isLogin && (
            <label className="flex items-center justify-center space-x-2 text-gray-500 cursor-pointer pb-2">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500" />
              <span className="text-sm">Remember Me</span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 yellow-gradient text-white rounded-2xl font-bold text-lg shadow-lg shadow-yellow-200 hover:opacity-90 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
