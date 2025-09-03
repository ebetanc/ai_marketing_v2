// Centralized storage bucket + path helpers
// Keeps pages consistent and eases future bucket changes.

export const MEDIA_BUCKET = "media";

// Structured path helpers (avoid scattering string literals):
export const campaignAssetPath = (id: string, originalName: string) => {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `campaign/${id}-${safe}`;
};

export const avatarInputPath = (id: string, originalName: string) => {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `avatar-input/${id}-${safe}`;
};

// Future: output asset paths, thumbnails, etc.
