import JSBI from "jsbi";
import { MaxUint256, ZERO } from "./shared";

/**
 * @notice Calculates floor(a×b÷denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
 * @param a The multiplicand | JSBI
 * @param b The multiplier | JSBI
 * @param denominator The divisor | JSBI
 * @return result The 256-bit result | JSBI
 * @dev Credit to Remco Bloemen under MIT license https://xn--2-umb.com/21/muldiv
 */
export const mulDiv = (a, b, denominator) => {
  // 512-bit multiply [prod1 prod0] = a * b
  // Compute the product mod 2**256 and mod 2**256 - 1
  // then use the Chinese Remainder Theorem to reconstruct
  // the 512 bit result. The result is stored in two 256
  // variables such that product = prod1 * 2**256 + prod0

  const mm = JSBI.multiply(a, b);
  const prod0 = JSBI.bitwiseAnd(mm, MaxUint256);
  const prod1 = JSBI.signedRightShift(mm, JSBI.BigInt(256));

  // Handle non-overflow cases, 256 by 256 division
  if (JSBI.equal(prod1, ZERO)) {
    if (JSBI.lessThanOrEqual(denominator, ZERO)) {
      return null;
    }

    return JSBI.divide(prod0, denominator);
  }


  // Make sure the result is less than 2**256.
  // Also prevents denominator == 0
  if (JSBI.lessThanOrEqual(denominator, prod1)) {
    return null;
  }

  const result = JSBI.divide(JSBI.multiply(a, b), denominator);

  if (JSBI.greaterThan(result, MaxUint256)) {
    return null;
  }

  return result;
};

/*
 * @notice Calculates ceil(a×b÷denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
 * @param a The multiplicand | JSBI
 * @param b The multiplier | JSBI
 * @param denominator The divisor | JSBI
 * @return result The 256-bit result | JSBI
 */
export const mulDivRoundingUp = (a, b, denominator) => {
  let result = mulDiv(a, b, denominator);

  if (result == null) { return null; }
  if (JSBI.greaterThan(
    JSBI.remainder(JSBI.multiply(a, b), denominator),
    JSBI.BigInt(0),
  )) {
    if (JSBI.greaterThanOrEqual(result, MaxUint256)) {
      return null;
    }
    result = JSBI.add(result, JSBI.BigInt(1));
  }

  return result;
};
