import { prisma } from "@/lib/prisma";

type ActivityInput = {
  organisationId: string;
  actorId: string;
  action: string;
  entityType: "PROJECT" | "TASK";
  entityId: string;
  summary: string;
};

export async function recordActivity(input: ActivityInput) {
  try {
    await prisma.activityLog.create({
      data: input,
    });
  } catch (error) {
    console.error("Activity recording failed", error);
  }
}
