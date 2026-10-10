import { google } from "googleapis";

export async function validateIdPdfUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { return "Ingrese una URL válida para el PDF de la cédula."; }
  if (url.protocol !== "https:" || url.username || url.password) return "El enlace al PDF debe usar HTTPS y no incluir credenciales.";
  if (url.hostname === "drive.google.com" || url.hostname === "docs.google.com") {
    const id = url.pathname.match(/^\/file\/d\/([\w-]+)(?:\/|$)/)?.[1] || url.searchParams.get("id");
    if (!id || !/^[\w-]+$/.test(id)) return "Use el enlace del archivo PDF de Google Drive, no de una carpeta.";
    try {
      const auth = new google.auth.JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
      const response = await google.drive({ version: "v3", auth }).files.get({ fileId: id, fields: "mimeType,trashed", supportsAllDrives: true });
      if (response.data.trashed || response.data.mimeType !== "application/pdf") return "El archivo de la cédula debe ser un PDF.";
      return null;
    } catch {
      return "No se pudo verificar el PDF de Drive. Comparta el archivo con la cuenta de servicio y habilite Google Drive API, o use una URL HTTPS terminada en .pdf.";
    }
  }
  // Do not fetch arbitrary URLs on the server (SSRF). For external links validate the .pdf extension.
  if (!/\.pdf$/i.test(url.pathname)) return "El enlace debe apuntar a un archivo con extensión .pdf.";
  return null;
}
