import { divide, subtract } from "lodash";
import { calculateDefaultSwapRate } from "./swap-amm";

const recalculatePriceImpact = ({ newSourceAmount, newDestinationAmount, sourceCoin, destinationCoin, poolStates, swapRoutes}) => {
    if (!newSourceAmount || +newSourceAmount <= 0 || !newDestinationAmount || +newDestinationAmount <= 0) {
        return null;
    }
    const bestSourceToDestinationRate = calculateDefaultSwapRate({
        sourceCoin,
        destinationCoin,
        poolStates,
        swapRoutes
    });
    const sourceToDestinationRate = divide(newDestinationAmount, newSourceAmount);
    return Math.abs(subtract(divide(sourceToDestinationRate, bestSourceToDestinationRate), 1)) || null;
};

export default recalculatePriceImpact;