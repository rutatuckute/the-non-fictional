import * as migration_20260907_121347_initial from './20260907_121347_initial';

export const migrations = [
  {
    up: migration_20260907_121347_initial.up,
    down: migration_20260907_121347_initial.down,
    name: '20260907_121347_initial'
  },
];
