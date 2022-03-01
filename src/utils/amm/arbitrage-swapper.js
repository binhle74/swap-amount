import { reportError } from "utils/error-reporter";
import { calculateSwapAmountOut, calculateSwapAmountIn } from "./pool";

function trySwapOnRoute({ poolStates, swapRoute, amountIn }) {
  const executedSwapRoute = [];

  let currentAmountIn = amountIn;

  for (let i = 0; i < swapRoute.length; i++) {
    const swapStep = swapRoute[i];
    const poolState = poolStates[swapStep.pool_id];
    let currentAmountOut;
    try {
      currentAmountOut = calculateSwapAmountOut({
        poolState,
        zeroForOne: swapStep.zero_for_one,
        amountIn: currentAmountIn,
      });
      if (!currentAmountOut) { return { success: false }; }
    } catch (e) {
      reportError(e);
      return { success: false };
    }
    let amount0;
    let amount1;
    if (swapStep.zero_for_one) {
      amount0 = currentAmountIn;
      amount1 = currentAmountOut;
    } else {
      amount0 = currentAmountOut;
      amount1 = currentAmountIn;
    }
    executedSwapRoute.push({
      pool_id: swapStep.pool_id,
      zero_for_one: swapStep.zero_for_one,
      amount0,
      amount1,
    });
    currentAmountIn = currentAmountOut;
  }

  return { success: true, amountOut: currentAmountIn, executedSwapRoute };
}

function trySwapInverselyOnRoute({ poolStates, swapRoute, amountOut }) {
  const executedSwapRoute = [];

  let currentAmountOut = amountOut;

  for (let i = swapRoute.length - 1; i >= 0; i--) {
    const swapStep = swapRoute[i];
    const poolState = poolStates[swapStep.pool_id];
    let currentAmountIn;
    try {
      currentAmountIn = calculateSwapAmountIn({
        poolState,
        zeroForOne: swapStep.zero_for_one,
        amountOut: currentAmountOut,
      });
      if (!currentAmountIn) { return { success: false }; }
    } catch (e) {
      reportError(e);
      return { success: false };
    }
    let amount0;
    let amount1;
    if (swapStep.zero_for_one) {
      amount0 = currentAmountIn;
      amount1 = currentAmountOut;
    } else {
      amount0 = currentAmountOut;
      amount1 = currentAmountIn;
    }
    executedSwapRoute.unshift({
      pool_id: swapStep.pool_id,
      zero_for_one: swapStep.zero_for_one,
      amount0,
      amount1,
    });
    currentAmountOut = currentAmountIn;
  }

  return { success: true, amountIn: currentAmountOut, executedSwapRoute };
}

export { trySwapOnRoute, trySwapInverselyOnRoute };
