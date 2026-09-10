import type { Request } from "express";
import { HttpError } from "../../shared/utils/http-error.js";

export type MultipartFile = {
  originalName: string;
  declaredContentType: string;
  buffer: Buffer;
};

function headerValue(headers: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\r\\n)${name}\\s*:\\s*([^\\r\\n]+)`, "i").exec(headers);
  return match?.[1]?.trim();
}

function parseContentDisposition(value: string): { name?: string; filename?: string } {
  const name = /(?:^|;)\s*name="([^"]*)"/i.exec(value)?.[1];
  const filename = /(?:^|;)\s*filename="([^"]*)"/i.exec(value)?.[1];
  const filenameStar = /(?:^|;)\s*filename\*=(?:UTF-8'')?([^;]+)/i.exec(value)?.[1];
  return {
    name,
    filename: filenameStar ? decodeURIComponent(filenameStar.replace(/^UTF-8''/i, "")) : filename,
  };
}

export async function readRequestBuffer(req: Request, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > maxBytes) {
      throw new HttpError(422, "FILE_TOO_LARGE", "File exceeds the maximum allowed size");
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export function parseMultipart(body: Buffer, contentTypeHeader: string): {
  leaveIdRaw?: string;
  file?: MultipartFile;
} {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentTypeHeader);
  if (!boundaryMatch) {
    throw new HttpError(422, "VALIDATION_ERROR", "Multipart boundary is missing");
  }
  const boundary = boundaryMatch[1] ?? boundaryMatch[2]!.trim();
  const delimiter = Buffer.from(`--${boundary}`);
  const result: { leaveIdRaw?: string; file?: MultipartFile } = {};

  let offset = 0;
  while (offset < body.length) {
    const start = body.indexOf(delimiter, offset);
    if (start === -1) {
      break;
    }
    const partStart = start + delimiter.length;
    if (body.subarray(partStart, partStart + 2).toString() === "--") {
      break;
    }
    let dataStart = partStart;
    if (body[partStart] === 0x0d && body[partStart + 1] === 0x0a) {
      dataStart = partStart + 2;
    }
    const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), dataStart);
    if (headerEnd === -1) {
      break;
    }
    const next = body.indexOf(delimiter, headerEnd + 4);
    const partEnd = next === -1 ? body.length : next;
    let payload = body.subarray(headerEnd + 4, partEnd);
    if (payload.length >= 2 && payload[payload.length - 2] === 0x0d && payload[payload.length - 1] === 0x0a) {
      payload = payload.subarray(0, payload.length - 2);
    }
    const headers = body.subarray(dataStart, headerEnd).toString("utf8");
    const disposition = headerValue(headers, "content-disposition") ?? "";
    const parsed = parseContentDisposition(disposition);
    const partContentType = headerValue(headers, "content-type") ?? "";

    if (parsed.name === "leaveId") {
      result.leaveIdRaw = payload.toString("utf8").trim();
    } else if (parsed.name === "file") {
      result.file = {
        originalName: parsed.filename ?? "",
        declaredContentType: partContentType,
        buffer: Buffer.from(payload),
      };
    }
    offset = partEnd;
  }

  return result;
}
