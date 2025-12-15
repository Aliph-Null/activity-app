import * as migration_20251124_092942 from './20251124_092942';
import * as migration_20251126_063239 from './20251126_063239';

export const migrations = [
  {
    up: migration_20251124_092942.up,
    down: migration_20251124_092942.down,
    name: '20251124_092942',
  },
  {
    up: migration_20251126_063239.up,
    down: migration_20251126_063239.down,
    name: '20251126_063239'
  },
];
