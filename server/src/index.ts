import dotenv from 'dotenv';
import { runServer } from './networking/server.js';
dotenv.config();

runServer(8080);
