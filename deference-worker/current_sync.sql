PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  url TEXT,
  icon_type TEXT,
  icon_value TEXT,
  sort_order INTEGER DEFAULT 0,
  icon_scale REAL DEFAULT 1.0,
  icon_offset_x REAL DEFAULT 0,
  icon_offset_y REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0000_init_full_schema.sql','2026-03-23 18:24:33');
INSERT INTO "d1_migrations" VALUES(2,'0000_full_recovery.sql','2026-03-23 18:24:33');
INSERT INTO "d1_migrations" VALUES(3,'0001_migrate_assets_to_mn_collections.sql','2026-03-23 18:24:33');
INSERT INTO "d1_migrations" VALUES(4,'0002_zero_copy_schema.sql','2026-03-23 18:24:33');
INSERT INTO "d1_migrations" VALUES(5,'0003_add_deleted_at_to_assets.sql','2026-03-23 18:24:33');
INSERT INTO "d1_migrations" VALUES(6,'0004_add_folder_sharing_schema.sql','2026-03-24 09:17:27');
INSERT INTO "d1_migrations" VALUES(7,'0005_add_users_table.sql','2026-03-24 09:17:27');
CREATE TABLE preferences (
  user_id TEXT PRIMARY KEY,
  view_mode TEXT DEFAULT 'masonry',
  masonry_size INTEGER DEFAULT 4,
  grid_size INTEGER DEFAULT 6,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "preferences" VALUES('user_3AleJC1YEWmcaBqbPE3t2GssmLr','masonry',8,7,'2026-03-25 11:30:14');
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE assets (id INTEGER PRIMARY KEY AUTOINCREMENT, created_by_user_id TEXT NOT NULL, collection_id INTEGER, item_type TEXT DEFAULT 'image', image_url TEXT, video_url TEXT, thumbnail_key TEXT, page_url TEXT, page_title TEXT, memo TEXT, tags TEXT, palette_data TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP, display_key TEXT);
INSERT INTO "assets" VALUES(1,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774510686686-upload.webp','',NULL,'','','','',NULL,'trashed','2026-03-26 07:38:07','2026-03-27 00:39:05',NULL,NULL);
INSERT INTO "assets" VALUES(2,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774511014403-붙여넣은 동영상-2.png','','/assets/1774511014409-thumb_붙여넣은 동영상-2.png','','','','',NULL,'trashed','2026-03-26 07:43:35','2026-03-26 07:48:01',NULL,NULL);
INSERT INTO "assets" VALUES(3,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',1,'image','/assets/1774511014403-붙여넣은 동영상-2.png','','/assets/1774511014409-thumb_붙여넣은 동영상-2.png','','','','',NULL,'trashed','2026-03-26 07:44:07','2026-03-26 07:51:51',NULL,NULL);
INSERT INTO "assets" VALUES(4,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774511292670-붙여넣은 동영상-2.png','','/assets/1774511292671-thumb-1774511292667.webp','','','','',NULL,'trashed','2026-03-26 07:48:12','2026-03-26 07:48:12',NULL,NULL);
INSERT INTO "assets" VALUES(5,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774511519193-붙여넣은 동영상-2.png','','/assets/1774511519195-thumb-붙여넣은 동영상-2.webp','','','','',NULL,'active','2026-03-26 07:51:59','2026-03-26 07:51:59',NULL,NULL);
INSERT INTO "assets" VALUES(6,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774511770110-붙여넣은 동영상-2.png','','/assets/1774511770128-thumb-붙여넣은 동영상-2.webp','','','','',NULL,'active','2026-03-26 07:56:10','2026-03-26 07:56:10',NULL,NULL);
INSERT INTO "assets" VALUES(7,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774511867628-붙여넣은 동영상-3.png','','/assets/1774511867629-thumb-붙여넣은 동영상-3.webp','','','','',NULL,'active','2026-03-26 07:57:48','2026-03-26 07:57:48',NULL,NULL);
INSERT INTO "assets" VALUES(8,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774512057466-붙여넣은 동영상-5.png','','/assets/1774512057479-thumb-붙여넣은 동영상-5.webp','','','','',NULL,'active','2026-03-26 08:00:57','2026-03-26 08:00:57',NULL,NULL);
INSERT INTO "assets" VALUES(9,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774512321828-붙여넣은 이미지.png','','/assets/1774512321831-thumb-붙여넣은 이미지.webp','','','','',NULL,'active','2026-03-26 08:05:23','2026-03-26 08:05:23',NULL,NULL);
INSERT INTO "assets" VALUES(10,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774512668598-붙여넣은 동영상.png','','/assets/1774512668611-thumb-붙여넣은 동영상.webp','','','','',NULL,'trashed','2026-03-26 08:11:09','2026-03-26 08:11:09',NULL,NULL);
INSERT INTO "assets" VALUES(11,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774512709314-스크린샷 2025-08-10 오후 2.56.22.png','','/assets/1774512709316-thumb-스크린샷 2025-08-10 오후 2.56.22.webp','','','','',NULL,'trashed','2026-03-26 08:11:49','2026-03-26 08:11:49',NULL,NULL);
INSERT INTO "assets" VALUES(12,'user_3AleJC1YEWmcaBqbPE3t2GssmLr',NULL,'image','/assets/1774512940639-붙여넣은_동영상-3.png','','/assets/1774512940655-thumb-붙여넣은_동영상-3.webp','','','','',NULL,'trashed','2026-03-26 08:15:41','2026-03-27 00:39:02',NULL,NULL);
CREATE TABLE asset_collections (collection_id INTEGER NOT NULL, asset_id INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (collection_id, asset_id), FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE, FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE);
CREATE TABLE collections (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, owner_user_id TEXT NOT NULL, type TEXT DEFAULT 'private', is_pinned INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
INSERT INTO "collections" VALUES(1,'ㅁㅁ','user_3AleJC1YEWmcaBqbPE3t2GssmLr','private',0,'active','2026-03-26 07:44:07');
CREATE TABLE collection_members (collection_id INTEGER NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'viewer', PRIMARY KEY (collection_id, user_id), FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE);
INSERT INTO "collection_members" VALUES(1,'user_3AleJC1YEWmcaBqbPE3t2GssmLr','editor');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',7);
INSERT INTO "sqlite_sequence" VALUES('assets',12);
INSERT INTO "sqlite_sequence" VALUES('collections',1);
CREATE INDEX idx_users_email ON users(email);