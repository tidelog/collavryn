export function canManageProjects(role: string) {
  return role === "OWNER" || role === "ADMIN";
}
