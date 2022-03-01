import JSBI from "jsbi";
import { Decimal } from "decimal.js";

// constants used internally but not expected to be used externally
export const ZERO = JSBI.BigInt(0);
export const ONE = JSBI.BigInt(1);
export const TWO = JSBI.BigInt(2);
export const Resolution = JSBI.BigInt(96);

// used in liquidity amount math
export const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
export const Q128 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128));
export const Q192 = JSBI.exponentiate(Q96, JSBI.BigInt(2));

export const MaxUint256 = JSBI.BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

/**
 * @notice encode a float number to big Int
 * @param number | number | string number
 * @return the big int number | JSBI
*/
export const encodeE18 = number => JSBI.BigInt(Decimal.mul(number, 1e18).toFixed(0));

/**
 * @notice decode a big Int number to float number
 * @param numberE18 big Int number | number | string number
 * @return the float number | number
*/
export const decodeE18 = numberE18 => Decimal.div(numberE18.toString(), 1e18).toNumber();

/**
 * @notice check price is valid or not
 * @param price | number | string number
 * @return true if valid | boolean
*/
export const isValidPrice = price => (isFinite(price) && +price >= 0);
