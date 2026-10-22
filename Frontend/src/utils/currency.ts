interface CurrencyInfo {
  symbol: string;
  locale: string;
}

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  '+1': { symbol: '$', locale: 'en-US' },
  '+44': { symbol: '£', locale: 'en-GB' },
  '+91': { symbol: '₹', locale: 'en-IN' },
  '+86': { symbol: '¥', locale: 'zh-CN' },
  '+81': { symbol: '¥', locale: 'ja-JP' },
  '+49': { symbol: '€', locale: 'de-DE' },
  '+33': { symbol: '€', locale: 'fr-FR' },
  '+52': { symbol: '$', locale: 'es-MX' },
};

export function getCurrencyInfo(countryCode: string | null | undefined): CurrencyInfo {
  if (!countryCode || !COUNTRY_CURRENCY_MAP[countryCode]) {
    return { symbol: '$', locale: 'en-US' };
  }
  return COUNTRY_CURRENCY_MAP[countryCode];
}

export function formatCurrency(amount: number, countryCode: string | null | undefined): string {
  const { symbol, locale } = getCurrencyInfo(countryCode);
  try {
    return `${symbol}${Number(amount).toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  } catch {
    const parts = String(Math.round(amount)).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${symbol}${parts.join('.')}`;
  }
}

export function formatAmountInput(value: string, countryCode: string | null | undefined): string {
  const cleaned = value.replace(/,/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num) || cleaned === '') return '';
  const { locale } = getCurrencyInfo(countryCode);
  try {
    return num.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } catch {
    const parts = cleaned.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }
}

export function parseAmount(value: string): number {
  const cleaned = value.replace(/,/g, '');
  return parseFloat(cleaned);
}
