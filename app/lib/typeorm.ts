import { DataSource } from "typeorm";
import path from "path";
import { Card } from "@/entities/card.entity";

const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(process.cwd(), "data/ygo.sqlite"),
    synchronize: true,
    logging: process.env.NODE_ENV === "development",
    entities: [Card],
    migrations: [path.join(process.cwd(), "migrations/**/*.migration.{ts,js}")],
});

let initialized = false;

async function initialize() {
    if (!initialized) {
        try {
            await AppDataSource.initialize();
            console.log("Data Source has been initialized!");
            initialized = true;
        } catch (error) {
            console.error("Error during Data Source initialization:", error);
            throw error;
        }
    }
    return AppDataSource;
}

export async function getDataSource() {
    return initialize();
}

export default AppDataSource;