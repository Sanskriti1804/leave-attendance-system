import { prisma } from "../../shared/db/index.js";

export function createLeaveDocument(data: {
  leaveId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  contentType: string;
  fileSize: number;
  uploadedBy: number;
}) {
  return prisma.leaveDocument.create({ data });
}

export function findLeaveDocumentById(documentId: number) {
  return prisma.leaveDocument.findUnique({
    where: { documentId },
    include: {
      leave: {
        include: {
          leaveType: true,
        },
      },
    },
  });
}

export function countDocumentsForLeave(leaveId: number): Promise<number> {
  return prisma.leaveDocument.count({ where: { leaveId } });
}
