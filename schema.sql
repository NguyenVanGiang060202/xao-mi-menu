CREATE TABLE IF NOT EXISTS menu_state (
  id integer PRIMARY KEY CHECK (id = 1),
  data jsonb NOT NULL
);
