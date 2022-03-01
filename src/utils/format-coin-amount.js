import React from "react";
import {
  RText,
} from "components/base";
import formatCurrency from "../lib/number_ext";

const formatCoinAmount = (input, coin, options = {}) => {
  const { COIN_CURRENCY_CONFIG } = window;
  const {
    unitFormat = "none",
    showEmptyString = false,
    showDash = false,
    maxPrecision = null,
    stripInsignificantZeros = false,
    precision = null,
    currencyColor,
    amountColor,
  } = options;
  let copiedInput = input;
  if (typeof copiedInput === "string") {
    copiedInput = parseFloat(copiedInput);
  }
  if (copiedInput == null || copiedInput === "undefined" || isNaN(copiedInput)) {
    if (showDash) {
      return "--";
    }
    if (showEmptyString) {
      return "";
    }
    copiedInput = 0;
    return copiedInput;
  }

  let showPrecision = precision;
  if (typeof (showPrecision) !== "number") {
    showPrecision = 2;
    const digits = COIN_CURRENCY_CONFIG.precision_digits[coin.toLowerCase()];
    if (digits || digits === 0) { showPrecision = digits; }
  }
  if (maxPrecision && showPrecision > maxPrecision) {
    showPrecision = maxPrecision;
  }
  const symbol = COIN_CURRENCY_CONFIG.symbols[coin.toLowerCase()];
  const formattedBareInput = formatCurrency(
    copiedInput,
    showPrecision,
    { strip: stripInsignificantZeros },
  );

  // return formattedBareInput;
  switch (unitFormat) {
    case "symbol": return `${symbol}${formattedBareInput}`;
    case "unit": return `${formattedBareInput} ${coin.toUpperCase()}`;
    case "unitAdvanced": return (
      <RText>
        <RText bold>{`${formattedBareInput} `}</RText>
        <RText>{coin.toUpperCase()}</RText>
      </RText>
    );
    case "full": return (
      <RText>
        <RText {...{ color: amountColor }} testID="amount">{`${formattedBareInput}`}</RText>
        {" "}
        <RText {...{ color: currencyColor }} testID="currency">
          {coin.toUpperCase()}
        </RText>
      </RText>
    );
    default: return formattedBareInput;
  }
};

export default formatCoinAmount;
