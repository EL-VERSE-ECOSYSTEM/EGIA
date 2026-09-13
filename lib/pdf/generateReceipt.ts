import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { db } from "@/lib/db";
import { school, student as studentTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSchoolLogo } from "@/lib/branding";

export async function generatePdfReceipt(opts: {
  schoolId: string;
  studentId: string;
  amount: number;
  reference: string;
  confirmedBy?: string | null;
  date: Date;
}): Promise<Uint8Array> {
  const { schoolId, studentId, amount, reference, date, confirmedBy } = opts;

  // Fetch school + student
  const [schoolRec, studentRec] = await Promise.all([
    db.query.school.findFirst({ where: eq(school.id, schoolId) }),
    db.query.student.findFirst({ where: eq(studentTable.id, studentId) }),
  ]);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Logo — fallback to app logo if school logo missing
  const logoUrl = getSchoolLogo(schoolRec);
  try {
    const logoRes = await fetch(logoUrl);
    if (logoRes.ok) {
      const logoBytes = await logoRes.arrayBuffer();
      const isPng = logoUrl.endsWith(".png") || logoUrl.includes("image/png");
      const logo = isPng ? await pdf.embedPng(logoBytes) : await pdf.embedJpg(logoBytes);
      page.drawImage(logo, { x: 50, y: 742, width: 60, height: 60 });
    }
  } catch (err) {
    console.warn("Could not embed logo in PDF receipt:", err);
  }

  // Header
  page.drawText(schoolRec?.name ?? "EL LEARNERS ACADEMY", { x: 125, y: 785, size: 18, font: bold });
  page.drawText(`School Code: ${schoolRec?.code ?? "—"}`, { x: 125, y: 765, size: 10, font });

  // Title
  page.drawText("OFFICIAL PAYMENT RECEIPT", {
    x: 50,
    y: 700,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.5, 0.1),
  });

  // Body
  const studentName = studentRec ? `${studentRec.firstName} ${studentRec.lastName}` : "Student";
  const rows: [string, string][] = [
    ["Student Name", studentName],
    ["Admission Number", studentRec?.admissionNumber ?? "—"],
    ["Class", studentRec?.class ?? "—"],
    ["Amount Paid", `NGN ${amount.toLocaleString()}`],
    ["Reference", reference],
    ["Payment Date", date.toLocaleDateString()],
    ["Confirmed By", confirmedBy || "School Administration"],
    ["Status", "CONFIRMED"],
  ];

  let y = 660;
  for (const [label, value] of rows) {
    page.drawText(label, { x: 50, y, size: 11, font: bold });
    page.drawText(value, { x: 220, y, size: 11, font });
    y -= 25;
  }

  // Footer
  page.drawText("This is an official computer-generated receipt issued by EL LEARNERS APP.", {
    x: 50,
    y: 100,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  return await pdf.save();
}
