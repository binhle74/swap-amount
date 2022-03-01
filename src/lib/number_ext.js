import BigNumber from "bignumber.js";
import { SWAP_AMOUNT_ENV } from "../swap-amount.env";

/*
===== IMPORTANT NOTICE =====
If the argument feed to the methods here is number and has more than 15 digits, then mind the precision loss issue.
More info: https://github.com/MikeMcl/bignumber.js/#use
*/
BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_DOWN });

const decimalDelimiter = ".";
export const thousandDelimiter = ",";

const stripInsignificantZeros = (numberValue) => {
  const numberString = `${numberValue}`;
  if (numberString.match(/\./)) {
    return numberString.replace(/\.?0+$/, "");
  }
  return numberString;
};

const withPrecision = (number, precision) => {
  if (isNaN(number)) {
    return undefined;
  }

  if (isNaN(precision)) {
    return number;
  }

  if (precision < 0) {
    precision = 0;
  }

  if (typeof precision === "string" || precision instanceof String) {
    precision = parseInt(precision, 10);
  }

  number = new BigNumber(number);

  return number.toFixed(precision);
};

const formatThousandDelimiter = (numberString, delimiter) => numberString.replace(/\B(?=(\d{3})+(?!\d))/g, delimiter);

const format = (numberString, strip) => {
  const value = String(numberString).split(decimalDelimiter);
  const decimals = value[1];
  const ints = value[0];
  const formattedInts = formatThousandDelimiter(ints, thousandDelimiter);
  let result = formattedInts;
  if (decimals) {
    result = `${formattedInts}${decimalDelimiter}${decimals}`;
  }
  if (strip) {
    return stripInsignificantZeros(result);
  }
  return result;
};

const formatCurrency = (amount, precision, { strip = false } = {}) => {
  if (isNaN(amount)) {
    return amount;
  }
  const number = withPrecision(amount, precision);
  return format(number, strip);
};

const add = function (...args) {
  if (!args || args.length <= 0) return NaN;

  return args.reduce((x, y) => {
    x = new BigNumber(x);
    y = new BigNumber(y);
    const a = x.s;
    const b = y.s;
    if (!a || !b) return NaN;
    return x.plus(y).toNumber();
  });
};

const subtract = function (...args) {
  if (!args || args.length <= 0) return NaN;

  return args.reduce((x, y) => {
    x = new BigNumber(x);
    y = new BigNumber(y);
    const a = x.s;
    const b = y.s;
    if (!a || !b) return NaN;
    return x.minus(y).toNumber();
  });
};

const multiply = function (...args) {
  if (!args || args.length <= 0) return NaN;

  return args.reduce((x, y) => {
    x = new BigNumber(x);
    y = new BigNumber(y);
    const a = x.s;
    const b = y.s;
    if (!a || !b) return NaN;
    return x.multipliedBy(y).toNumber();
  });
};

const divide = function (...args) {
  if (!args || args.length <= 0) return NaN;

  return args.reduce((x, y) => {
    x = new BigNumber(x);
    y = new BigNumber(y);
    const a = x.s;
    const b = y.s;
    if (!a || !b) return NaN;
    return x.dividedBy(y).toNumber();
  });
};

Number.prototype.coinFormatter = function (currencyOrCountry, options) { // eslint-disable-line no-extend-native
  let precision = void 0; // eslint-disable-line no-void
  if (options == null) {
    options = {};
  }
  const defaults = {
    unitFormat: false,
    showDash: false,
    maxDefaultPrecision: false,
    stripInsignificantZeros: false,
  };
  options = Object.assign({}, defaults, options);

  let currency = (currencyOrCountry != null ? currencyOrCountry.length : undefined) === 2 ? SWAP_AMOUNT_ENV.country_currencies[currencyOrCountry] : currencyOrCountry;

  currency = currency != null ? currency.toUpperCase() : undefined;
  if (!currency) {
    currency = "USD";
  }

  const input = this;
  if (SWAP_AMOUNT_ENV.COIN_CURRENCY_CONFIG.coin_currencies.indexOf(currency.toLowerCase()) !== -1) {
    precision = SWAP_AMOUNT_ENV.COIN_CURRENCY_CONFIG.precision_digits[currency.toLowerCase()];
  } else if (currency === "VND") {
    precision = 0;
  } else if (SWAP_AMOUNT_ENV.CURRENCY_PRECISION[currency]) {
    precision = SWAP_AMOUNT_ENV.CURRENCY_PRECISION[currency];
  } else {
    precision = SWAP_AMOUNT_ENV.remi_decimals;
  }
  if (options.maxDefaultPrecision && precision > options.maxDefaultPrecision) {
    precision = options.maxDefaultPrecision;
  }

  const currencySymbol = SWAP_AMOUNT_ENV.COIN_CURRENCY_CONFIG.symbols[currency?.toLowerCase()] || SWAP_AMOUNT_ENV.CURRENCY_FORMATS[currency?.toLowerCase()]?.symbol || "$";

  const formattedBareInput = formatCurrency(input, precision, { strip: options.stripInsignificantZeros });
  if (options.unitFormat === "symbol") {
    if (SWAP_AMOUNT_ENV.CURRENCY_FORMATS[currency] != null && SWAP_AMOUNT_ENV.CURRENCY_FORMATS[currency].symbol_first === false) {
      return `${formattedBareInput}${currencySymbol}`;
    }
    return `${currencySymbol}${formattedBareInput}`;
  }
  if (options.unitFormat === "full") {
    return `${formattedBareInput} ${currency}`;
  }
  return formattedBareInput;
};

export {
  withPrecision, add, subtract, multiply, divide,
};
export default formatCurrency;
