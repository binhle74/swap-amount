import { pickBy, uniq, clone } from "lodash-es";

const MAX_SWAP_ROUTE_LENGTH = 3;

function calculateSwapRoutes({
  pools,
  poolIdsByToken0,
  poolIdsByToken1,
  token0,
  token1,
  usedPoolIds,
  currentRoute,
  result,
}) {
  (poolIdsByToken0[token0] || []).forEach((poolId) => {
    if (usedPoolIds[poolId]) {
      return;
    }
    const pool = pools[poolId];
    const tmpRoute = clone(currentRoute);
    tmpRoute.push({
      pool_id: pool.id,
      zero_for_one: true,
    });
    if (pool.token1 === token1) {
      result.push(clone(tmpRoute));
    } else if (tmpRoute.length < MAX_SWAP_ROUTE_LENGTH) {
      usedPoolIds[poolId] = true;
      calculateSwapRoutes({
        pools,
        poolIdsByToken0,
        poolIdsByToken1,
        token0: pool.token1,
        token1,
        usedPoolIds,
        currentRoute: tmpRoute,
        result,
      });
      usedPoolIds[poolId] = false;
    }
  });

  (poolIdsByToken1[token0] || []).forEach((poolId) => {
    if (usedPoolIds[poolId]) {
      return;
    }

    const pool = pools[poolId];
    const tmpRoute = clone(currentRoute);
    tmpRoute.push({
      pool_id: pool.id,
      zero_for_one: false,
    });
    if (pool.token0 === token1) {
      result.push(clone(tmpRoute));
    } else if (tmpRoute.length < MAX_SWAP_ROUTE_LENGTH) {
      usedPoolIds[poolId] = true;
      calculateSwapRoutes({
        pools,
        poolIdsByToken0,
        poolIdsByToken1,
        token0: pool.token0,
        token1,
        usedPoolIds,
        currentRoute: tmpRoute,
        result,
      });
      usedPoolIds[poolId] = false;
    }
  });
}

function calculateSwapRoutesOfAllPairs(poolStates) {
  const pools = pickBy(poolStates, pool => pool.liquidity > 0);
  const swapRoutesByPair = {};
  const poolIdsByToken0 = {};
  const poolIdsByToken1 = {};
  Object.values(pools).forEach((pool) => {
    if (!poolIdsByToken0[pool.token0]) {
      poolIdsByToken0[pool.token0] = [];
    }
    poolIdsByToken0[pool.token0].push(pool.id);
    if (!poolIdsByToken1[pool.token1]) {
      poolIdsByToken1[pool.token1] = [];
    }
    poolIdsByToken1[pool.token1].push(pool.id);
  });
  const supportedTokens = uniq(
    Object.keys(poolIdsByToken0).concat(Object.keys(poolIdsByToken1)),
  );

  supportedTokens.forEach((token0) => {
    supportedTokens.forEach((token1) => {
      if (token0 === token1) {
        return;
      }

      const pair = `${token0}_${token1}`;
      const swapRoutesOfCurrentPair = [];
      const usedPoolIds = {};
      const currentRoute = [];
      calculateSwapRoutes({
        pools,
        poolIdsByToken0,
        poolIdsByToken1,
        token0,
        token1,
        usedPoolIds,
        currentRoute,
        result: swapRoutesOfCurrentPair,
      });
      if (swapRoutesOfCurrentPair.length > 0) {
        swapRoutesByPair[pair] = swapRoutesOfCurrentPair;
      }
    });
  });

  return swapRoutesByPair;
}

export {
  calculateSwapRoutesOfAllPairs,
};
