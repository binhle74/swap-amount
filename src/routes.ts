import { Router } from "express";
import { calculateSwapAmountOut } from "./utils/amm/pool";
import { calculateDestinationDataAmm, calculateSourceDataAmm } from "./utils/swap-amm";

const routes = Router();

routes.get('/', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send("Swap Amount Application");
});

routes.post('/swapAmountOut', (req, res) => {
    let requestBody = req.body;
    console.log(`---> Swap amount request: ${JSON.stringify(requestBody)}.` );
    let amountInList = requestBody.amountInList;
    let amountOutArgs: any = {
        poolState: requestBody.poolState,
        zeroForOne: requestBody.zeroForOne
    };

    let amountOutList = [];
    for (let amountIn of amountInList) {
        amountOutArgs.amountIn = amountIn;
        let amountOut = calculateSwapAmountOut(amountOutArgs);
        amountOutList.push({
            amountIn: amountIn,
            amountOut: amountOut
        });
    }
    console.log(`---> Respond ${amountOutList.length} 'amount out' item(s).` );
    return res.json(amountOutList);
});

routes.post('/calculateDestinationsDataAmm', (req, res) => {
    let requestBody = req.body;
    let sourceAmounts = req.body.sourceAmounts;
    console.log(`---> Calculate DESTINATION amount, source coin='${requestBody.sourceCoin}', destination coin='${requestBody.destinationCoin}'.` );

    let destinationDataArguments: any = {
        sourceCoin: requestBody.sourceCoin,
        destinationCoin: requestBody.destinationCoin,
        poolStates: requestBody.poolStates,
        swapRoutes: requestBody.swapRoutes
    };

    let destinationDataList = [];
    for (let sourceAmount of sourceAmounts) {
        destinationDataArguments.sourceAmount = sourceAmount;
        let destinationData = calculateDestinationDataAmm(destinationDataArguments);
        destinationDataList.push({
            sourceAmount: sourceAmount,
            destinationAmount: destinationData.rawDestinationAmountAmm
        });
    }
    console.log(`---> Respond ${destinationDataList.length} 'destination amount' item(s).` );
    return res.json(destinationDataList);
});

routes.post('/calculateSourcesDataAmm', (req, res) => {
    let requestBody = req.body;
    let destinationAmounts = req.body.destinationAmounts;
    console.log(`---> Calculate SOURCE amount, destination coin='${requestBody.destinationCoin}', source coin='${requestBody.sourceCoin}'.` );
    let sourceDataArguments: any = {
        sourceCoin: requestBody.sourceCoin,
        destinationCoin: requestBody.destinationCoin,
        poolStates: requestBody.poolStates,
        swapRoutes: requestBody.swapRoutes
    };

    let sourceDataList = [];
    for (let destinationAmount of destinationAmounts) {
        sourceDataArguments.destinationAmount = destinationAmount;
        let sourceData = calculateSourceDataAmm(sourceDataArguments);
        sourceDataList.push({
            destinationAmount: destinationAmount,
            sourceAmount: sourceData.rawSourceAmountAmm
        });
    }
    console.log(`---> Respond ${sourceDataList.length} 'source amount' item(s).` );
    return res.json(sourceDataList);
});

export default routes;