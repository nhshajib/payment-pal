import { useState, useEffect } from 'react';

export interface CountryInfo {
  code: string;
  dial: string;
  flag: string;
  name: string;
  phoneLength: number; // expected digits (local, without dial code)
}

const COUNTRY_CODES: Record<string, CountryInfo> = {
  US: { code: 'US', dial: '+1', flag: '🇺🇸', name: 'United States', phoneLength: 10 },
  CA: { code: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada', phoneLength: 10 },
  GB: { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom', phoneLength: 10 },
  AU: { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia', phoneLength: 9 },
  IN: { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India', phoneLength: 10 },
  DE: { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany', phoneLength: 11 },
  FR: { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France', phoneLength: 9 },
  BR: { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil', phoneLength: 11 },
  MX: { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico', phoneLength: 10 },
  NG: { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria', phoneLength: 10 },
  ZA: { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa', phoneLength: 9 },
  KE: { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya', phoneLength: 9 },
  PH: { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines', phoneLength: 10 },
  PK: { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan', phoneLength: 10 },
  BD: { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh', phoneLength: 10 },
  JP: { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan', phoneLength: 10 },
  KR: { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea', phoneLength: 10 },
  AE: { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE', phoneLength: 9 },
  SA: { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia', phoneLength: 9 },
  EG: { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt', phoneLength: 10 },
  IT: { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy', phoneLength: 10 },
  ES: { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain', phoneLength: 9 },
  NL: { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Netherlands', phoneLength: 9 },
  SE: { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden', phoneLength: 9 },
  SG: { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore', phoneLength: 8 },
  CN: { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China', phoneLength: 11 },
  RU: { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia', phoneLength: 10 },
  TR: { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey', phoneLength: 10 },
  ID: { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia', phoneLength: 11 },
  TH: { code: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand', phoneLength: 9 },
  VN: { code: 'VN', dial: '+84', flag: '🇻🇳', name: 'Vietnam', phoneLength: 9 },
  MY: { code: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia', phoneLength: 10 },
  GH: { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana', phoneLength: 9 },
  TZ: { code: 'TZ', dial: '+255', flag: '🇹🇿', name: 'Tanzania', phoneLength: 9 },
  UG: { code: 'UG', dial: '+256', flag: '🇺🇬', name: 'Uganda', phoneLength: 9 },
  CO: { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia', phoneLength: 10 },
  AR: { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina', phoneLength: 10 },
  CL: { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile', phoneLength: 9 },
  PE: { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Peru', phoneLength: 9 },
  NZ: { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand', phoneLength: 9 },
  IE: { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland', phoneLength: 9 },
  PT: { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal', phoneLength: 9 },
  PL: { code: 'PL', dial: '+48', flag: '🇵🇱', name: 'Poland', phoneLength: 9 },
  CH: { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Switzerland', phoneLength: 9 },
  AT: { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Austria', phoneLength: 10 },
  BE: { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgium', phoneLength: 9 },
  DK: { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Denmark', phoneLength: 8 },
  NO: { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norway', phoneLength: 8 },
  FI: { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finland', phoneLength: 9 },
  IL: { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel', phoneLength: 9 },
};

const DEFAULT: CountryInfo = COUNTRY_CODES.US;

// Sort alphabetically by name
const sortedCountries = Object.values(COUNTRY_CODES).sort((a, b) => a.name.localeCompare(b.name));

export function useCountryCode() {
  const [country, setCountry] = useState<CountryInfo>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('paytrack_country');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Migrate old format (without phoneLength)
        if (parsed.code && COUNTRY_CODES[parsed.code]) {
          setCountry(COUNTRY_CODES[parsed.code]);
        } else {
          setCountry(parsed);
        }
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

  const handleSetCountry = (c: CountryInfo) => {
    setCountry(c);
    localStorage.setItem('paytrack_country', JSON.stringify(c));
  };

  return { country, loading, allCountries: sortedCountries, setCountry: handleSetCountry };
}
