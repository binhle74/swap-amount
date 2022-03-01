export const invalidAmount = amount => (amount === null || amount === undefined || amount?.toString()?.trim() === "");

export const normalizeAmountString = (input) => {
  if (invalidAmount(input)) {
    return "";
  }

  return `${input}`.replace(/,/g, "");
};

export const parseFloatAmount = (amount) => {
  if (invalidAmount(amount)) {
    return 0.0;
  }

  return parseFloat(normalizeAmountString(amount));
};

export const parseIntAmount = (amount) => {
  if (invalidAmount(amount)) {
    return 0;
  }

  return Number(normalizeAmountString(amount)).toFixed(0);
};
