// import type { Config } from "drizzle-kit";
// import * as dotenv from "dotenv";
// dotenv.config({ path: ".env" });
// dotenv.config({ path: ".env.local" });

// export default {
//     dialect: "postgresql",
//     driver: "pg",
//     schema: "./lib/db/schema.ts",
//     dbCredentials: {
//         connectionString: process.env.DATABASE_URL!,
//   },
// } satisfies Config;

import { defineConfig, type Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

export default defineConfig({
    dialect: "postgresql",
    schema: "lib/db/schema.ts",
    out: "./drizzle",
    driver: "pg",
    verbose: true,
    dbCredentials: {
        uri: process.env.DATABASE_URL!,
    },
} as Config);



//npx drizzle-kit push:pg