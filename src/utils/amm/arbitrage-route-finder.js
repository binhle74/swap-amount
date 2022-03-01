import { trySwapOnRoute, trySwapInverselyOnRoute } from "utils/amm/arbitrage-swapper";

function findBestSwapRoute({ poolStates, swapRoutes, amountIn }) {
  let maxAmountOut;
  let bestSwapRoute;
  for (let i = 0; i < swapRoutes.length; i++) {
    const swapRoute = swapRoutes[i];
    const { success, amountOut, executedSwapRoute } = trySwapOnRoute({
      poolStates,
      swapRoute,
      amountIn,
    });
    if (success) {
      if (!maxAmountOut || amountOut > maxAmountOut) {
        maxAmountOut = amountOut;
        bestSwapRoute = executedSwapRoute;
      }
    }
  }

  return {
    maxAmountOut,
    bestSwapRoute,
  };
}

function findBestSwapInverselyRoute({ poolStates, swapRoutes, amountOut }) {
  let minAmountIn;
  let bestSwapRoute;
  for (let i = 0; i < swapRoutes.length; i++) {
    const swapRoute = swapRoutes[i];
    const { success, amountIn, executedSwapRoute } = trySwapInverselyOnRoute({
      poolStates,
      swapRoute,
      amountOut,
    });
    if (success) {
      if (!minAmountIn || amountIn < minAmountIn) {
        minAmountIn = amountIn;
        bestSwapRoute = executedSwapRoute;
      }
    }
  }

  return {
    minAmountIn,
    bestSwapRoute,
  };
}

export {
  findBestSwapRoute,
  findBestSwapInverselyRoute,
};
