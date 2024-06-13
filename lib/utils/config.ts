import * as dotenv from "dotenv";
import path = require("path");

// Configure dotenv to read from our `.env` file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Define a TS Type to type the returned envs from our function below.
export type ConfigProps = {
    DOMAIN: string;
    SSH_PORT: string;
    MISER_MODE: boolean,
};

// 3. Define a function to retrieve our env variables
export const getConfig = (): ConfigProps => ({
    DOMAIN: process.env.DOMAIN || '',
    SSH_PORT: process.env.SSH_PORT || '22',
    MISER_MODE: ((process.env.MISER_MODE || 'true') == 'true')
});
