import type { Task } from "./types";

const statusLabels: Record<string, Task["status"]> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Terminada",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
};

const priorityLabels: Record<string, Task["priority"]> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export function mapApiTask(task: any): Task {
  return {
    id: task.id,
    title: task.title,
    detail: task.description || "",
    project: "General",
    assignees: (task.assignments || []).map(
      (assignment: any) => assignment.user?.name || "Usuario",
    ),
    due: task.dueAt
      ? new Date(task.dueAt).toLocaleString("es-AR", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Sin fecha",
    priority: priorityLabels[task.priority] || "Normal",
    status: statusLabels[task.status] || "Pendiente",
  };
}

export function toApiPriority(priority: Task["priority"]): string {
  return {
    Baja: "LOW",
    Normal: "NORMAL",
    Alta: "HIGH",
    Urgente: "URGENT",
  }[priority];
}
