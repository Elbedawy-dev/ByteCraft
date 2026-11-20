/**
 * Money helpers for ByteCraft.
 * All API amounts are integer piasters (1 EGP = 100 piasters).
 * Numbers always use Western digits in both AR and EN per contract section 5.
 * Format: AR "7,800 ج.م" | EN "EGP 7,800"
 */

export function piastersToEgp(piasters) {
  const num = Number(piasters);
  if (!Number.isFinite(num)) return 0;
  return num / 100;
}

export function egpToPiasters(egp) {
  if (typeof egp === 'string') {
    const cleaned = egp.replace(/,/g, '').trim();
    const num = Number(cleaned);
    if (!Number.isFinite(num)) return 0;
    return Math.round(num * 100);
  }
  const num = Number(egp);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

export function formatMoney(piasters, lang = 'ar', options = {}) {
  const { showDecimals, includeCurrency = true } = options;
  const egp = piastersToEgp(piasters);
  const hasFraction = Math.abs(egp % 1) > 0.0001;
  const useDecimals = typeof showDecimals === 'boolean' ? showDecimals : hasFraction;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: useDecimals ? 2 : 0,
    maximumFractionDigits: useDecimals ? 2 : 0,
  }).format(egp);

  if (!includeCurrency) return formattedNumber;

  const activeLang = lang === 'en' ? 'en' : 'ar';
  return activeLang === 'ar' ? `${formattedNumber} ج.م` : `EGP ${formattedNumber}`;
}
