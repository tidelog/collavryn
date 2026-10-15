import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const updateRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
}).strict();

type Context = {
  params: Promise<{
    slug: string;
    membershipId: string;
  }>;
};

async function modifyMembership(
  context: Context,
  operation: "update" | "delete",
  nextRole?: "OWNER" | "ADMIN" | "MEMBER",
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { slug, membershipId } = await context.params;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const actor = await tx.membership.findFirst({
          where: {
            userId: session.user.id,
            organisation: { slug },
          },
          select: {
            role: true,
            organisationId: true,
          },
        });

        if (!actor) {
          return { status: 404, error: "Workspace not found" };
        }

        if (actor.role !== "OWNER") {
          return { status: 403, error: "Owner permission required" };
        }

        const target = await tx.membership.findFirst({
          where: {
            id: membershipId,
            organisationId: actor.organisationId,
          },
        });

        if (!target) {
          return { status: 404, error: "Member not found" };
        }

        if (
          target.role === "OWNER" &&
          (operation === "delete" || nextRole !== "OWNER")
        ) {
          const ownerCount = await tx.membership.count({
            where: {
              organisationId: actor.organisationId,
              role: "OWNER",
            },
          });

          if (ownerCount <= 1) {
            return {
              status: 409,
              error: "Cannot remove the last organisation owner",
            };
          }
        }

        if (operation === "delete") {
          await tx.membership.delete({
            where: { id: membershipId },
          });

          return { status: 200, success: true };
        }

        const membership = await tx.membership.update({
          where: { id: membershipId },
          data: { role: nextRole! },
          select: {
            id: true,
            role: true,
          },
        });

        return { status: 200, membership };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return NextResponse.json(result, { status: result.status });
  } catch {
    return NextResponse.json(
      { error: "Unable to modify membership" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 },
    );
  }

  let body: unknown;

  try {
    const raw = await request.text();

    if (Buffer.byteLength(raw, "utf8") > 4096) {
      return NextResponse.json(
        { error: "Request too large" },
        { status: 413 },
      );
    }

    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const parsed = updateRoleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid role" },
      { status: 400 },
    );
  }

  return modifyMembership(context, "update", parsed.data.role);
}

export async function DELETE(_request: Request, context: Context) {
  return modifyMembership(context, "delete");
}
