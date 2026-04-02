-- 기존 테이블 완전히 날리기 (데이터가 없으므로 안전함)
DROP TABLE IF EXISTS asset_tags;
DROP TABLE IF EXISTS collection_assets;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS tags;

-- 1. Assets (TEXT UUID 강제)
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  created_by_user_id TEXT NOT NULL,
  item_type TEXT DEFAULT 'image',
  file_key TEXT,
  image_url TEXT,
  video_url TEXT,
  page_url TEXT,
  page_title TEXT,
  memo TEXT,
  tags TEXT,
  palette_data TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);

-- 2. Tags (TEXT UUID 강제)
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Asset_Tags (M:N 조인 - 양쪽 모두 TEXT 여야 함)
CREATE TABLE asset_tags (
  asset_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (asset_id, tag_id),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);