import {
  divide, floor, ceil, lowerCase,
} from "lodash-es";
import {
  maxSourcePrecision,
  maxDestinationPrecision,
} from "./swap";
import { findBestSwapRoute, findBestSwapInverselyRoute } from "./amm/arbitrage-route-finder";

const calculateDestinationAmountBasedOnSourceAmountAmm = ({
  swapRoutes: swapRoutesMap,
  poolStates,
  sourceCoin,
  destinationCoin,
  sourceAmount,
}) => {
  if (!swapRoutesMap || !poolStates) {
    return {
      destinationAmount: null,
      swapRoute: null,
    };
  }
  const pair = `${lowerCase(sourceCoin)}_${lowerCase(destinationCoin)}`;
  const swapRoutes = swapRoutesMap[pair];
  if (!swapRoutes || swapRoutes.length === 0) {
    return {
      destinationAmount: null,
      swapRoute: null,
    };
  }

  const {
    maxAmountOut: destinationAmount,
    bestSwapRoute: swapRoute,
  } = findBestSwapRoute({
    poolStates,
    swapRoutes,
    amountIn: sourceAmount,
  });

  return {
    destinationAmount,
    swapRoute,
  };
};

const calculateSourceAmountBasedOnDestinationAmountAmm = ({
  swapRoutes: swapRoutesMap,
  poolStates,
  sourceCoin,
  destinationCoin,
  destinationAmount,
}) => {
  if (!swapRoutesMap || !poolStates) {
    return {
      sourceAmount: null,
      swapRoute: null,
    };
  }
  const pair = `${lowerCase(sourceCoin)}_${lowerCase(destinationCoin)}`;
  const swapRoutes = swapRoutesMap[pair];
  if (!swapRoutes || swapRoutes.length === 0) {
    return {
      sourceAmount: null,
      swapRoute: null,
    };
  }

  const {
    minAmountIn: sourceAmount,
    bestSwapRoute: swapRoute,
  } = findBestSwapInverselyRoute({
    poolStates,
    swapRoutes,
    amountOut: destinationAmount,
  });

  return {
    sourceAmount,
    swapRoute,
  };
};

const calculateDefaultSwapRate = ({
  swapRoutes,
  poolStates,
  sourceCoin,
  destinationCoin,
}) => {
  if (!swapRoutes || !poolStates) { return 0; }

  const sourceCoinPrecision = maxSourcePrecision({
    sourceCoin,
    destinationCoin,
  });
  const minSourceAmount = ceil(0.00000001, sourceCoinPrecision);
  const { destinationAmount } = calculateDestinationAmountBasedOnSourceAmountAmm({
    swapRoutes,
    poolStates,
    sourceAmount: minSourceAmount,
    sourceCoin,
    destinationCoin,
  });
  if (!destinationAmount) { return 0; }
  return divide(destinationAmount, minSourceAmount);
};

const getSourceCoinsToSwapAmm = ({ swapRoutes: swapRoutesMap }) => {
  if (!swapRoutesMap) {
    return [];
  }
  return Array.from(
    new Set(Object.keys(swapRoutesMap).map(pair => pair.split("_")[0])),
  ).sort();
};

const getDestinationCoinsToSwapAmm = ({ swapRoutes: swapRoutesMap, sourceCoin }) => {
  if (!swapRoutesMap) {
    return [];
  }
  const routesStartWithSourceCoin = Object.keys(swapRoutesMap).filter(pair => pair.split("_")[0] === sourceCoin && swapRoutesMap[pair].length > 0);
  return Array.from(
    new Set(routesStartWithSourceCoin.map(filterdPair => filterdPair.split("_")[1])),
  ).sort();
};

const calculateSourceDataAmm = ({
  swapRoutes,
  poolStates,
  sourceCoin,
  destinationCoin,
  destinationAmount,
}) => {
  const getDefaultSwapRate = () => calculateDefaultSwapRate({
    sourceCoin,
    destinationCoin,
    poolStates,
    swapRoutes,
  });

  if (!isFinite(destinationAmount) || destinationAmount <= 0) {
    return {
      sourceAmountAmm: null,
      swapRoute: null,
      swapRate: getDefaultSwapRate(),
    };
  }

  const {
    sourceAmount,
    swapRoute,
  } = calculateSourceAmountBasedOnDestinationAmountAmm({
    destinationAmount,
    destinationCoin,
    sourceCoin,
    poolStates,
    swapRoutes,
  });

  if (!sourceAmount) {
    return {
      sourceAmountAmm: null,
      swapRoute: null,
      swapRate: getDefaultSwapRate(),
    };
  }

  const sourceCoinPrecision = maxSourcePrecision({
    sourceCoin,
    destinationCoin,
  });

  const sourceAmountAfterRound = ceil(sourceAmount, sourceCoinPrecision).toFixed(sourceCoinPrecision);
  const calculatedSwapRate = divide(destinationAmount, sourceAmount);
  return {
    rawSourceAmountAmm: sourceAmount,
    sourceAmountAmm: sourceAmountAfterRound,
    swapRoute,
    swapRate: calculatedSwapRate,
  };
};

const calculateDestinationDataAmm = ({
  sourceCoin,
  destinationCoin,
  sourceAmount,
  swapRoutes,
  poolStates,
}) => {
  const getDefaultSwapRate = () => calculateDefaultSwapRate({
    sourceCoin,
    destinationCoin,
    poolStates,
    swapRoutes,
  });

  if (!isFinite(sourceAmount) || sourceAmount <= 0) {
    return {
      destinationAmountAmm: null,
      swapRoute: null,
      swapRate: getDefaultSwapRate(),
    };
  }

  const {
    destinationAmount,
    swapRoute,
  } = calculateDestinationAmountBasedOnSourceAmountAmm({
    sourceAmount,
    sourceCoin,
    destinationCoin,
    poolStates,
    swapRoutes,
  });

  if (!destinationAmount) {
    return {
      destinationAmountAmm: null,
      swapRoute: null,
      swapRate: getDefaultSwapRate(),
    };
  }

  const destinationCoinPrecision = maxDestinationPrecision({
    sourceCoin,
    destinationCoin,
  });

  const destinationAmountAfterRound = floor(destinationAmount, destinationCoinPrecision).toFixed(destinationCoinPrecision);
  const calculatedSwapRate = divide(destinationAmount, sourceAmount);

  return {
    rawDestinationAmountAmm: destinationAmount,
    destinationAmountAmm: destinationAmountAfterRound,
    swapRoute,
    swapRate: calculatedSwapRate,
  };
};

export {
  calculateSourceAmountBasedOnDestinationAmountAmm,
  calculateDestinationAmountBasedOnSourceAmountAmm,
  calculateDefaultSwapRate,
  getSourceCoinsToSwapAmm,
  getDestinationCoinsToSwapAmm,
  calculateSourceDataAmm,
  calculateDestinationDataAmm,
};
