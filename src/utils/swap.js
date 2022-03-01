import parseNumber from "../services/parse-number"
import calculateSwapAmount, {
  calculateLimitOrderSwapAmount,
  calculateSwapAmountWithOldAlgorithm,
  calculateSwapAmountWithNewAlgorithm,
  SOURCE_AMOUNT_ADJUSTMENT_RATE,
  DESTINATION_AMOUNT_ADJUSTMENT_RATE,
} from "./calculate-swap-amount";
import { SWAP_AMOUNT_ENV } from "../swap-amount.env";


const {
  precision_digits: precisionDigits,
} = SWAP_AMOUNT_ENV.COIN_CURRENCY_CONFIG;

const getFilter = ({
  sourceCoin,
  destinationCoin,
  isReverse = false,
}) => {
  const pair = isReverse ? `${destinationCoin}${sourceCoin}` : `${sourceCoin}${destinationCoin}`;
  const filters = SWAP_AMOUNT_ENV.liquidity_filters;
  const filter = filters[pair];

  if (!filter && !isReverse) {
    return getFilter({ sourceCoin, destinationCoin, isReverse: true });
  }
  if (!filter) {
    return null;
  }
  filter.isReverse = isReverse;

  return filter;
};

const selectMaxPrecisionFromFilter = (filter, normalMaxPrecision) => {
  const stepSize = parseNumber(filter.lot_size.step_size);
  if (stepSize >= 1) {
    return 0;
  }
  const maxPrecision = stepSize.toString().length - 2;

  return Math.min(normalMaxPrecision, maxPrecision);
};

const maxSourcePrecision = ({ sourceCoin, destinationCoin }) => {
  const filter = getFilter({ sourceCoin, destinationCoin });
  const normalMaxPrecision = precisionDigits[sourceCoin];
  if (!filter || filter.isReverse) {
    return normalMaxPrecision;
  }

  return selectMaxPrecisionFromFilter(filter, normalMaxPrecision);
};

const maxDestinationPrecision = ({ sourceCoin, destinationCoin }) => {
  const filter = getFilter({ sourceCoin, destinationCoin });
  const normalMaxPrecision = precisionDigits[destinationCoin];
  if (!filter || !filter.isReverse) {
    return normalMaxPrecision;
  }

  return selectMaxPrecisionFromFilter(filter, normalMaxPrecision);
};

const calculateSourceAmountBasedOnDestinationAmount = ({
  exchangeRates,
  accumulatedPriceLadders,
  sourceCoin,
  destinationCoin,
  destinationAmount,
  isNumber = false,
}) => {
  if (destinationAmount !== "" && destinationAmount != null) {
    return calculateSwapAmount({
      exchangeRates,
      accumulatedPriceLadders,
      fromCoin: destinationCoin,
      toCoin: sourceCoin,
      base: "destination",
      fromAmount: destinationAmount,
      precision: maxSourcePrecision({ sourceCoin, destinationCoin }),
      adjustmentRate: SOURCE_AMOUNT_ADJUSTMENT_RATE,
      isNumber,
    });
  }

  return "";
};

const calculateDestinationAmountBasedOnSourceAmount = ({
  exchangeRates,
  accumulatedPriceLadders,
  sourceCoin,
  destinationCoin,
  sourceAmount,
  isNumber = false,
}) => {
  if (sourceAmount !== "" && sourceAmount != null) {
    return calculateSwapAmount({
      exchangeRates,
      accumulatedPriceLadders,
      fromCoin: sourceCoin,
      toCoin: destinationCoin,
      base: "source",
      fromAmount: sourceAmount,
      precision: maxDestinationPrecision({ sourceCoin, destinationCoin }),
      adjustmentRate: DESTINATION_AMOUNT_ADJUSTMENT_RATE,
      isNumber,
    });
  }

  return "";
};

// for market swap, we support all pairs between major coins and others
const getDestinationCoinsToMarketSwap = (sourceCoin) => {
  const {
    p2p_coins: p2pCoins,
  } = SWAP_AMOUNT_ENV.COIN_CURRENCY_CONFIG;

  const {
    major_coins: majorCoins,
    altcoin_currencies: minorCoins,
  } = SWAP_AMOUNT_ENV;
  // TODO: support swap from bnb -> bch, ltc, xrp & vice versa
  // then remove this
  const pendingSupportedP2pCoins = ["bnb"];

  let coinsToSwap;

  if (majorCoins.includes(sourceCoin)) {
    coinsToSwap = Array.from(
      new Set([
        ...p2pCoins,
        ...minorCoins,
      ]),
    );
  } else if (minorCoins.includes(sourceCoin)) {
    coinsToSwap = majorCoins;
  } else {
    coinsToSwap = p2pCoins.filter(coin => !pendingSupportedP2pCoins.includes(coin));
  }
  coinsToSwap = coinsToSwap.filter(currency => currency !== sourceCoin);

  return coinsToSwap;
};

