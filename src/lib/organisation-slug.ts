import { randomBytes } from "node:crypto";

export function createOrganisationSlug(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

  const suffix = randomBytes(6).toString("hex");

  return `${base || "organisation"}-${suffix}`;
}
