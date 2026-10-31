import crypto from "crypto";

const DEFAULT_SCHOOL_QUOTA_BYTES = 50 * 1024 * 1024 * 1024; // 50 GB default per school
const schoolStorageUsageMap = new Map<string, number>();
const mediaBlobHashMap = new Map<string, string>(); // SHA-256 hash -> file URL

export function getSchoolStorageUsage(schoolId: string): number {
  return schoolStorageUsageMap.get(schoolId) ?? 0;
}

export function checkSchoolStorageQuota(
  schoolId: string,
  incomingFileSizeBytes: number,
  customQuotaBytes = DEFAULT_SCHOOL_QUOTA_BYTES
): { allowed: boolean; currentUsageBytes: number; quotaBytes: number; error?: string } {
  const currentUsage = getSchoolStorageUsage(schoolId);
  const projected = currentUsage + incomingFileSizeBytes;

  if (projected > customQuotaBytes) {
    return {
      allowed: false,
      currentUsageBytes: currentUsage,
      quotaBytes: customQuotaBytes,
      error: `Storage quota exceeded for school. Usage limit of ${(customQuotaBytes / (1024 * 1024 * 1024)).toFixed(1)} GB reached.`,
    };
  }

  return {
    allowed: true,
    currentUsageBytes: currentUsage,
    quotaBytes: customQuotaBytes,
  };
}

export function trackStorageUpload(schoolId: string, fileSizeBytes: number) {
  const current = getSchoolStorageUsage(schoolId);
  schoolStorageUsageMap.set(schoolId, current + fileSizeBytes);
}

export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Validates post-upload authorization when accessing documents, receipts, or recordings,
 * ensuring users cannot download documents belonging to another school.
 */
export function verifyDocumentAccessAuthorization(params: {
  userRole: string;
  userSchoolId: string | null;
  documentSchoolId: string | null;
  isPublic?: boolean;
}): boolean {
  if (params.isPublic) return true;
  const role = (params.userRole || '').toUpperCase();
  if (role === 'SUPER_ADMIN') return true;
  if (!params.userSchoolId || !params.documentSchoolId) return false;
  return params.userSchoolId === params.documentSchoolId;
}

export function findExistingBlobByHash(sha256Hash: string): string | null {
  return mediaBlobHashMap.get(sha256Hash) ?? null;
}

export function registerBlobHash(sha256Hash: string, blobUrl: string) {
  mediaBlobHashMap.set(sha256Hash, blobUrl);
}

export function generateChunkUploadToken(fileId: string, chunkIndex: number): string {
  return `chunk_${fileId}_${chunkIndex}_${Date.now()}`;
}
