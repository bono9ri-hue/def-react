-- 1. 꼬여버린 과거의 콜렉션 테이블 도려내기 (에셋과 태그는 건드리지 않음)
DROP TABLE IF EXISTS collection_assets;
DROP TABLE IF EXISTS collections;

-- 2. 완벽한 형태의 콜렉션 테이블 재구축 (description 포함)
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'private',
  is_public INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. M:N 맵핑 테이블 재구축
CREATE TABLE collection_assets (
  collection_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  context_status TEXT DEFAULT 'pending',
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, asset_id),
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 4. 인덱싱
CREATE INDEX IF NOT EXISTS idx_collection_assets_asset ON collection_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_collection_assets_collection ON collection_assets(collection_id);