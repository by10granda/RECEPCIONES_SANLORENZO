export const WARRANTY_STATUSES = [
  "PRODUCTO RECIBIDO EN EL ALMACEN",
  "PRODUCTO ENVIADO AL PROVEEDOR",
  "PRODUCTO LLEGADO AL ALMACEN",
  "PRODUCTO ENTREGADO AL CLIENTE"
] as const;

export type WarrantyStatus = (typeof WARRANTY_STATUSES)[number];

export type Warranty = {
  id: string;
  code: string;
  registeredDate: string;
  registeredTime: string;
  customerName: string;
  customerLastName: string;
  documentType: "Cédula" | "Pasaporte";
  documentNumber: string;
  phone: string;
  email: string;
  saleDate: string;
  receptionDate: string;
  invoiceNumber: string;
  productDescription: string;
  productCode: string;
  serialNumber: string;
  reportedFailure: string;
  observations: string;
  sellerName: string;
  company: string;
  currentStatus: WarrantyStatus;
  lastUpdate: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
  brand: string;
  rowNumber?: number;
};

export type StatusHistory = {
  id: string;
  warrantyCode: string;
  date: string;
  time: string;
  previousStatus: string;
  newStatus: WarrantyStatus;
  responsibleUser: string;
  rowNumber?: number;
};

export type WarrantyWithHistory = Warranty & { history: StatusHistory[] };

export const WARRANTY_HEADERS = [
  "ID",
  "Código de garantía",
  "Fecha de registro",
  "Hora de registro",
  "Nombre cliente",
  "Apellido cliente",
  "Tipo documento",
  "Número documento",
  "Teléfono",
  "Correo",
  "Fecha venta",
  "Fecha recepción almacén",
  "Número factura",
  "Descripción producto",
  "Código producto",
  "Número serie",
  "Falla reportada",
  "Observaciones",
  "Nombre vendedor",
  "Empresa",
  "Estado actual",
  "Última actualización",
  "Usuario creador",
  "Fecha modificación",
  "Usuario modificador",
  "Marca"
] as const;

export const HISTORY_HEADERS = [
  "ID",
  "Código garantía",
  "Fecha",
  "Hora",
  "Estado anterior",
  "Estado nuevo",
  "Usuario responsable"
] as const;
