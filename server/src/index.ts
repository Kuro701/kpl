import dotenv from 'dotenv';
import { runServer } from './networking/server.js';
import { runCLI } from './cli/cli-handler.js';
dotenv.config();

runServer(8080);
runCLI();
