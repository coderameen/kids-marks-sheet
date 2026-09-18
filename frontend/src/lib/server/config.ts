export const JWT_SECRET =
  process.env.JWT_SECRET || "change-me-in-production-asra-sara-2026";
export const JWT_EXPIRE_HOURS = parseInt(
  process.env.JWT_EXPIRE_HOURS || "24",
  10
);
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ameen@0805";
