import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: postgres.Sql | undefined;
}

const connectionString = process.env.DATABASE_URL!;

const client =
  globalThis._pgClient ??
  postgres(connectionString, { prepare: false, max: 3 });

if (process.env.NODE_ENV !== "production") {
  globalThis._pgClient = client;
}

export default client;
