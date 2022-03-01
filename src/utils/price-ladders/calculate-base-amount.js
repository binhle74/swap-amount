import { add, subtract, divide } from "../../lib/number_ext";

const calculateBaseAmount = (accumulatedInventory, counterAmount, force) => {
  const inventorySize = accumulatedInventory.length;

  if (accumulatedInventory[0].valuation >= counterAmount) {
    const baseAmount = divide(counterAmount, accumulatedInventory[0].price);
    return {
      counterAmount,
      baseAmount,
    };
  }

  if (accumulatedInventory[inventorySize - 1].valuation < counterAmount) {
    if (!force) {
      return {
        counterAmount: accumulatedInventory[inventorySize - 1].valuation,
        baseAmount: accumulatedInventory[inventorySize - 1].amount,
      };
    }

    const remainAmount = subtract(counterAmount, accumulatedInventory[inventorySize - 1].valuation);
    const baseAmount = add(
      accumulatedInventory[inventorySize - 1].amount,
      divide(remainAmount, accumulatedInventory[inventorySize - 1].price),
    );
    return {
      counterAmount,
      baseAmount,
    };
  }

  let leftIndex = 0;
  let rightIndex = inventorySize - 1;
  let matchedIndex = rightIndex;
  let currentIndex = 0;

  while (true) {
    currentIndex = Math.floor((leftIndex + rightIndex) / 2);
    if (accumulatedInventory[currentIndex].valuation >= counterAmount) {
      if (accumulatedInventory[currentIndex - 1].valuation < counterAmount) {
        matchedIndex = currentIndex;
        break;
      } else {
        rightIndex = currentIndex - 1;
      }
    } else if (accumulatedInventory[currentIndex + 1].valuation > counterAmount) {
      matchedIndex = currentIndex + 1;
      break;
    } else {
      leftIndex = currentIndex + 1;
    }
  }

  const remainAmount = subtract(counterAmount, accumulatedInventory[matchedIndex - 1].valuation);
  const baseAmount = add(
    accumulatedInventory[matchedIndex - 1].amount,
    divide(remainAmount, accumulatedInventory[matchedIndex].price),
  );
  return {
    counterAmount,
    baseAmount,
  };
};

const calculateBidBaseAmount = (accumulatedPriceLadders, counterAmount) => calculateBaseAmount(accumulatedPriceLadders.bids, counterAmount, true);
const calculateAskBaseAmount = (accumulatedPriceLadders, counterAmount) => calculateBaseAmount(accumulatedPriceLadders.asks, counterAmount, true);

export {
  calculateBidBaseAmount,
  calculateAskBaseAmount,
};
