import { Router } from "express";
import { calculateSwapAmountOut } from "./utils/amm/pool";

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

export default routes;