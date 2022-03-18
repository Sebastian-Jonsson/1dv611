import express, { Request, Response, NextFunction } from 'express';
import IndexRouter from './routes/indexRouter';
import swaggerUI from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import cors from 'cors';
import { HttpError } from 'http-errors';
import { startCronJob } from './utils/cronJob';

export default class Server {
    private app: express.Application = express()
    private indexRouter: IndexRouter = new IndexRouter()
    constructor(private port: number | string) {}

    public run(): void {
        // Call everything that needs to be run before starting the server//
        //===============================================================//
        this.app.use(express.json());
        this.app.use(cors({
            origin: '*'
        }));
        startCronJob();
        // Setting up routes
        this.app.use('/api', this.indexRouter.router);
        this.swaggerBoot();
        this.errorHandler();
        this.listen();
    }

    private async swaggerBoot(): Promise<void> {
        const options = {
            swaggerDefinition: {
                info: {
                    title: 'Project Hermes',
                    version: '1.0.0',
                    description: 'API Documentation'
                }
            },
            servers: [
                { 
                    url: process.env.BASE_URL
                }
            ],
            // ./src/routes/*.ts for development
            // ./src/routes/*.js for deployment build
            apis: 
            [
                './src/routes/*.ts', './src/routes/*.js'
            ]
        };

        const swaggerDocs = swaggerJSDoc(options);
        this.app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
    }

    private errorHandler(): void {
        this.app.use(function (err: HttpError, req: Request, res: Response, next: NextFunction) {
            res
                .status(err.status)
                .json({
                    name: err.name,
                    status: err.status,
                    message: err.message
                });
            return;
        });
    }

    private listen(): void {
        this.app.listen(this.port, () => console.log(`App listening on http://localhost:${this.port}`));
    }
}