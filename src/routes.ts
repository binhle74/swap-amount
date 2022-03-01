import { Router } from "express";
import { calculateSwapAmountIn, calculateSwapAmountOut } from "./utils/amm/pool";
import { calculateDestinationAmountBasedOnSourceAmountAmm, calculateSourceAmountBasedOnDestinationAmountAmm } from "./utils/swap-amm";

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

routes.post('/calDestAmountBasedOnSourceAmount', (req, res) => {
    let destinationAmount = calculateDestinationAmountBasedOnSourceAmountAmm(req.body);
    console.log(`----> Source Amount: ${destinationAmount}`);
    return res.json(destinationAmount);
});

routes.post('/calSourceAmountBasedOnDestinationAmount', (req, res) => {
    let sourceAmount = calculateSourceAmountBasedOnDestinationAmountAmm(req.body);
    console.log(`Calculate Source Amount Based on Destination Amount: ${req.body.sourceAmount} from ${req.body.sourceCoin}` );
    console.log(`----> Source Amount: ${sourceAmount}`);
    return res.json(sourceAmount);
});


export default routes;