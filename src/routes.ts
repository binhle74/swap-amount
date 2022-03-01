import { Router } from "express";
import { calculateSwapAmountIn, calculateSwapAmountOut } from "./utils/amm/pool";
import { calculateDestinationAmountBasedOnSourceAmountAmm, calculateDestinationDataAmm, calculateSourceAmountBasedOnDestinationAmountAmm, calculateSourceDataAmm } from "./utils/swap-amm";

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

routes.post('/calculateSourceData', (req, res) => {
    let sourceData = calculateSourceDataAmm(req.body);
    console.log(`Calculate Source Data, amount=${req.body.destinationAmount}, from destination=${req.body.destinationCoin} to source=${req.body.sourceCoin}`);
    console.log(`----> Source Data: ${JSON.stringify(sourceData)}`);
    return res.json(sourceData);
});


export default routes;