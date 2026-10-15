import { prisma } from "@/lib/prisma";
import { canManageProjects } from "@/lib/project-permissions";

export { canManageProjects };

export async function getProjectAccess(
  slug: string,
  userId: string,
) {
  return prisma.membership.findFirst({
    where: {
      userId,
      organisation: { slug },
    },
    select: {
      role: true,
      organisationId: true,
    },
  });
}

export async function parseProjectBody(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase();

  if (!contentType?.startsWith("application/json")) {
    return { ok: false as const, status: 415, error: "JSON required" };
  }

  const declaredSize = Number(request.headers.get("content-length"));

  if (declaredSize > 8192) {
    return { ok: false as const, status: 413, error: "Request too large" };
  }

  try {
    const raw = await request.text();

    if (Buffer.byteLength(raw, "utf8") > 8192) {
      return { ok: false as const, status: 413, error: "Request too large" };
    }

    return { ok: true as const, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false as const, status: 400, error: "Invalid JSON" };
  }
}
