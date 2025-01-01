import m0000 from './0000_plain_terrax.sql';
import m0001 from './0001_awesome_blizzard.sql';
import m0002 from './0002_next_klaw.sql';
import m0003 from './0003_elite_bucky.sql';
import m0004 from './0004_swift_eternity.sql';
import m0005 from './0005_needy_husk.sql';
import journal from './meta/_journal.json';

export default {
	journal,
	migrations: {
		m0000,
		m0001,
		m0002,
		m0003,
		m0004,
		m0005
	},
};
