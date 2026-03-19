export function sanitizeError(error: any): string {
  if (!error) return '';
  
  // Check code first if it's a Firebase error object
  const code = error.code || '';
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Invalid mobile number or password.';
  }
  if (code === 'auth/invalid-email') {
    return 'Invalid mobile number format.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This mobile number is already registered.';
  }
  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your connection.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please try again later.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password authentication is not enabled. Please contact support.';
  }

  let message = error.message || String(error);
  
  // Remove Firebase prefix if present
  if (message.startsWith('Firebase:')) {
    // Handle both "Error (auth/code)" and "Error [auth/code]" formats
    message = message.replace(/^Firebase:\s*Error\s*[([ ]auth\/([^\])]+)[\])]\.?/, '$1');
    message = message.replace(/^Firebase:\s*/, '');
  }

  // Fallback string checks
  if (message.includes('user-not-found') || message.includes('invalid-credential') || message.includes('wrong-password')) {
    return 'Invalid mobile number or password.';
  }
  if (message.includes('invalid-email')) {
    return 'Invalid mobile number format.';
  }
  if (message.includes('Invalid mobile number. Please enter a 9 or 10 digit number.')) {
    return message;
  }
  if (message.includes('Account profile not found')) {
    return 'Account profile not found. Please contact support.';
  }
  if (message.includes('email-already-in-use')) {
    return 'This mobile number is already registered.';
  }
  if (message.includes('weak-password')) {
    return 'Password should be at least 6 characters.';
  }
  if (message.includes('network-request-failed')) {
    return 'Network error. Please check your connection.';
  }
  if (message.includes('too-many-requests')) {
    return 'Too many failed attempts. Please try again later.';
  }

  // Firestore errors
  if (message.includes('permission-denied') || code === 'permission-denied') {
    return 'You do not have permission to perform this action.';
  }

  if (message.includes('timed out') || message.includes('timeout')) {
    return 'Connection timed out. Please check your internet and try again.';
  }

  // Generic fallback
  return 'An error occurred. Please try again.';
}
