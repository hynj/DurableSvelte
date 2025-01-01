//https://github.com/lambrospetrou/rediflare/blob/main/src/sql-migrations.ts

import type { SQLocal } from "sqlocal";

export const migrationsArray: SchemaMigration[] = [
  {
    idMonotonicInc: 1,
    description: "Create settings table",
    sql: `CREATE TABLE 'settings' (
	'id' text PRIMARY KEY NOT NULL,
	'value' text NOT NULL
)`
  },
  {
    idMonotonicInc: 2,
    description: "Create notes table",
    sql: `CREATE TABLE 'notes' (
	'id' text PRIMARY KEY NOT NULL,
	'name' text NOT NULL,
	'content' text NOT NULL,
	'created_at' integer,
	'updated_at' integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX 'notes_id_unique' ON 'notes' ('id');
`,
  },
];

export interface SchemaMigration {
  idMonotonicInc: number;
  description: string;

  sql?: string;
}

export interface SchemaMigrationsConfig {
  sqliteIstance: SQLocal;
  migrations: SchemaMigration[];

  __lastAppliedMigrationMonotonicID_OVERRIDE_FOR_MANUAL_MIGRATIONS?: number;
}

export class SchemaMigrations {
  _config: Omit<
    SchemaMigrationsConfig,
    "__lastAppliedMigrationMonotonicID_OVERRIDE_FOR_MANUAL_MIGRATIONS"
  >;
  _migrations: SchemaMigration[];

  _lastMigrationMonotonicId = -1;

  constructor(config: SchemaMigrationsConfig) {
    this._config = config;

    const migrations = [...config.migrations];
    migrations.sort((a, b) => a.idMonotonicInc - b.idMonotonicInc);
    const idSeen = new Set<number>();
    migrations.forEach((m) => {
      if (m.idMonotonicInc < 0) {
        throw new Error(`migration ID cannot be negative: ${m.idMonotonicInc}`);
      }
      if (idSeen.has(m.idMonotonicInc)) {
        throw new Error(`duplicate migration ID detected: ${m.idMonotonicInc}`);
      }
      idSeen.add(m.idMonotonicInc);
    });

    this._migrations = migrations;
    /*
    if (config.__lastAppliedMigrationMonotonicID_OVERRIDE_FOR_MANUAL_MIGRATIONS) {
      const { sql } = config.sqliteIstance;
      await sql`UPDATE settings SET value = ${ config.__lastAppliedMigrationMonotonicID_OVERRIDE_FOR_MANUAL_MIGRATIONS } WHERE id = 'migration_version'`;
      //this._config.doStorage.put<number>('_rf_migrations_lastID', config.__lastAppliedMigrationMonotonicID_OVERRIDE_FOR_MANUAL_MIGRATIONS);
    }
    */
  }

  hasMigrationsToRun() {
    if (!this._migrations.length) {
      return false;
    }
    return (
      this._lastMigrationMonotonicId !==
      this._migrations[this._migrations.length - 1].idMonotonicInc
    );
  }

  async runAll(sqlGen?: (idMonotonicInc: number) => string) {
    const result = {
      rowsRead: 0,
      rowsWritten: 0,
    };

    if (!this.hasMigrationsToRun()) {
      return result;
    }
    const { sql } = this._config.sqliteIstance;
        let lastMigratedVersion = undefined;
    let lastMigrationNumber: Array<any> | null = null;

    try{
     lastMigrationNumber =
      await sql`SELECT value FROM settings WHERE id = 'migration_version'`;
    }
    catch(e){
      console.log(e);
    }
    console.log(lastMigrationNumber);

    if (lastMigrationNumber != null && lastMigrationNumber.length > 0) {
      lastMigratedVersion = lastMigrationNumber[0].value ?? null;
    }
    this._lastMigrationMonotonicId = lastMigratedVersion ?? -1;

    // Skip all the applied ones.
    let idx = 0,
      sz = this._migrations.length;
    while (
      idx < sz &&
      this._migrations[idx].idMonotonicInc <= this._lastMigrationMonotonicId
    ) {
      idx += 1;
    }

    // Make sure we still have migrations to run.
    if (idx >= sz) {
      return result;
    }

    const { transaction } = this._config.sqliteIstance;
    const migrationsToRun = this._migrations.slice(idx);

    transaction(async (tx) => {
      migrationsToRun.forEach((migration) => {
        const query = migration.sql ?? sqlGen?.(migration.idMonotonicInc);
        if (!query) {
          throw new Error(
            `migration with neither 'sql' nor 'sqlGen' provided: ${migration.idMonotonicInc} `,
          );
        }

        tx.sql(query);

        this._lastMigrationMonotonicId = migration.idMonotonicInc;
        console.log(`Last migration ID: ${this._lastMigrationMonotonicId}`);
        tx.sql`INSERT OR REPLACE INTO settings (id, value) VALUES ('migration_version', ${this._lastMigrationMonotonicId})`
      });
    });

    return result;
  }
}
