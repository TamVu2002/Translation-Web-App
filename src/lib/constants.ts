// ===========================================
// LANGUAGE CONSTANTS - Single Source of Truth
// ===========================================

// Vietnamese names for UI display
export const LANGUAGE_NAMES: Record<string, string> = {
  auto: 'Tự động',
  en: 'Tiếng Anh',
  vi: 'Tiếng Việt',
  ja: 'Tiếng Nhật',
  ko: 'Tiếng Hàn',
  zh: 'Tiếng Trung',
  fr: 'Tiếng Pháp',
  de: 'Tiếng Đức',
  es: 'Tiếng Tây Ban Nha',
  pt: 'Tiếng Bồ Đào Nha',
  ru: 'Tiếng Nga',
  ar: 'Tiếng Ả Rập',
  hi: 'Tiếng Hindi',
  th: 'Tiếng Thái',
  id: 'Tiếng Indonesia',
};

// English names for AI prompts
export const LANGUAGE_NAMES_EN: Record<string, string> = {
  en: 'English',
  vi: 'Vietnamese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  hi: 'Hindi',
  th: 'Thai',
  id: 'Indonesian',
};

export const LANGUAGES = [
  { code: 'vi', name: '🇻🇳 Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: '🇺🇸 Tiếng Anh', flag: '🇺🇸' },
  { code: 'ja', name: '🇯🇵 Tiếng Nhật', flag: '🇯🇵' },
  { code: 'ko', name: '🇰🇷 Tiếng Hàn', flag: '🇰🇷' },
  { code: 'zh', name: '🇨🇳 Tiếng Trung', flag: '🇨🇳' },
  { code: 'fr', name: '🇫🇷 Tiếng Pháp', flag: '🇫🇷' },
  { code: 'de', name: '🇩🇪 Tiếng Đức', flag: '🇩🇪' },
  { code: 'es', name: '🇪🇸 Tiếng Tây Ban Nha', flag: '🇪🇸' },
  { code: 'pt', name: '🇵🇹 Tiếng Bồ Đào Nha', flag: '🇵🇹' },
  { code: 'ru', name: '🇷🇺 Tiếng Nga', flag: '🇷🇺' },
  { code: 'ar', name: '🇸🇦 Tiếng Ả Rập', flag: '🇸🇦' },
  { code: 'hi', name: '🇮🇳 Tiếng Hindi', flag: '🇮🇳' },
  { code: 'th', name: '🇹🇭 Tiếng Thái', flag: '🇹🇭' },
  { code: 'id', name: '🇮🇩 Tiếng Indonesia', flag: '🇮🇩' },
] as const;

export const SOURCE_LANGUAGES = [
  { code: 'auto', name: '🔮 Tự động nhận diện', flag: '🔮' },
  ...LANGUAGES,
] as const;

// Helper function
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code;
}
