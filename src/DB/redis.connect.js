import chalk from "chalk";
import { createClient } from "redis";


export const redisClient = createClient({
    url: "redis://127.0.0.1:6379",
    database: 5
})
redisClient
    .on("error", (err) => console.log(chalk.red("Redis Client Error", err)))
    .on("connect", () => console.log(chalk.green("Redis Client Connected")))
    .connect()