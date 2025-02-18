import { DataSource } from "typeorm";
import path from "path";
import { Card } from "@/entities/card.entity";
import { Box } from "@/entities/box.entity";

const AppDataSource = new DataSource({
    type: process.env.DATABASE_TYPE as any,
    schema: process.env.DATABASE_SCHEMA,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    synchronize: true,
    logging: process.env.NODE_ENV === "development",
    entities: [Card, Box],
    url: process.env.DATABASE_URL,
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