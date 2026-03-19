export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'banned';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email?: string;
  mobile: string;
  balance: number;
  totalAssets: number;
  totalProfits: number;
  totalWithdrawals: number;
  withdrawableBalance?: number;
  vipLevel: number;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  status: UserStatus;
  role: UserRole;
  lastTradeTime?: string;
  vipActivatedAt?: string;
  dailyTradesDone: number;
  dailyProfit: number;
  lastSignInDate?: string;
  lastDailyBonusClaimDate?: string;
  savedBankDetails?: {
    bankName: string;
    accNo: string;
    accName: string;
  };
}

export interface DepositRequest {
  id?: string;
  uid: string;
  amount: number;
  bankName: string;
  accNo: string;
  receiptUrl?: string;
  status: RequestStatus;
  refNo: string;
  remark?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id?: string;
  uid: string;
  amount: number;
  bankDetails: {
    bankName: string;
    accNo: string;
    accName: string;
  };
  status: RequestStatus;
  fee: number;
  createdAt: string;
}

export interface AdTask {
  id: string;
  title: string;
  adUrl: string;
  reward: number;
  createdAt: string;
}

export interface UserTaskCompletion {
  id?: string;
  uid: string;
  taskId: string;
  completedAt: string;
}

export interface GiftKey {
  id?: string;
  key: string;
  reward: number;
  maxUses: number;
  usedCount: number;
  createdAt: string;
}

export interface Transaction {
  id?: string;
  uid: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'trade_profit' | 'trade_loss' | 'referral_commission' | 'daily_bonus';
  description: string;
  createdAt: string;
}

export const VIP_LEVELS: { level: number, name: string, min: number, max: number, profitMin: number, profitMax: number, dailyTrades: number, comingSoon?: boolean }[] = [
  { level: 1, name: 'Package 1', min: 1000, max: 2999, profitMin: 0.05, profitMax: 0.10, dailyTrades: 1 },
  { level: 2, name: 'Package 2', min: 3000, max: 4999, profitMin: 0.06, profitMax: 0.12, dailyTrades: 1 },
  { level: 3, name: 'Package 3', min: 5000, max: 9999, profitMin: 0.08, profitMax: 0.15, dailyTrades: 1 },
  { level: 4, name: 'Package 4', min: 10000, max: 29999, profitMin: 0.10, profitMax: 0.18, dailyTrades: 1 },
  { level: 5, name: 'Package 5', min: 30000, max: 49999, profitMin: 0.12, profitMax: 0.22, dailyTrades: 1 },
  { level: 6, name: 'Package 6', min: 50000, max: 99999, profitMin: 0.15, profitMax: 0.25, dailyTrades: 1 },
  { level: 7, name: 'Package 7', min: 100000, max: 999999, profitMin: 0.18, profitMax: 0.30, dailyTrades: 1 },
];

export type Language = 'en' | 'si' | 'ta';

