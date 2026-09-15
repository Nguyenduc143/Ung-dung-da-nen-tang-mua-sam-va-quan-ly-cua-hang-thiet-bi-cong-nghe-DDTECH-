import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { corsOptions } from './config/cors';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { apiRouter } from './routes';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(requestLogger);
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
