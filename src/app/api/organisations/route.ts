import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createOrganisationSlug } from "@/lib/organisation-slug";
import { createOrganisationSchema } from "@/lib/validation/organisation";

const MAX_REQUEST_BYTES = 4096;

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 },
    );
  }

  let body: unknown;

  try {
    const rawBody = await request.text();

    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: "Request body is too large" },
        { status: 413 },
      );
    }

    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const parsed = createOrganisationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid organisation information",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const organisation = await prisma.$transaction(async (tx) => {
      const created = await tx.organisation.create({
        data: {
          name: parsed.data.name,
          slug: createOrganisationSlug(parsed.data.name),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      });

      await tx.membership.create({
        data: {
          userId,
          organisationId: created.id,
          role: "OWNER",
        },
      });

      return created;
    });

    return NextResponse.json(
      { organisation },
      { status: 201 },
    );
  } catch {
    console.error("Organisation creation failed");

    return NextResponse.json(
      { error: "Unable to create organisation" },
      { status: 500 },
    );
  }
}


export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const organisations = await prisma.organisation.findMany({
    where: {
      memberships: {
        some: { userId: session.user.id },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      memberships: {
        where: { userId: session.user.id },
        select: { role: true },
      },
      _count: {
        select: { memberships: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ organisations });
}
