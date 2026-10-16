import * as migration_20260907_121347_initial from './20260907_121347_initial';
import * as migration_20260919_165228_r2_media from './20260919_165228_r2_media';
import * as migration_20260919_170858_drop_photo_path from './20260919_170858_drop_photo_path';
import * as migration_20260923_163019_three_views from './20260923_163019_three_views';
import * as migration_20260923_171148_editorial_layout from './20260923_171148_editorial_layout';
import * as migration_20261012_152408_covers_in_r2 from './20261012_152408_covers_in_r2';
import * as migration_20261012_194707_anti_library from './20261012_194707_anti_library';
import * as migration_20261013_131436_article_library from './20261013_131436_article_library';
import * as migration_20261014_160138_take_me_home_story from './20261014_160138_take_me_home_story';
import * as migration_20261015_122117_sarajevo_walk from './20261015_122117_sarajevo_walk';
import * as migration_20261015_212733_lithuania_timeline from './20261015_212733_lithuania_timeline';
import * as migration_20261016_113743_ukraine_lavrov_excerpts from './20261016_113743_ukraine_lavrov_excerpts';
import * as migration_20261016_121942_general_theory_no_image from './20261016_121942_general_theory_no_image';
import * as migration_20261016_125924_belarus_key_players from './20261016_125924_belarus_key_players';

export const migrations = [
  {
    up: migration_20260907_121347_initial.up,
    down: migration_20260907_121347_initial.down,
    name: '20260907_121347_initial',
  },
  {
    up: migration_20260919_165228_r2_media.up,
    down: migration_20260919_165228_r2_media.down,
    name: '20260919_165228_r2_media',
  },
  {
    up: migration_20260919_170858_drop_photo_path.up,
    down: migration_20260919_170858_drop_photo_path.down,
    name: '20260919_170858_drop_photo_path',
  },
  {
    up: migration_20260923_163019_three_views.up,
    down: migration_20260923_163019_three_views.down,
    name: '20260923_163019_three_views',
  },
  {
    up: migration_20260923_171148_editorial_layout.up,
    down: migration_20260923_171148_editorial_layout.down,
    name: '20260923_171148_editorial_layout',
  },
  {
    up: migration_20261012_152408_covers_in_r2.up,
    down: migration_20261012_152408_covers_in_r2.down,
    name: '20261012_152408_covers_in_r2',
  },
  {
    up: migration_20261012_194707_anti_library.up,
    down: migration_20261012_194707_anti_library.down,
    name: '20261012_194707_anti_library',
  },
  {
    up: migration_20261013_131436_article_library.up,
    down: migration_20261013_131436_article_library.down,
    name: '20261013_131436_article_library',
  },
  {
    up: migration_20261014_160138_take_me_home_story.up,
    down: migration_20261014_160138_take_me_home_story.down,
    name: '20261014_160138_take_me_home_story',
  },
  {
    up: migration_20261015_122117_sarajevo_walk.up,
    down: migration_20261015_122117_sarajevo_walk.down,
    name: '20261015_122117_sarajevo_walk',
  },
  {
    up: migration_20261015_212733_lithuania_timeline.up,
    down: migration_20261015_212733_lithuania_timeline.down,
    name: '20261015_212733_lithuania_timeline',
  },
  {
    up: migration_20261016_113743_ukraine_lavrov_excerpts.up,
    down: migration_20261016_113743_ukraine_lavrov_excerpts.down,
    name: '20261016_113743_ukraine_lavrov_excerpts',
  },
  {
    up: migration_20261016_121942_general_theory_no_image.up,
    down: migration_20261016_121942_general_theory_no_image.down,
    name: '20261016_121942_general_theory_no_image',
  },
  {
    up: migration_20261016_125924_belarus_key_players.up,
    down: migration_20261016_125924_belarus_key_players.down,
    name: '20261016_125924_belarus_key_players'
  },
];