export const TRANSLATIONS: Record<Language, any> = {
  en: {
    welcome: "Welcome",
    recharge: "Recharge",
    withdraw: "Withdraw",
    helpCenter: "Help Center",
    team: "Team",
    downloadApp: "Download App",
    activity: "Activity",
    inviteFriends: "Invite Friends",
    trading: "Trading",
    vip: "Packages",
    me: "Me",
    home: "Home",
    balance: "Balance",
    totalAssets: "Total Assets",
    dailyProfit: "Daily Profit",
    totalWithdrawal: "Total Withdrawal",
    startTrading: "Start Trading",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    depositNotice: "Deposit Notice",
    withdrawNotice: "Withdraw Notice",
    transactionHistory: "Transaction History",
    securityCenter: "Security Center",
    tradingTutorial: "Trading Tutorial",
    languageSettings: "Language Settings",
    commonProblems: "Common Problems",
    aboutUs: "About Us",
    signOut: "Sign Out",
    assets: "Assets",
    profits: "Profits",
    level: "Package",
    telegramChannel: "Telegram Channel",
    withdrawableBalance: "Withdrawable Balance",
  },
  si: {
    welcome: "සාදරයෙන් පිළිගනිමු",
    recharge: "නැවත පිරවීම",
    withdraw: "මුදල් ලබා ගැනීම",
    helpCenter: "උදව් මධ්‍යස්ථානය",
    team: "කණ්ඩායම",
    downloadApp: "ඇප් එක බාගන්න",
    activity: "ක්‍රියාකාරකම්",
    inviteFriends: "මිතුරන්ට ආරාධනා කරන්න",
    trading: "වෙළඳාම",
    vip: "පැකේජ",
    me: "මම",
    home: "මුල් පිටුව",
    balance: "ශේෂය",
    totalAssets: "මුළු වත්කම්",
    dailyProfit: "දෛනික ලාභය",
    totalWithdrawal: "මුළු මුදල් ලබා ගැනීම්",
    startTrading: "වෙළඳාම ආරම්භ කරන්න",
    pending: "පොරොත්තුවෙන්",
    approved: "අනුමතයි",
    rejected: "ප්‍රතික්ෂේපිතයි",
    depositNotice: "තැන්පතු දැන්වීම",
    withdrawNotice: "මුදල් ලබා ගැනීමේ දැන්වීම",
    transactionHistory: "ගනුදෙනු ඉතිහාසය",
    securityCenter: "ආරක්ෂක මධ්‍යස්ථානය",
    tradingTutorial: "වෙළඳ නිබන්ධනය",
    languageSettings: "භාෂා සැකසුම්",
    commonProblems: "පොදු ගැටළු",
    aboutUs: "අප ගැන",
    signOut: "ඉවත් වන්න",
    assets: "වත්කම්",
    profits: "ලාභ",
    level: "පැකේජය",
    telegramChannel: "ටෙලිග්‍රෑම් නාලිකාව",
    withdrawableBalance: "ලබාගත හැකි ශේෂය",
  },
  ta: {
    welcome: "வரவேற்கிறோம்",
    recharge: "ரீசார்ஜ்",
    withdraw: "திரும்பப் பெறுதல்",
    helpCenter: "உதவி மையம்",
    team: "குழு",
    downloadApp: "செயலியைப் பதிவிறக்கவும்",
    activity: "செயல்பாடு",
    inviteFriends: "நண்பர்களை அழைக்கவும்",
    trading: "வர்த்தகம்",
    vip: "தொகுப்புகள்",
    me: "நான்",
    home: "முகப்பு",
    balance: "இருப்பு",
    totalAssets: "மொத்த சொத்துக்கள்",
    dailyProfit: "தினசரி லாபம்",
    totalWithdrawal: "மொத்த திரும்பப் பெறுதல்",
    startTrading: "வர்த்தகத்தைத் தொடங்குங்கள்",
    pending: "நிலுவையில் உள்ளது",
    approved: "அங்கீகரிக்கப்பட்டது",
    rejected: "நிராகரிக்கப்பட்டது",
    depositNotice: "வைப்பு அறிவிப்பு",
    withdrawNotice: "திரும்பப் பெறுதல் அறிவிப்பு",
    transactionHistory: "பரிவர்த்தனை வரலாறு",
    securityCenter: "பாதுகாப்பு மையம்",
    tradingTutorial: "வர்த்தக பயிற்சி",
    languageSettings: "மொழி அமைப்புகள்",
    commonProblems: "பொதுவான சிக்கல்கள்",
    aboutUs: "எங்களைப் பற்றி",
    signOut: "வெளியேறு",
    assets: "சொத்துக்கள்",
    profits: "லாபம்",
    level: "தொகுப்பு",
    telegramChannel: "டெலிகிராம் சேனல்",
    withdrawableBalance: "திரும்பப் பெறக்கூடிய இருப்பு",
  }
};
