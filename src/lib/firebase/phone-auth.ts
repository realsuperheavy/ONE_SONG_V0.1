import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './init';

let verificationId: string | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const formatPhoneNumber = (phone: string): string => {
  return phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
};

export const initializePhoneAuth = async (containerId: string) => {
  try {
    if (!recaptchaVerifier) {
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal'
      });
      await recaptchaVerifier.render();
    }
    return recaptchaVerifier;
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    throw error;
  }
};

export const sendVerificationCode = async (phoneNumber: string) => {
  try {
    const verifier = await initializePhoneAuth('recaptcha-container');
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    verificationId = confirmation.verificationId;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

export const confirmVerificationCode = async (code: string) => {
  if (!verificationId) throw new Error('No verification ID found');
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    return signInWithCredential(auth, credential);
  } catch (error) {
    console.error('Error confirming verification code:', error);
    throw error;
  }
};

// Cleanup function
export const cleanup = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  verificationId = null;
}; 