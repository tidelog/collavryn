import { describe, expect, it } from "vitest";

import { createOrganisationSlug } from "../src/lib/organisation-slug";
import { createOrganisationSchema } from "../src/lib/validation/organisation";

describe("Organisation validation", () => {
  it("accepts a valid organisation name", () => {
    const result = createOrganisationSchema.parse({
      name: "Collavryn Engineering",
    });

    expect(result.name).toBe("Collavryn Engineering");
  });

  it("rejects short names", () => {
    expect(
      createOrganisationSchema.safeParse({ name: "A" }).success,
    ).toBe(false);
  });

  it("rejects unexpected fields", () => {
    expect(
      createOrganisationSchema.safeParse({
        name: "Engineering",
        role: "OWNER",
      }).success,
    ).toBe(false);
  });
});

describe("Organisation slug generation", () => {
  it("generates a URL-safe slug", () => {
    const slug = createOrganisationSlug("Collavryn Engineering");

    expect(slug).toMatch(/^collavryn-engineering-[a-f0-9]{12}$/);
  });

  it("generates different slugs for identical names", () => {
    const first = createOrganisationSlug("Engineering");
    const second = createOrganisationSlug("Engineering");

    expect(first).not.toBe(second);
  });

  it("handles names containing only symbols", () => {
    const slug = createOrganisationSlug("!!!");

    expect(slug).toMatch(/^organisation-[a-f0-9]{12}$/);
  });
});
