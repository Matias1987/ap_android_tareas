export type Task = {
  id: number | string;
  title: string;
  detail: string;
  project: string;
  assignees: string[];
  due: string;
  priority: "Urgente" | "Alta" | "Normal" | "Baja";
  status: "Pendiente" | "En progreso" | "Terminada" | "Vencida" | "Cancelada";
};
