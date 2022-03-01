import { Router } from "express";
import { calculateSwapAmountIn, calculateSwapAmountOut } from "./utils/amm/pool";

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

export default routes;