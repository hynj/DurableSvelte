<script lang="ts">
import { getDBState, setDBState } from "$lib/sqlocal/db-state.svelte";
import NavBar from "$lib/components/NavBar.svelte";

    import { onMount } from "svelte";
	import '../app.css';

  const dbDBSate = setDBState();

  onMount(async () => {
  	const { db, sleep, setupTables } = await import('$lib/sqlocal/db.svelte');
		const { SchemaMigrations, migrationsArray } = await import('$lib/sqlocal/migrate');


    const dbObj = db('CardioLogMono') 

    dbDBSate.initDB(dbObj);

  		const { sql } = dbObj;

		const migrator = new SchemaMigrations({
			sqliteIstance: dbObj,
			migrations: migrationsArray
		});

    await migrator.runAll();

  	dbDBSate.set('yes');

    
    const insertResult = await sql`INSERT OR IGNORE INTO settings (id, value) VALUES ('init_complete', 'yes')`

    const result = await sql`SELECT * FROM settings`;

  console.log(result);

    console.log('DB initialized');
  });
	let { children } = $props();
</script>
<NavBar />
{@render children()}
