export async function validateIdPdfUrl(value: string) {
  if (value.length > 2000) return "El enlace no puede superar los 2000 caracteres.";
  let url: URL;
  try { url = new URL(value); } catch { return "Ingrese una URL válida para el documento de cédula."; }
  if (url.protocol !== "https:" || url.username || url.password) return "El enlace debe usar HTTPS y no incluir credenciales.";
  // Only store the link: do not download identity documents or require Drive API access.
  return null;
}
