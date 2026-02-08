import './config/envConfig';
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from "./utils/logger";

//import routes
import appRoute from "./api/routes/app.route";
import genAiRoute from "./api/routes/genai.route";
import { envConfig } from './config/envConfig';

const app: Application = express();
const PORT = process.env.PORT || 6001;

// Middlewares
app.use(cors({
  origin: `${envConfig.BASE_URL}`, // frontend URL
  credentials: true, // allow cookies to be sent
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1', appRoute); // Health routes
app.use('/api/v1/genai', genAiRoute); // GenAI routes

// start application
app.listen(PORT, () => {
    console.log(`GenAI Backend API is running on port ${PORT}`);
    logger.info(`GenAI Backend API is running on port ${PORT}`);
});

export default app;