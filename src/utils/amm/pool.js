import JSBI from "jsbi";
import { encodeE18, decodeE18 } from "./shared"
import { encodeSqrtRatioX96FromPrice } from "./encode-sqrt-ratio-x96";
import {
  getNextSqrtPriceFromInput,
  getNextSqrtPriceFromOutput,
  getAmount0Delta,
  getAmount1Delta,
} from "./sqrt-price-math";
import { mulDivRoundingUp } from "./full-math";

// simplified version of uniswapV3 calculate swap state - cut off tick crossing logic
// so the result of this method only approximates to actual result from AMM engine
function calculateSwapAmountOut({ poolState, zeroForOne, amountIn }) {
  const { price, liquidity, fee } = poolState;

  const sqrtPriceX96 = encodeSqrtRatioX96FromPrice(price);
  const liquidityE18 = encodeE18(liquidity);
  const amountInE18 = encodeE18(amountIn);
  const feeE18 = encodeE18(fee);
  const nextSqrtPriceX96 = getNextSqrtPriceFromInput(
    sqrtPriceX96,
    liquidityE18,
    amountInE18,
    zeroForOne,
  );

  if (!nextSqrtPriceX96) { return null; }

  let amountOutE18;
  if (zeroForOne) {
    amountOutE18 = getAmount1Delta(
      sqrtPriceX96,
      nextSqrtPriceX96,
      liquidityE18,
      false,
    );
  } else {
    amountOutE18 = getAmount0Delta(
      sqrtPriceX96,
      nextSqrtPriceX96,
      liquidityE18,
      false,
    );
  }
  if (!amountOutE18) { return null; }

  const feeAmountE18 = mulDivRoundingUp(amountOutE18, feeE18, JSBI.BigInt(1e18));
  const amountOutAfterFeeE8 = JSBI.subtract(amountOutE18, feeAmountE18);

  return decodeE18(amountOutAfterFeeE8);
}

function calculateSwapAmountIn({ poolState, zeroForOne, amountOut }) {
  const { price, liquidity, fee } = poolState;


  const sqrtPriceX96 = encodeSqrtRatioX96FromPrice(price);
  const liquidityE18 = encodeE18(liquidity);
  const amountOutE18 = encodeE18(amountOut);
  const feeE18 = encodeE18(fee);

  const feeAmountE18 = mulDivRoundingUp(amountOutE18, feeE18, JSBI.subtract(JSBI.BigInt(1e18), feeE18));
  const amountOutAfterFeeE8 = JSBI.add(amountOutE18, feeAmountE18);

  const nextSqrtPriceX96 = getNextSqrtPriceFromOutput(
    sqrtPriceX96,
    liquidityE18,
    amountOutAfterFeeE8,
    zeroForOne,
  );
  if (!nextSqrtPriceX96) { return null; }

  let amountInE18;
  if (zeroForOne) {
    amountInE18 = getAmount0Delta(
      sqrtPriceX96,
      nextSqrtPriceX96,
      liquidityE18,
      false,
    );
  } else {
    amountInE18 = getAmount1Delta(
      sqrtPriceX96,
      nextSqrtPriceX96,
      liquidityE18,
      false,
    );
  }
  if (!amountInE18) { return null; }

  return decodeE18(amountInE18);
}

export { calculateSwapAmountOut, calculateSwapAmountIn };
