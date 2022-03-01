import JSBI from "jsbi";
import {
  MaxUint256, ZERO, ONE, Q96,
} from "./shared";
import { mulDivRoundingUp } from "./full-math";

const MaxUint160 = JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(160)), ONE);

function multiplyIn256(x, y) {
  const product = JSBI.multiply(x, y);
  return JSBI.bitwiseAnd(product, MaxUint256);
}

function addIn256(x, y) {
  const sum = JSBI.add(x, y);
  return JSBI.bitwiseAnd(sum, MaxUint256);
}

function getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp) {
  if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  const numerator1 = JSBI.leftShift(liquidity, JSBI.BigInt(96));
  const numerator2 = JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96);

  return roundUp
    ? mulDivRoundingUp(mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96), ONE, sqrtRatioAX96)
    : JSBI.divide(JSBI.divide(JSBI.multiply(numerator1, numerator2), sqrtRatioBX96), sqrtRatioAX96);
}

function getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, roundUp) {
  if (JSBI.greaterThan(sqrtRatioAX96, sqrtRatioBX96)) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  return roundUp
    ? mulDivRoundingUp(liquidity, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96), Q96)
    : JSBI.divide(JSBI.multiply(liquidity, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)), Q96);
}

function getNextSqrtPriceFromAmount0RoundingUp(
  sqrtPX96,
  liquidity,
  amount,
  add,
) {
  if (JSBI.equal(amount, ZERO)) return sqrtPX96;
  const numerator1 = JSBI.leftShift(liquidity, JSBI.BigInt(96));

  if (add) {
    const product = multiplyIn256(amount, sqrtPX96);
    if (JSBI.equal(JSBI.divide(product, amount), sqrtPX96)) {
      const denominator = addIn256(numerator1, product);
      if (JSBI.greaterThanOrEqual(denominator, numerator1)) {
        return mulDivRoundingUp(numerator1, sqrtPX96, denominator);
      }
    }

    return mulDivRoundingUp(numerator1, ONE, JSBI.add(JSBI.divide(numerator1, sqrtPX96), amount));
  }

  const product = multiplyIn256(amount, sqrtPX96);

  if (JSBI.notEqual(JSBI.divide(product, amount), sqrtPX96)) { return null; }
  if (JSBI.lessThanOrEqual(numerator1, product)) { return null; }
  const denominator = JSBI.subtract(numerator1, product);
  return mulDivRoundingUp(numerator1, sqrtPX96, denominator);
}

function getNextSqrtPriceFromAmount1RoundingDown(
  sqrtPX96,
  liquidity,
  amount,
  add,
) {
  if (add) {
    const quotient = JSBI.lessThanOrEqual(amount, MaxUint160)
      ? JSBI.divide(JSBI.leftShift(amount, JSBI.BigInt(96)), liquidity)
      : JSBI.divide(JSBI.multiply(amount, Q96), liquidity);

    return JSBI.add(sqrtPX96, quotient);
  }

  const quotient = mulDivRoundingUp(amount, Q96, liquidity);

  if (JSBI.lessThanOrEqual(sqrtPX96, quotient)) { return null; }
  return JSBI.subtract(sqrtPX96, quotient);
}

function getNextSqrtPriceFromInput(sqrtPX96, liquidity, amountIn, zeroForOne) {
  if (JSBI.lessThanOrEqual(sqrtPX96, ZERO)) { return null; }
  if (JSBI.lessThanOrEqual(liquidity, ZERO)) { return null; }

  return zeroForOne
    ? getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
    : getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true);
}

function getNextSqrtPriceFromOutput(
  sqrtPX96,
  liquidity,
  amountOut,
  zeroForOne,
) {
  if (JSBI.lessThanOrEqual(sqrtPX96, ZERO)) { return null; }
  if (JSBI.lessThanOrEqual(liquidity, ZERO)) { return null; }

  return zeroForOne
    ? getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountOut, false)
    : getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false);
}

export {
  getNextSqrtPriceFromInput,
  getNextSqrtPriceFromOutput,
  getAmount0Delta,
  getAmount1Delta,
};
