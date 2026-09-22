export type ReportTable = {
  slug: string;
  from: string;
  to: string;
  columns: string[];
  rows: string[][];
};

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function toCsv(table: ReportTable): string {
  const lines = [table.columns.map(csvCell).join(","), ...table.rows.map((row) => row.map(csvCell).join(","))];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function toExcelXml(table: ReportTable): string {
  const cell = (value: string) =>
    `<Cell><Data ss:Type="String">${value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</Data></Cell>`;
  const header = `<Row>${table.columns.map(cell).join("")}</Row>`;
  const body = table.rows.map((row) => `<Row>${row.map(cell).join("")}</Row>`).join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Report"><Table>${header}${body}</Table></Worksheet>
</Workbook>`;
}

function pdfEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function toPdf(table: ReportTable): Buffer {
  const lines = [
    `${table.slug} ${table.from} to ${table.to}`,
    table.columns.join(" | "),
    ...table.rows.slice(0, 80).map((row) => row.join(" | ")),
  ];
  let y = 800;
  const ops: string[] = ["BT /F1 9 Tf"];
  for (const line of lines) {
    ops.push(`1 0 0 1 36 ${y} Tm (${pdfEscape(line.slice(0, 110))}) Tj`);
    y -= 12;
    if (y < 40) {
      break;
    }
  }
  ops.push("ET");
  const stream = ops.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];
  let offset = 9;
  const xref = ["0000000000 65535 f "];
  const chunks: string[] = ["%PDF-1.4\n"];
  for (const object of objects) {
    xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
    chunks.push(`${object}\n`);
    offset += Buffer.byteLength(`${object}\n`);
  }
  const xrefStart = offset;
  chunks.push(`xref\n0 ${objects.length + 1}\n${xref.join("\n")}\n`);
  chunks.push(`trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
  return Buffer.from(chunks.join(""), "utf8");
}
