import { isEmpty } from "lodash";
import formatCoinAmount from "./format-coin-amount";
import { parseFloatAmount } from "./parse-amount";
import {
  add,
  subtract,
  multiply,
  divide,
  withPrecision,
} from "../lib/number_ext";

import { reportError } from "./error-reporter";
import { calculateAskCounterAmount, calculateBidCounterAmount } from "./price-ladders/calculate-counter-amount";
import { calculateAskBaseAmount, calculateBidBaseAmount } from "./price-ladders/calculate-base-amount";
import { SWAP_AMOUNT_ENV } from "../swap-amount.env";

const fiatCurrencies = SWAP_AMOUNT_ENV.fiat_wallet_currencies;

const getSwapFee = () => divide(parseFloatAmount(SWAP_AMOUNT_ENV.swap_fee), 100);

export const SOURCE_AMOUNT_ADJUSTMENT_RATE = add(1, getSwapFee());
export const DESTINATION_AMOUNT_ADJUSTMENT_RATE = subtract(1, getSwapFee());

const getExchangeReference = coinCurrency => (
  coinCurrency === "usdt"
    ? "usdt_USDTUSD"
    : `binance_${coinCurrency.toUpperCase()}USD`
);

export const calculateSwapRate = (exchangeRates, fromCoin, toCoin) => {
  const fromExchangeReference = getExchangeReference(fromCoin);
  const toExchangeReference = getExchangeReference(toCoin);

  if (!exchangeRates[toExchangeReference] || !exchangeRates[fromExchangeReference]) {
    return null;
  }
  return divide(exchangeRates[fromExchangeReference], exchangeRates[toExchangeReference]);
};

const calculateSwapAmountWithPriceLadders = ({
  fromCoin: fromCoinArg,
  toCoin: toCoinArg,
  fromAmount,
  accumulatedPriceLadders = {},
  base = "source",
  usedPriceLadders = [],
  steps = [],
}) => {
  let fromCoin;
  let toCoin;
  if (base === "source") {
    fromCoin = fromCoinArg;
    toCoin = toCoinArg;
  } else {
    // When base is destination, the pair is reversed already
    // TODO: Remove that logic when new algorithm is applied (and work stable)
    fromCoin = toCoinArg;
    toCoin = fromCoinArg;
  }

  const pair = fromCoin + toCoin;
  const reversePair = toCoin + fromCoin;

  const hasPriceLadder = !!(accumulatedPriceLadders[pair] || accumulatedPriceLadders[reversePair]);


  if (hasPriceLadder) {
    if (accumulatedPriceLadders[pair]) {
      usedPriceLadders.push({ ...accumulatedPriceLadders[pair], asks: [] });
      let valuation;
      if (base === "source") {
        valuation = calculateBidCounterAmount(accumulatedPriceLadders[pair], fromAmount).counterAmount;
      } else {
        valuation = calculateBidBaseAmount(accumulatedPriceLadders[pair], fromAmount).baseAmount;
      }
      steps.push(`${pair}:${valuation}`);
      return valuation;
    }

    // reversed pair supported
    usedPriceLadders.push({ ...accumulatedPriceLadders[reversePair], bids: [] });
    let valuation;
    if (base === "source") {
      valuation = calculateAskBaseAmount(accumulatedPriceLadders[reversePair], fromAmount).baseAmount;
    } else {
      valuation = calculateAskCounterAmount(accumulatedPriceLadders[reversePair], fromAmount).counterAmount;
    }
    steps.push(`${reversePair}:${valuation}`);
    return valuation;
  }

  // does not has price ladder => need to use usdt as a bridge
  if (fromCoin === "usdt" || toCoin === "usdt") {
    steps.push(`${pair}:null`);
    return null;
  }

  if (base === "source") {
    const usdtAmount = calculateSwapAmountWithPriceLadders({
      fromCoin, toCoin: "usdt", fromAmount, accumulatedPriceLadders, usedPriceLadders, steps,
    });
    if (!usdtAmount) {
      return null;
    }

    return calculateSwapAmountWithPriceLadders({
      fromCoin: "usdt", toCoin, fromAmount: usdtAmount, accumulatedPriceLadders, usedPriceLadders, steps,
    });
  }

  // base = "destination"
  const usdtAmount = calculateSwapAmountWithPriceLadders({
    fromCoin: toCoin, toCoin: "usdt", fromAmount, accumulatedPriceLadders, base: "destination", usedPriceLadders, steps,
  });
  if (!usdtAmount) {
    return null;
  }

  return calculateSwapAmountWithPriceLadders({
    fromCoin: "usdt", toCoin: fromCoin, fromAmount: usdtAmount, accumulatedPriceLadders, base: "destination", usedPriceLadders, steps,
  });
};

