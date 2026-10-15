import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const addMemberSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
}).strict();

type Context = {
  params: Promise<{ slug: string }>;
};

async function getAccess(slug: string, userId: string) {
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

export async function GET(
  _request: Request,
  context: Context,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { slug } = await context.params;
  const access = await getAccess(slug, session.user.id);

  if (!access) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 },
    );
  }

  const members = await prisma.membership.findMany({
    where: { organisationId: access.organisationId },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    members,
    currentUserRole: access.role,
  });
}

export async function POST(
  request: Request,
  context: Context,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { slug } = await context.params;
  const access = await getAccess(slug, session.user.id);

  if (!access) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 },
    );
  }

  if (!["OWNER", "ADMIN"].includes(access.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

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

  const parsed = addMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid membership information" },
      { status: 400 },
    );
  }

  if (access.role === "ADMIN" && parsed.data.role !== "MEMBER") {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 },
    );
  }

  try {
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        organisationId: access.organisationId,
        role: parsed.data.role,
      },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to add member" },
      { status: 500 },
    );
  }
}
