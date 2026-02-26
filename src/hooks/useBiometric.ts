import { useState, useEffect, useCallback } from 'react';

const BIOMETRIC_ENABLED_KEY = 'paytrack_biometric_enabled';
const BIOMETRIC_CRED_KEY = 'paytrack_biometric_cred';
const BIOMETRIC_USER_KEY = 'paytrack_biometric_user';

interface BiometricUser {
  phone: string;
  userId: string;
  userName: string;
}

function isBiometricSupported(): boolean {
  return !!window.PublicKeyCredential;
}

async function isPlatformAuthAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    isPlatformAuthAvailable().then(setIsAvailable);
    setIsEnabled(localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true');
  }, []);

  const enableBiometric = useCallback(async (phone: string, userId: string, userName: string) => {
    if (!isAvailable) return false;

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userIdBytes = new TextEncoder().encode(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'PayTrack', id: window.location.hostname },
          user: {
            id: userIdBytes,
            name: phone,
            displayName: userName || phone,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!credential) return false;

      localStorage.setItem(BIOMETRIC_CRED_KEY, credential.id);
      localStorage.setItem(BIOMETRIC_USER_KEY, JSON.stringify({ phone, userId, userName }));
      localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      setIsEnabled(true);
      return true;
    } catch {
      return false;
    }
  }, [isAvailable]);

  const authenticateWithBiometric = useCallback(async (): Promise<BiometricUser | null> => {
    const credId = localStorage.getItem(BIOMETRIC_CRED_KEY);
    const userData = localStorage.getItem(BIOMETRIC_USER_KEY);
    if (!credId || !userData) return null;

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      // Decode credential ID from base64url
      const credIdBytes = Uint8Array.from(
        atob(credId.replace(/-/g, '+').replace(/_/g, '/')),
        c => c.charCodeAt(0)
      );

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: credIdBytes,
            type: 'public-key',
            transports: ['internal'],
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (!assertion) return null;

      return JSON.parse(userData) as BiometricUser;
    } catch {
      return null;
    }
  }, []);

  const disableBiometric = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_CRED_KEY);
    localStorage.removeItem(BIOMETRIC_USER_KEY);
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    setIsEnabled(false);
  }, []);

  const hasSavedCredential = useCallback(() => {
    return !!localStorage.getItem(BIOMETRIC_CRED_KEY) && !!localStorage.getItem(BIOMETRIC_USER_KEY);
  }, []);

  return {
    isAvailable,
    isEnabled,
    enableBiometric,
    authenticateWithBiometric,
    disableBiometric,
    hasSavedCredential,
  };
}
