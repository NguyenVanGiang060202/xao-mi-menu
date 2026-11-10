import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { recordMenuEvents } from "@/lib/menu-tracking";
import { trackingEvents, type TrackingEvent } from "@/lib/tracking-data";

const allowedEvents = new Set<string>(trackingEvents);

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return new Response(null, { status: 403 });
  }

  const events = request.nextUrl.searchParams.getAll("event");
  if (events.length < 1 || events.length > 4 || new Set(events).size !== events.length ||
    !events.every((event): event is TrackingEvent => allowedEvents.has(event))) {
    return new Response(null, { status: 400 });
  }

  const environment = process.env.VERCEL_ENV;
  try {
    if (environment !== "preview" && (environment !== "production" || !await isAdmin())) {
      await recordMenuEvents(events);
    }
  } catch {
    return new Response(null, { status: 503 });
  }

  return new Response(null, { status: 204 });
}
