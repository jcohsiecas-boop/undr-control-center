"use client";

import { useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Filter, KanbanSquare, ListFilter, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Task = {
  id: string;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  progress: number;
  tags: string[];
  createdAt: string;
  phase: { id: string; name: string };
  assignee: { name: string | null; email: string } | null;
  comments: { id: string; body: string; createdAt: string; user: { name: string | null } }[];
  attachments: { id: string; name: string; url: string; type: string }[];
};

type Phase = { id: string; name: string };

const statusLabels = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  BLOCKED: "Bloqueado",
  COMPLETED: "Completado"
};

const priorityTone = {
  LOW: "default",
  MEDIUM: "blue",
  HIGH: "amber",
  CRITICAL: "red"
} as const;

export function TaskWorkspace({ initialTasks, phases }: { initialTasks: Task[]; phases: Phase[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [draft, setDraft] = useState({ title: "", description: "", phaseId: phases[0]?.id ?? "", priority: "MEDIUM" });

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        const text = `${task.title} ${task.description} ${task.tags.join(" ")}`.toLowerCase();
        return text.includes(query.toLowerCase()) && (status === "ALL" || task.status === status) && (priority === "ALL" || task.priority === priority);
      }),
    [tasks, query, status, priority]
  );

  async function updateStatus(taskId: string, nextStatus: Task["status"]) {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: nextStatus, progress: nextStatus === "COMPLETED" ? 100 : task.progress } : task)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, progress: nextStatus === "COMPLETED" ? 100 : undefined })
    });
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const nextStatus = result.destination.droppableId as Task["status"];
    await updateStatus(result.draggableId, nextStatus);
  }

  async function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title || !draft.phaseId) return;
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, tags: ["nuevo"], progress: 0 })
    });
    const task = await response.json();
    setTasks((current) => [{ ...task, comments: [], attachments: [] }, ...current]);
    setDraft({ title: "", description: "", phaseId: phases[0]?.id ?? "", priority: "MEDIUM" });
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge tone="red" className="mb-3">Checklist Empresarial</Badge>
          <h1 className="text-3xl font-semibold">Control operativo y trazabilidad</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tareas, evidencias, comentarios, responsables, fases y avance ejecutivo.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}><KanbanSquare className="h-4 w-4" /> Kanban</Button>
          <Button variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}><ListFilter className="h-4 w-4" /> Tabla</Button>
        </div>
      </section>

      <Card className="bg-card/75 backdrop-blur">
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_160px_160px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busqueda avanzada por titulo, descripcion o tags" />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Todos los estados</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="ALL">Todas las prioridades</option>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Critica</option>
          </Select>
          <Button variant="secondary"><Filter className="h-4 w-4" /> {filtered.length}</Button>
        </CardContent>
      </Card>

      <Card className="bg-card/75 backdrop-blur">
        <CardHeader><CardTitle>Nueva tarea ejecutiva</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_120px_auto]" onSubmit={createTask}>
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Titulo" />
            <Textarea className="min-h-10 lg:h-10" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Descripcion" />
            <Select value={draft.phaseId} onChange={(e) => setDraft({ ...draft, phaseId: e.target.value })}>{phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</Select>
            <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}><option value="MEDIUM">Media</option><option value="HIGH">Alta</option><option value="CRITICAL">Critica</option><option value="LOW">Baja</option></Select>
            <Button><Plus className="h-4 w-4" /> Crear</Button>
          </form>
        </CardContent>
      </Card>

      {view === "kanban" ? <Kanban tasks={filtered} onDragEnd={onDragEnd} /> : <TaskTable tasks={filtered} updateStatus={updateStatus} />}
    </div>
  );
}

function Kanban({ tasks, onDragEnd }: { tasks: Task[]; onDragEnd: (result: DropResult) => void }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 xl:grid-cols-4">
        {Object.entries(statusLabels).map(([status, label]) => (
          <Droppable droppableId={status} key={status}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-96 rounded-lg border border-border bg-card/55 p-3">
                <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">{label}</h2><Badge>{tasks.filter((task) => task.status === status).length}</Badge></div>
                <div className="space-y-3">
                  {tasks.filter((task) => task.status === status).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(drag) => (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className="rounded-md border border-border bg-background/70 p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{task.title}</p>
                            <Badge tone={priorityTone[task.priority]}>{task.priority}</Badge>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                          <div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${task.progress}%` }} /></div>
                          <div className="mt-3 flex flex-wrap gap-1">{task.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
                        </motion.div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

function TaskTable({ tasks, updateStatus }: { tasks: Task[]; updateStatus: (id: string, status: Task["status"]) => void }) {
  return (
    <Card className="overflow-hidden bg-card/75 backdrop-blur">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Tarea</th><th>Fase</th><th>Prioridad</th><th>Estado</th><th>Responsable</th><th>Avance</th><th>Evidencias</th></tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-t border-border">
                <td className="p-3"><div className="font-medium">{task.title}</div><div className="text-xs text-muted-foreground">{task.description}</div></td>
                <td>{task.phase.name}</td>
                <td><Badge tone={priorityTone[task.priority]}>{task.priority}</Badge></td>
                <td><Select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value as Task["status"])}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></td>
                <td>{task.assignee?.name ?? "Sin asignar"}</td>
                <td>{task.progress}%</td>
                <td>{task.attachments.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
