import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const LOG_PREFIX = "[db:migrate:auto]";
const isCi = process.env.CI === "true";
const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
const isForced = process.argv.includes("--force");

if (process.env.AUTO_DB_MIGRATIONS === "false") {
  console.log(`${LOG_PREFIX} Disabled via AUTO_DB_MIGRATIONS=false.`);
  process.exit(0);
}

if (!isForced && !isCi && !isVercel) {
  console.log(`${LOG_PREFIX} Skipping outside CI/Vercel (use --force to run locally).`);
  process.exit(0);
}

const dbUrl =
  process.env.SUPABASE_DB_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;

if (!dbUrl) {
  console.error(
    `${LOG_PREFIX} Missing DB URL. Set one of: SUPABASE_DB_URL, POSTGRES_URL_NON_POOLING, POSTGRES_URL, DATABASE_URL.`,
  );
  process.exit(1);
}

const localMigrationFiles = readdirSync("supabase/migrations")
  .filter((file) => /^\d+.*\.sql$/.test(file))
  .sort((a, b) => a.localeCompare(b));

if (localMigrationFiles.length === 0) {
  console.log(`${LOG_PREFIX} No local migrations found in supabase/migrations.`);
  process.exit(0);
}

function runSupabase(args) {
  const result = spawnSync("npx", ["supabase", ...args], {
    encoding: "utf8",
    stdio: "pipe",
    env: process.env,
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";

  if (result.status !== 0) {
    const output = `${stdout}\n${stderr}`.trim();
    throw new Error(
      `${LOG_PREFIX} Command failed: npx supabase ${args.join(" ")}\n${output}`,
    );
  }

  return `${stdout}\n${stderr}`;
}

function parseMigrationList(rawOutput) {
  const rows = [];

  for (const line of rawOutput.split(/\r?\n/)) {
    if (!line.includes("|")) {
      continue;
    }

    if (line.includes("Local") && line.includes("Remote")) {
      continue;
    }

    const parts = line.split("|").map((part) => part.trim());
    if (parts.length < 3) {
      continue;
    }

    const [localRaw, remoteRaw] = parts;
    const local = localRaw || null;
    const remote = remoteRaw || null;

    const isVersion = (value) => value === null || /^\d+$/.test(value);
    if (!isVersion(local) || !isVersion(remote)) {
      continue;
    }

    rows.push({ local, remote });
  }

  return rows;
}

function getDiffs(rows) {
  const pending = rows.filter((row) => row.local && !row.remote).map((row) => row.local);
  const remoteOnly = rows.filter((row) => !row.local && row.remote).map((row) => row.remote);

  return { pending, remoteOnly };
}

try {
  console.log(`${LOG_PREFIX} Inspecting migration history...`);
  const beforeList = runSupabase(["migration", "list", "--db-url", dbUrl]);
  const beforeRows = parseMigrationList(beforeList);
  const { pending, remoteOnly } = getDiffs(beforeRows);

  if (remoteOnly.length > 0) {
    throw new Error(
      `${LOG_PREFIX} Remote has migrations not present locally: ${remoteOnly.join(", ")}. Aborting to avoid drift/data risk.`,
    );
  }

  if (pending.length === 0) {
    console.log(`${LOG_PREFIX} Database already up to date. No migration executed.`);
    process.exit(0);
  }

  console.log(`${LOG_PREFIX} Pending migrations: ${pending.join(", ")}`);
  const dryRunOutput = runSupabase(["db", "push", "--dry-run", "--db-url", dbUrl]);

  const missingFromDryRun = pending.filter((version) => !dryRunOutput.includes(version));
  if (missingFromDryRun.length > 0) {
    throw new Error(
      `${LOG_PREFIX} Validation failed. Pending migrations not listed in dry-run: ${missingFromDryRun.join(", ")}.`,
    );
  }

  console.log(`${LOG_PREFIX} Applying migrations...`);
  runSupabase(["db", "push", "--yes", "--db-url", dbUrl]);

  const afterList = runSupabase(["migration", "list", "--db-url", dbUrl]);
  const afterRows = parseMigrationList(afterList);
  const afterPending = afterRows
    .filter((row) => row.local && !row.remote)
    .map((row) => row.local);

  if (afterPending.length > 0) {
    throw new Error(
      `${LOG_PREFIX} Migrations still pending after execution: ${afterPending.join(", ")}.`,
    );
  }

  console.log(`${LOG_PREFIX} Migration sync completed successfully.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
