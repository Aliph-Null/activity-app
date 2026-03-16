import * as migration_20260106_213817 from './20260106_213817';
import * as migration_20260111_105536 from './20260111_105536';

export const migrations = [
  {
    up: migration_20260106_213817.up,
    down: migration_20260106_213817.down,
    name: '20260106_213817',
  },
  {
    up: migration_20260111_105536.up,
    down: migration_20260111_105536.down,
    name: '20260111_105536'
  },
];
