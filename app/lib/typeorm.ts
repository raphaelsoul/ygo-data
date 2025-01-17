import { DataSource } from "typeorm";
import path from "path";
import { Card } from "@/entities/card.entity";

const AppDataSource = new DataSource({
    type: process.env.DATABASE_TYPE as "sqlite" || "sqlite",
    database: path.join(process.cwd(), process.env.DATABASE || "data/ygo.db"),
    synchronize: true,
    logging: process.env.NODE_ENV === "development",
    entities: [Card],
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