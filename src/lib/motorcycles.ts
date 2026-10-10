import type { Branch } from "./branches";

export const MOTORCYCLE_STATUSES = ["DISPONIBLE", "VENDIDA CON MATRICULA EN PROCESO", "MATRICULA ENTREGADA"] as const;
export type MotorcycleStatus = (typeof MOTORCYCLE_STATUSES)[number];

export type Motorcycle = {
  id: string;
  code: string;
  description: string;
  brand: string;
  chassisNumber: string;
  observations: string;
  receivedAt: string;
  invoiceNumber: string;
  idPdfUrl: string;
  licenseNumber: string;
  status: MotorcycleStatus;
  branch: Branch;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  stateChangedAt: string;
  revision: string;
  rowNumber?: number;
};

export type MotorcycleHistory = {
  id: string;
  motorcycleId: string;
  timestamp: string;
  previousStatus: string;
  newStatus: MotorcycleStatus;
  username: string;
  action: "REGISTRO" | "EDICION" | "ESTADO";
  details: string;
};

export const MOTORCYCLE_HEADERS = ["ID", "Código", "Descripción", "Marca", "Número de chasis", "Observaciones", "Fecha de ingreso", "Número de factura", "PDF cédula", "Número de matrícula", "Estado", "Sucursal", "Usuario creador", "Última actualización", "Usuario modificador", "Fecha cambio estado", "Revisión"];
export const MOTORCYCLE_HISTORY_HEADERS = ["ID", "ID moto", "Fecha y hora", "Estado anterior", "Estado nuevo", "Usuario", "Acción", "Detalle"];
