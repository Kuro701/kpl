import dotenv from 'dotenv';
import { runServer } from './networking/server.js';
import { runCLI } from './cli/cli-handler.js';
dotenv.config();

let port = parseInt(process.env.SERVER_PORT || '') || parseInt(process.env.PORT || '') || 3000;


runServer(port);
runCLI();
