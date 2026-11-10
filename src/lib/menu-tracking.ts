import "server-only";
import { neon } from "@neondatabase/serverless";
import type { TrackingDay, TrackingEvent, TrackingPeriod } from "./tracking-data";

const scope = process.env.VERCEL_ENV === "production" ? "production" : "development";

function database() {
  if (!process.env.DATABASE_URL) throw new Error("Chưa cấu hình DATABASE_URL.");
  return neon(process.env.DATABASE_URL);
}

export async function recordMenuEvents(events: TrackingEvent[]) {
  const sql = database();
  await sql`
    INSERT INTO menu_tracking_daily (scope, day, event, total)
    SELECT ${scope}, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, event, 1
    FROM unnest(${events}::text[]) AS batch(event)
    ORDER BY event
    ON CONFLICT (scope, day, event) DO UPDATE SET total = menu_tracking_daily.total + 1
  `;
}

export async function readMenuTracking(period: TrackingPeriod): Promise<TrackingDay[]> {
  const sql = database();
  const rows = await sql`
    WITH dates AS (
      SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - days.ago AS day
      FROM generate_series(0, ${period}::int - 1) AS days(ago)
    )
    SELECT to_char(dates.day, 'YYYY-MM-DD') AS day,
      COALESCE(jsonb_object_agg(stats.event, stats.total)
        FILTER (WHERE stats.event IS NOT NULL), '{}'::jsonb) AS counts
    FROM dates
    LEFT JOIN menu_tracking_daily stats ON stats.scope = ${scope} AND stats.day = dates.day
    GROUP BY dates.day
    ORDER BY dates.day DESC
  `;
  return rows.map(({ day, counts }) => ({ day, counts }));
}
