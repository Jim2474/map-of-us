export const adminModeUpdatedEvent = "mapofus:admin-mode-updated";
export const adminModeSessionKey = "mapofus:admin-unlocked";

export const readAdminMode = () => {
  if (typeof window === "undefined") return true;

  const stored = window.sessionStorage.getItem(adminModeSessionKey);
  if (stored === null) return true;
  return stored === "true";
};

export const writeAdminMode = (unlocked: boolean) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(adminModeSessionKey, unlocked ? "true" : "false");
  window.dispatchEvent(new CustomEvent<boolean>(adminModeUpdatedEvent, { detail: unlocked }));
};
