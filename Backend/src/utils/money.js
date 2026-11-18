/**
 * Money Utility (Currency: EGP / Piasters)
 * 
 * WHY:
 * Floating-point numbers in JavaScript (IEEE 754) lead to precision bugs
 * (e.g., 0.1 + 0.2 = 0.30000000000000004).
 * In financial software, prices must ALWAYS be represented as integers in the
 * smallest currency unit (piasters: 1 EGP = 100 piasters).
 */

/**
 * Converts an EGP amount (e.g. 150.50) to integer piasters (15050).
 * Rounds to nearest integer to avoid float inaccuracies.
 */
function egpToPiasters(egp) {
  const numeric = Number(egp);
  if (Number.isNaN(numeric)) {
    throw new TypeError('Invalid EGP value: must be a number or numeric string');
  }
  return Math.round(numeric * 100);
}

/**
 * Converts integer piasters (e.g. 15050) to EGP string formatted to 2 decimals ("150.50")
 * or numeric float representation if desired.
 */
function piastersToEgp(piasters, formatString = false) {
  const numeric = Number(piasters);
  if (Number.isNaN(numeric) || !Number.isInteger(numeric)) {
    throw new TypeError('Invalid piasters value: must be an integer');
  }
  const egp = numeric / 100;
  return formatString ? egp.toFixed(2) : egp;
}

/**
 * Calculates a percentage on integer piasters, rounding half-up.
 * Example: applyPercent(10000, 10) -> 1000 piasters (10% discount on 100 EGP).
 */
function applyPercent(amountInPiasters, percent) {
  const amount = Number(amountInPiasters);
  const pct = Number(percent);

  if (Number.isNaN(amount) || Number.isNaN(pct)) {
    throw new TypeError('Amount and percent must be numeric');
  }

  // Math.round implements standard "round half up" for positive numbers
  return Math.round((amount * pct) / 100);
}

module.exports = {
  egpToPiasters,
  piastersToEgp,
  applyPercent,
};
