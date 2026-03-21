-- 1. 사용자 전역 설정 테이블
CREATE TABLE IF NOT EXISTS preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  view_mode TEXT DEFAULT 'masonry',
  masonry_size INTEGER DEFAULT 4,
  grid_size INTEGER DEFAULT 6,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 자산(이미지/비디오) 테이블
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  item_type TEXT DEFAULT 'image',
  image_url TEXT,
  video_url TEXT,
  page_url TEXT,
  page_title TEXT,
  memo TEXT,
  tags TEXT,
  folder TEXT DEFAULT '전체',
  collection_id INTEGER,
  palette_data TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 컬렉션(폴더) 테이블
CREATE TABLE IF NOT EXISTS collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 북마크 테이블
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_type TEXT,
  icon_value TEXT,
  sort_order INTEGER DEFAULT 0,
  icon_scale REAL DEFAULT 1.0,
  icon_offset_x REAL DEFAULT 0,
  icon_offset_y REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
