import * as pdfjs from "pdfjs-dist/legacy/build/pdf.js";

export async function extractTextFromPdfBuffer(
  buffer: Buffer
): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = (pdfjs as any).getDocument({ data: uint8Array });
  const pdfDoc = await loadingTask.promise;

  let fullText = "";
  for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
    const page = await pdfDoc.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = (content.items as any[])
      .map((item: any) => item?.str ?? "")
      .join(" ");
    fullText += pageText + "\n";
  }

  await pdfDoc.destroy();
  return fullText.trim();
}
