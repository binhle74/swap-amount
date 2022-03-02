import { Router } from "express";
import { calculateSwapAmountIn, calculateSwapAmountOut } from "./utils/amm/pool";
import { calculateDestinationDataAmm, calculateSourceDataAmm } from "./utils/swap-amm";

const routes = Router();

routes.get('/', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send("Swap Amount Application");
});

routes.post('/swapAmountIn', (req, res) => {
    let swapAmoutInValue = calculateSwapAmountIn(req.body);
    console.log(`Calculate Swap Amount In: ${JSON.stringify(req.body)}`);
    console.log(`----> swapAmoutInValue=${swapAmoutInValue}`);
    return res.json({
        swapAmoutInValue: swapAmoutInValue
    });
});

routes.post('/swapAmountOut', (req, res) => {
    let swapAmoutOutValue = calculateSwapAmountOut(req.body);
    console.log(`Calculate Swap Amount Out: ${JSON.stringify(req.body)}`);
    console.log(`----> swapAmoutOutValue=${swapAmoutOutValue}`);
    return res.json({
        swapAmoutOutValue: swapAmoutOutValue
    });
});

routes.post('/calculateDestinationData', (req, res) => {
    let destinationData = calculateDestinationDataAmm(req.body);
    console.log(`Calculate Destination Data: amount=${req.body.sourceAmount}, from source=${req.body.sourceCoin} to destination=${req.body.destinationCoin}`);
    console.log(`----> Destination Data: ${JSON.stringify(destinationData)}`);
    return res.json(destinationData);
});

routes.post('/calculateDestinationsData', (req, res) => {
    let requestBody = req.body;
    let sourceAmounts = req.body.sourceAmounts;

    let destinationDataArguments: any = {
        sourceCoin: requestBody.sourceCoin,
        destinationCoin: requestBody.destinationAmount,
        poolStates: requestBody.poolStates,
        swapRoutes: requestBody.swapRoutes
    };

    let destinationDataList = [];
    for (let sourceAmount of sourceAmounts) {
        destinationDataArguments.sourceAmount = sourceAmount;
        let destinationData = calculateDestinationDataAmm(destinationDataArguments);
        destinationDataList.push(destinationData);
    }
    return res.json(destinationDataList);
});

routes.post('/calculateSourceData', (req, res) => {
    let sourceData = calculateSourceDataAmm(req.body);
    console.log(`Calculate Source Data, amount=${req.body.destinationAmount}, from destination=${req.body.destinationCoin} to source=${req.body.sourceCoin}`);
    console.log(`----> Source Data: ${JSON.stringify(sourceData)}`);
    return res.json(sourceData);
});

routes.post('/calculateSourcesData', (req, res) => {
    let requestBody = req.body;
    let destinationAmounts = req.body.destinationAmounts;
    let sourceDataArguments: any = {
        sourceCoin: requestBody.sourceCoin,
        destinationCoin: requestBody.destinationAmount,
        poolStates: requestBody.poolStates,
        swapRoutes: requestBody.swapRoutes
    };

    let sourceDataList = [];
    for (let destinationAmount of destinationAmounts) {
        sourceDataArguments.destinationAmount = destinationAmount;
        let sourceData = calculateSourceDataAmm(sourceDataArguments);
        sourceDataList.push(sourceData);
    }
    return res.json(sourceDataList);
});

export default routes;