import prisma from "./db";
import type { Prisma } from "@/generated/prisma/client";

type EventType = "view" | "inquiry" | "favorite" | "unfavorite" | "publish" | "contact_click";

export async function logEvent(
  type: EventType,
  listingId?: string | null,
  userId?: string | null,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.event.create({
      data: {
        type,
        listingId: listingId ?? undefined,
        userId: userId ?? undefined,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Fire-and-forget: never block the main request
  }
}
