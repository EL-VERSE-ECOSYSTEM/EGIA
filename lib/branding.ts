export function getSchoolLogo(school?: { logo_url?: string | null; logoUrl?: string | null } | null): string {
  return school?.logo_url || school?.logoUrl || "/app-logo.png";
}
