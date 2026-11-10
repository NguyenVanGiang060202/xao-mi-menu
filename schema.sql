CREATE TABLE IF NOT EXISTS menu_state (
  id integer PRIMARY KEY CHECK (id = 1),
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_tracking_daily (
  scope text NOT NULL CHECK (scope IN ('production', 'development')),
  day date NOT NULL,
  event text NOT NULL,
  total bigint NOT NULL CHECK (total > 0),
  PRIMARY KEY (scope, day, event)
);

ALTER TABLE menu_tracking_daily
  DROP CONSTRAINT IF EXISTS menu_tracking_daily_event_check,
  ADD CONSTRAINT menu_tracking_daily_event_check CHECK (
    event IN ('view', 'zalo', 'grab', 'be', 'xanh', 'maps', 'grab_price', 'zalo_contact', 'zalo_navigation')
    OR event ~ '^scroll_(25|50|75|100)$'
    OR event ~ '^(tab|search_found|search_empty)_(shop|grab|be|xanh)$'
    OR event ~ '^category_(shop|grab|be|xanh)_(all|combo|stir_fried|mixed|sides|drinks|other)$'
  );
