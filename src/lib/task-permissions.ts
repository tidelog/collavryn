export function canReadTasks(role: string) {
  return ["OWNER", "ADMIN", "MEMBER"].includes(role);
}

export function canManageTasks(role: string) {
  return role === "OWNER" || role === "ADMIN";
}
