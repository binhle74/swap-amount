import JSBI from "jsbi";
import {
  ZERO, ONE, TWO, encodeE18,
} from "./shared";

const MAX_SAFE_INTEGER = JSBI.BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Computes floor(sqrt(value))
 * @param value the value for which to compute the square root, rounded down
 */
const sqrt = (value) => {
  if (!JSBI.greaterThanOrEqual(value, ZERO)) {
    return null;
  }

  // rely on built in sqrt if possible
  if (JSBI.lessThan(value, MAX_SAFE_INTEGER)) {
    return JSBI.BigInt(Math.floor(Math.sqrt(JSBI.toNumber(value))));
  }

  let z;
  let x;
  z = value;
  x = JSBI.add(JSBI.divide(value, TWO), ONE);
  while (JSBI.lessThan(x, z)) {
    z = x;
    x = JSBI.divide(JSBI.add(JSBI.divide(value, x), x), TWO);
  }
  return z;
};

/**
 * Returns the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
 * @param amount1 The numerator amount i.e., the amount of token1
 * @param amount0 The denominator amount i.e., the amount of token0
 * @returns The sqrt ratio as JSBI instance
 */
export const encodeSqrtRatioX96 = (amount1, amount0) => {
  const numerator = JSBI.leftShift(JSBI.BigInt(amount1), JSBI.BigInt(192));
  const denominator = JSBI.BigInt(amount0);
  const ratioX192 = JSBI.divide(numerator, denominator);
  return sqrt(ratioX192);
};

export const encodeSqrtRatioX96FromPrice = price => encodeSqrtRatioX96(encodeE18(price), 1e18);