const reportCalculateSwapAmountFailedError = ({
  fromCoin,
  toCoin,
  fromAmount,
  accumulatedPriceLadders,
  steps,
}) => {
  if (parseFloat(fromAmount) <= 0) {
    return;
  }
  const validPriceLadderPairs = [];
  for (const k of Object.keys(accumulatedPriceLadders)) {
    if (!isEmpty(accumulatedPriceLadders[k])) {
      validPriceLadderPairs.push(k);
    }
  }
  if (isEmpty(validPriceLadderPairs)) {
    return;
  }
  reportError("failed to calculate swap amount with accumulated price ladders, "
    + `fromCoin=${fromCoin}, toCoin=${toCoin}, fromAmount=${fromAmount}, steps=${steps.join("|")}, `
    + `accumulatedPriceLadderPairs=[${validPriceLadderPairs.join(",")}]`);
};

const calculateSwapAmount = ({
  exchangeRates,
  accumulatedPriceLadders = {},
  fromCoin,
  toCoin,
  base = "source",
  fromAmount,
  precision,
  adjustmentRate = 1,
  isNumber = false,
  usedPriceLadders = [],
}) => {
  // After merging AMM swap to normal swap, we do not support fiat currencies for normal swap
  if (fiatCurrencies.includes(fromCoin) || fiatCurrencies.includes(toCoin)) { return null; }

  let counterAmount;
  let calculatedAmount;

  if (SWAP_AMOUNT_ENV.investment_valuator_enabled) {
    const steps = [];
    counterAmount = calculateSwapAmountWithPriceLadders({
      fromCoin, toCoin, fromAmount, accumulatedPriceLadders, base, usedPriceLadders, steps,
    });

    if (counterAmount) {
      calculatedAmount = multiply(counterAmount, adjustmentRate);
    } else {
      reportCalculateSwapAmountFailedError({
        fromCoin, toCoin, fromAmount, accumulatedPriceLadders, steps,
      });
    }
  }

  if (!calculatedAmount) {
    const swapRate = calculateSwapRate(exchangeRates, fromCoin, toCoin);

    if (!swapRate) {
      return null;
    }

    calculatedAmount = multiply(swapRate, fromAmount, adjustmentRate);
  }

  if (isNumber) {
    return calculatedAmount;
  }

  return formatCoinAmount(calculatedAmount, toCoin, {
    precision,
    stripInsignificantZeros: false,
  });
};

export const calculateLimitOrderSwapAmount = ({
  toCoin,
  fromAmount,
  limitPrice,
  precision,
  isNumber = false,
  adjustmentRate = 1,
}) => {
  const calculatedAmount = multiply(divide(fromAmount, limitPrice), adjustmentRate);

  if (isNumber) {
    return withPrecision(calculatedAmount, precision);
  }

  return formatCoinAmount(calculatedAmount, toCoin, {
    precision,
    stripInsignificantZeros: false,
  });
};

export const calculateSwapAmountWithOldAlgorithm = ({
  exchangeRates,
  fromCoin,
  toCoin,
  fromAmount,
  adjustmentRate = 1,
}) => {
  const swapRate = calculateSwapRate(exchangeRates, fromCoin, toCoin);
  if (!swapRate) {
    return null;
  }
  return multiply(swapRate, fromAmount, adjustmentRate);
};

export const calculateSwapAmountWithNewAlgorithm = ({
  accumulatedPriceLadders = {},
  fromCoin,
  toCoin,
  fromAmount,
  adjustmentRate = 1,
  usedPriceLadders = [],
}) => {
  // After merging AMM swap to normal swap, we do not support fiat currencies for normal swap
  if (fiatCurrencies.includes(fromCoin) || fiatCurrencies.includes(toCoin)) { return null; }

  const steps = [];
  const counterAmount = calculateSwapAmountWithPriceLadders({
    fromCoin, toCoin, fromAmount, accumulatedPriceLadders, base: "source", usedPriceLadders, steps,
  });

  if (!counterAmount) {
    reportCalculateSwapAmountFailedError({
      fromCoin, toCoin, fromAmount, accumulatedPriceLadders, steps,
    });
    return null;
  }

  return multiply(counterAmount, adjustmentRate);
};

export const equivalentUsdtValue = (exchangeRates, fromCoin, fromAmount, isNumber) => calculateSwapAmount({
  exchangeRates, fromCoin, toCoin: "usdt", fromAmount, precision: 2, isNumber,
});

export default calculateSwapAmount;
