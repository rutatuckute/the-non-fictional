import * as migration_20260907_121347_initial from './20260907_121347_initial';
import * as migration_20260919_165228_r2_media from './20260919_165228_r2_media';

import * as migration_20260919_170858_drop_photo_path from './20260919_170858_drop_photo_path';

export const migrations = [
  {
    up: migration_20260907_121347_initial.up,
    down: migration_20260907_121347_initial.down,
    name: '20260907_121347_initial',
  },
  {
    up: migration_20260919_165228_r2_media.up,
    down: migration_20260919_165228_r2_media.down,
    name: '20260919_165228_r2_media'
  },
  {
    up: migration_20260919_170858_drop_photo_path.up,
    down: migration_20260919_170858_drop_photo_path.down,
    name: '20260919_170858_drop_photo_path'
  },
];