// for limit order, we currently support only pair that is liquidable to delegate to binance
// check liquidity-info gem for more information
const getDestinationCoinsToLimitSwap = (sourceCoin) => {
  const {
    liquidable_pairs: liquidablePairs,
  } = SWAP_AMOUNT_ENV.SWAP_AMOUNT_ENV;
  // liquidity-info configs with uppercase as coin symbol
  // so we need to upcase the source coin before comparing
  const upperCaseSourceCoin = sourceCoin.toUpperCase();
  const pairs = liquidablePairs.filter(r => r.includes(upperCaseSourceCoin));
  return pairs
    .map(r => r.find(coin => coin !== upperCaseSourceCoin))
    .filter(r => r)
    .map(r => r.toLowerCase()); // need to lower case in the end
};

const getDestinationCoinsToSwap = (sourceCoin, isLimitOrder) => (
  isLimitOrder
    ? getDestinationCoinsToLimitSwap(sourceCoin)
    : getDestinationCoinsToMarketSwap(sourceCoin)
);

const calculateDestinationAmountBasedOnSourceAmountWithOldAlgorithm = ({
  exchangeRates,
  sourceCoin,
  destinationCoin,
  sourceAmount,
}) => calculateSwapAmountWithOldAlgorithm({
  exchangeRates,
  fromCoin: sourceCoin,
  toCoin: destinationCoin,
  fromAmount: sourceAmount,
  adjustmentRate: DESTINATION_AMOUNT_ADJUSTMENT_RATE,
});

const calculateDestinationAmountBasedOnSourceAmountWithNewAlgorithm = ({
  accumulatedPriceLadders,
  sourceCoin,
  destinationCoin,
  sourceAmount,
  usedPriceLadders = [],
}) => calculateSwapAmountWithNewAlgorithm({
  accumulatedPriceLadders,
  fromCoin: sourceCoin,
  toCoin: destinationCoin,
  fromAmount: sourceAmount,
  adjustmentRate: DESTINATION_AMOUNT_ADJUSTMENT_RATE,
  usedPriceLadders,
});

const calculateDestinationAmountBasedOnSourceAmountWithLimitOrderSwap = ({
  counterCoin,
  sourceAmount,
  limitPrice,
  sourceCoin,
  destinationCoin,
  isNumber = false,
}) => {
  if (sourceAmount !== "" && sourceAmount != null) {
    const destinationCoinPrecision = SWAP_AMOUNT_ENV.COIN_CURRENCY_CONFIG.precision_digits[destinationCoin];
    return calculateLimitOrderSwapAmount({
      toCoin: destinationCoin,
      fromAmount: sourceAmount,
      limitPrice: counterCoin === sourceCoin ? limitPrice : 1 / limitPrice,
      precision: destinationCoinPrecision,
      isNumber,
      adjustmentRate: DESTINATION_AMOUNT_ADJUSTMENT_RATE,
    });
  }

  return "";
};

const calculateSourceAmountBasedOnDestinationAmountWithLimitOrderSwap = ({
  counterCoin,
  destinationAmount,
  limitPrice,
  destinationCoin,
  sourceCoin,
  isNumber = false,
}) => {
  if (destinationAmount !== "" && destinationAmount != null) {
    return calculateLimitOrderSwapAmount({
      toCoin: sourceCoin,
      fromAmount: destinationAmount,
      limitPrice: counterCoin === destinationCoin ? limitPrice : 1 / limitPrice,
      precision: maxSourcePrecision({ sourceCoin, destinationCoin }),
      isNumber,
      adjustmentRate: SOURCE_AMOUNT_ADJUSTMENT_RATE,
    });
  }

  return "";
};

const getCoinRatePrecision = ({ sourceCoin, destinationCoin }) => {
  const {
    coefficient: coinCoefficient,
  } = SWAP_AMOUNT_ENV.COIN_CURRENCY_CONFIG;
  const fiatCurrencies = SWAP_AMOUNT_ENV.fiat_wallet_currencies;

  if (fiatCurrencies.includes(destinationCoin)) return precisionDigits[destinationCoin];

  const sourceCoefficient = coinCoefficient[sourceCoin];
  const destinationCoefficient = coinCoefficient[destinationCoin];
  if (!sourceCoefficient || !destinationCoefficient) {
    // precision is 8 if the coefficient of either source or dest  is not defined
    return 8;
  }
  const coefficientRatio = sourceCoefficient / destinationCoefficient;
  if (coefficientRatio < 0.1) return 8;
  if (coefficientRatio < 1) return 6;
  if (coefficientRatio < 10) return 4;
  if (coefficientRatio < 100) return 3;
  return 2;
};

export {
  calculateSourceAmountBasedOnDestinationAmount,
  calculateDestinationAmountBasedOnSourceAmount,
  maxSourcePrecision,
  maxDestinationPrecision,
  getDestinationCoinsToSwap,
  calculateDestinationAmountBasedOnSourceAmountWithOldAlgorithm,
  calculateDestinationAmountBasedOnSourceAmountWithNewAlgorithm,
  calculateDestinationAmountBasedOnSourceAmountWithLimitOrderSwap,
  calculateSourceAmountBasedOnDestinationAmountWithLimitOrderSwap,
  getCoinRatePrecision,
};
