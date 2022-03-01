import express from "express";
import routes from "./routes";

class App {
    public server;

    constructor() {
        this.server = express();
        this.middlewares();
        this.routes();
    }

    private middlewares() {
        this.server.use(express.json());
    }

    private routes() {
        this.server.use(routes);
    }
}

export default new App().server;