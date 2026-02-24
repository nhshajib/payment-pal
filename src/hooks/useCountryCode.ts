import { useState, useEffect } from 'react';

const COUNTRY_CODES: Record<string, { code: string; dial: string; flag: string }> = {
  US: { code: 'US', dial: '+1', flag: '🇺🇸' },
  GB: { code: 'GB', dial: '+44', flag: '🇬🇧' },
  CA: { code: 'CA', dial: '+1', flag: '🇨🇦' },
  AU: { code: 'AU', dial: '+61', flag: '🇦🇺' },
  IN: { code: 'IN', dial: '+91', flag: '🇮🇳' },
  DE: { code: 'DE', dial: '+49', flag: '🇩🇪' },
  FR: { code: 'FR', dial: '+33', flag: '🇫🇷' },
  BR: { code: 'BR', dial: '+55', flag: '🇧🇷' },
  MX: { code: 'MX', dial: '+52', flag: '🇲🇽' },
  NG: { code: 'NG', dial: '+234', flag: '🇳🇬' },
  ZA: { code: 'ZA', dial: '+27', flag: '🇿🇦' },
  KE: { code: 'KE', dial: '+254', flag: '🇰🇪' },
  PH: { code: 'PH', dial: '+63', flag: '🇵🇭' },
  PK: { code: 'PK', dial: '+92', flag: '🇵🇰' },
  BD: { code: 'BD', dial: '+880', flag: '🇧🇩' },
  JP: { code: 'JP', dial: '+81', flag: '🇯🇵' },
  KR: { code: 'KR', dial: '+82', flag: '🇰🇷' },
  AE: { code: 'AE', dial: '+971', flag: '🇦🇪' },
  SA: { code: 'SA', dial: '+966', flag: '🇸🇦' },
  EG: { code: 'EG', dial: '+20', flag: '🇪🇬' },
  IT: { code: 'IT', dial: '+39', flag: '🇮🇹' },
  ES: { code: 'ES', dial: '+34', flag: '🇪🇸' },
  NL: { code: 'NL', dial: '+31', flag: '🇳🇱' },
  SE: { code: 'SE', dial: '+46', flag: '🇸🇪' },
  SG: { code: 'SG', dial: '+65', flag: '🇸🇬' },
};

const DEFAULT = { code: 'US', dial: '+1', flag: '🇺🇸' };

export function useCountryCode() {
  const [country, setCountry] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('paytrack_country');
    if (cached) {
      try {
        setCountry(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {}
    }

    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const cc = data?.country_code;
        if (cc && COUNTRY_CODES[cc]) {
          setCountry(COUNTRY_CODES[cc]);
          localStorage.setItem('paytrack_country', JSON.stringify(COUNTRY_CODES[cc]));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { country, loading, allCountries: Object.values(COUNTRY_CODES), setCountry };
}
