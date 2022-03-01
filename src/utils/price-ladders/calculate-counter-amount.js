import { add, subtract, multiply } from "lib/number_ext";

const calculateCounterAmount = (accumulatedInventory, baseAmount, force) => {
  const inventorySize = accumulatedInventory.length;
  if (accumulatedInventory[0].amount >= baseAmount) {
    const counterAmount = multiply(accumulatedInventory[0].price, baseAmount);
    return {
      baseAmount,
      counterAmount,
    };
  }
  if (accumulatedInventory[inventorySize - 1].amount < baseAmount) {
    if (!force) {
      return {
        baseAmount: accumulatedInventory[inventorySize - 1].amount,
        counterAmount: accumulatedInventory[inventorySize - 1].valuation,
      };
    }

    const remainAmount = subtract(baseAmount, accumulatedInventory[inventorySize - 1].amount);
    const counterAmount = add(
      accumulatedInventory[inventorySize - 1].valuation,
      multiply(remainAmount, accumulatedInventory[inventorySize - 1].price),
    );
    return {
      baseAmount,
      counterAmount,
    };
  }

  let leftIndex = 0;
  let rightIndex = inventorySize - 1;
  let matchedIndex = rightIndex;
  let currentIndex = 0;
  while (true) {
    currentIndex = Math.floor((leftIndex + rightIndex) / 2);
    if (accumulatedInventory[currentIndex].amount >= baseAmount) {
      if (accumulatedInventory[currentIndex - 1].amount < baseAmount) {
        matchedIndex = currentIndex;
        break;
      } else {
        rightIndex = currentIndex - 1;
      }
    } else if (accumulatedInventory[currentIndex + 1].amount > baseAmount) {
      matchedIndex = currentIndex + 1;
      break;
    } else {
      leftIndex = currentIndex + 1;
    }
  }

  const remainAmount = subtract(baseAmount, accumulatedInventory[matchedIndex - 1].amount);
  const counterAmount = add(
    accumulatedInventory[matchedIndex - 1].valuation,
    multiply(remainAmount, accumulatedInventory[matchedIndex].price),
  );
  return {
    baseAmount,
    counterAmount,
  };
};

const calculateBidCounterAmount = (accumulatedPriceLadders, baseAmount) => calculateCounterAmount(accumulatedPriceLadders.bids, baseAmount, true);
const calculateAskCounterAmount = (accumulatedPriceLadders, baseAmount) => calculateCounterAmount(accumulatedPriceLadders.asks, baseAmount, true);

export {
  calculateBidCounterAmount,
  calculateAskCounterAmount,
};
