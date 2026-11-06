import type { Task } from "./types";

export const seed: Task[] = [
  {
    id: 1,
    title: "Preparar propuesta comercial",
    detail: "Consolidar costos y enviar propuesta al cliente.",
    project: "Comercial",
    assignees: ["Lucía M.", "Tomás R."],
    due: "Hoy · 16:00",
    priority: "Urgente",
    status: "En progreso",
  },
  {
    id: 2,
    title: "Revisar inventario de depósito",
    detail: "Contar herramientas y actualizar el registro.",
    project: "Operaciones",
    assignees: ["Mateo G."],
    due: "Hoy · 18:00",
    priority: "Alta",
    status: "Pendiente",
  },
  {
    id: 3,
    title: "Enviar reporte semanal",
    detail: "Compartir resumen de avances con el equipo.",
    project: "Administración",
    assignees: ["Lucía M."],
    due: "Mañana · 12:00",
    priority: "Normal",
    status: "Pendiente",
  },
  {
    id: 4,
    title: "Coordinar visita técnica",
    detail: "Confirmar disponibilidad con el cliente.",
    project: "Operaciones",
    assignees: ["Tomás R."],
    due: "4 nov · 10:30",
    priority: "Baja",
    status: "Terminada",
  },
];
