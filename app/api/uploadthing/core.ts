import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  receiptUploader: f({ image: { maxFileSize: "4MB" }, pdf: { maxFileSize: "4MB" } })
    .middleware(async () => {
      const session = await auth.getSession();
      if (!session?.user) throw new Error("Unauthorized: Valid session required for file upload.");

      return {
        userId: session.user.id,
        schoolId: session.user.schoolId || null,
        role: session.user.role || 'USER',
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for user:", metadata.userId, "file:", file.url);
      return { url: file.url, uploadedBy: metadata.userId, schoolId: metadata.schoolId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
