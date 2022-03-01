import formatCurrency from "../lib/number_ext";
import SWAP_AMOUNT_ENV from '../swap-amount.env';

const formatCoinAmount = (input, coin, options = {}) => {
  const { COIN_CURRENCY_CONFIG } = SWAP_AMOUNT_ENV;
  const {
    showEmptyString = false,
    showDash = false,
    maxPrecision = null,
    stripInsignificantZeros = false,
    precision = null
  } = options;
  let copiedInput = input;
  if (typeof copiedInput === "string") {
    copiedInput = parseFloat(copiedInput);
  }
  if (copiedInput == null || copiedInput === "undefined" || isNaN(copiedInput)) {
    if (showDash) {
      return "--";
    }
    if (showEmptyString) {
      return "";
    }
    copiedInput = 0;
    return copiedInput;
  }

  let showPrecision = precision;
  if (typeof (showPrecision) !== "number") {
    showPrecision = 2;
    const digits = COIN_CURRENCY_CONFIG.precision_digits[coin.toLowerCase()];
    if (digits || digits === 0) { showPrecision = digits; }
  }
  if (maxPrecision && showPrecision > maxPrecision) {
    showPrecision = maxPrecision;
  }
  const symbol = COIN_CURRENCY_CONFIG.symbols[coin.toLowerCase()];
  const formattedBareInput = formatCurrency(
    copiedInput,
    showPrecision,
    { strip: stripInsignificantZeros },
  );

  return formattedBareInput;
};

export default formatCoinAmount;
