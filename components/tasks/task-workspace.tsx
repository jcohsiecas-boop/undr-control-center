"use client";

import { useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { Archive, ChevronDown, MessageSquare, Plus, Search, Trash2 } from "lucide-react";
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
  responsiblePartner: { id: string; name: string } | null;
  comments: { id: string; body: string; createdAt: string; user: { name: string | null } }[];
  attachments: { id: string; name: string; url: string; type: string }[];
  archived: boolean;
  archivedAt: string | null;
};

type Phase = { id: string; name: string };
type Partner = { id: string; name: string };

const statusLabels = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  BLOCKED: "Bloqueado",
  COMPLETED: "Completado"
};

export function TaskWorkspace({ initialTasks, phases, partners }: { initialTasks: Task[]; phases: Phase[]; partners: Partner[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [archiveView, setArchiveView] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [draft, setDraft] = useState({ title: "", description: "", phaseId: phases[0]?.id ?? "", priority: "MEDIUM" });
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        const text = `${task.title} ${task.description} ${task.tags.join(" ")}`.toLowerCase();
        return task.archived === archiveView && text.includes(query.toLowerCase()) && (status === "ALL" || task.status === status) && (priority === "ALL" || task.priority === priority);
      }),
    [tasks, query, status, priority, archiveView]
  );

  async function updateStatus(taskId: string, nextStatus: Task["status"]) {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: nextStatus, progress: nextStatus === "COMPLETED" ? 100 : task.progress } : task)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, progress: nextStatus === "COMPLETED" ? 100 : undefined })
    });
  }

  async function updateProgress(taskId: string, progress: number) {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, progress } : task)));
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress })
    });
  }

  async function updateTask(taskId: string, patch: Partial<Task> & { responsiblePartnerId?: string | null }) {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const updated = await response.json();
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, ...updated } : task)));
  }

  async function addComment(taskId: string) {
    const body = comments[taskId]?.trim();
    if (!body) return;
    const response = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    });
    const comment = await response.json();
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, comments: [comment, ...task.comments] } : task)));
    setComments((current) => ({ ...current, [taskId]: "" }));
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  async function archiveTask(taskId: string) {
    await updateTask(taskId, { archived: true });
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
          <Button variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}>Kanban</Button>
          <Button variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>Tabla</Button>
          <Button variant={archiveView ? "default" : "outline"} onClick={() => setArchiveView((value) => !value)}><Archive className="h-4 w-4" /> Archivadas</Button>
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
          <Button variant="secondary">{filtered.length}</Button>
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

      {view === "kanban" ? <Kanban tasks={filtered} partners={partners} onDragEnd={onDragEnd} updateProgress={updateProgress} updateTask={updateTask} deleteTask={deleteTask} archiveTask={archiveTask} comments={comments} setComments={setComments} expanded={expanded} setExpanded={setExpanded} addComment={addComment} /> : <TaskTable tasks={filtered} partners={partners} updateStatus={updateStatus} updateProgress={updateProgress} updateTask={updateTask} deleteTask={deleteTask} archiveTask={archiveTask} />}
    </div>
  );
}

function Kanban({
  tasks,
  partners,
  onDragEnd,
  updateProgress,
  updateTask,
  deleteTask,
  archiveTask,
  comments,
  setComments,
  expanded,
  setExpanded,
  addComment
}: {
  tasks: Task[];
  partners: Partner[];
  onDragEnd: (result: DropResult) => void;
  updateProgress: (id: string, progress: number) => void;
  updateTask: (id: string, patch: Partial<Task> & { responsiblePartnerId?: string | null }) => void;
  deleteTask: (id: string) => void;
  archiveTask: (id: string) => void;
  comments: Record<string, string>;
  setComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  addComment: (id: string) => void;
}) {
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
                        <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}>
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border border-border bg-background/70 p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{task.title}</p>
                            <Select className="h-8 w-32 shrink-0" value={task.priority} onChange={(event) => updateTask(task.id, { priority: event.target.value as Task["priority"] })}>
                              <option value="LOW">Baja</option>
                              <option value="MEDIUM">Media</option>
                              <option value="HIGH">Alta</option>
                              <option value="CRITICAL">Critica</option>
                            </Select>
                          </div>
                          <Select className="mt-2 h-9 w-full min-w-0 text-xs" value={task.responsiblePartner?.id ?? ""} onChange={(event) => updateTask(task.id, { responsiblePartnerId: event.target.value || null })}>
                            <option value="">Sin responsable</option>
                            {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
                          </Select>
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                          <label className="mt-3 block text-xs text-muted-foreground">Avance {task.progress}%</label>
                          <input className="mt-1 w-full accent-red-600" type="range" min="0" max="100" value={task.progress} onChange={(event) => updateProgress(task.id, Number(event.target.value))} />
                          <div className="mt-3 flex flex-wrap gap-1">{task.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
                          <div className="mt-3 rounded-md border border-border bg-card/50 p-2">
                            <button className="mb-2 flex w-full items-center justify-between gap-2 text-xs text-muted-foreground" onClick={() => setExpanded((current) => ({ ...current, [task.id]: !current[task.id] }))}>
                              <span className="flex items-center gap-2"><MessageSquare className="h-3 w-3" /> {task.comments.length} comentarios</span>
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            {expanded[task.id] && <div className="mb-2 max-h-36 space-y-2 overflow-y-auto rounded-md bg-background/60 p-2">{task.comments.length ? task.comments.map((comment) => <div key={comment.id} className="border-b border-border pb-2 last:border-0 last:pb-0"><p className="text-xs text-foreground">{comment.body}</p><p className="mt-1 text-[10px] text-muted-foreground">{comment.user?.name ?? "Usuario"} · {new Date(comment.createdAt).toLocaleString("es-CO")}</p></div>) : <p className="text-xs text-muted-foreground">Sin comentarios.</p>}</div>}
                            <Input value={comments[task.id] ?? ""} onChange={(event) => setComments((current) => ({ ...current, [task.id]: event.target.value }))} placeholder="Agregar comentario" />
                            <Button className="mt-2 w-full" size="sm" variant="secondary" onClick={() => addComment(task.id)}>Comentar</Button>
                          </div>
                          {!task.archived && <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={() => archiveTask(task.id)}><Archive className="h-4 w-4" /> Archivar</Button>}
                          <Button className="mt-3 w-full" size="sm" variant="outline" onClick={() => deleteTask(task.id)}><Trash2 className="h-4 w-4" /> Eliminar</Button>
                          </motion.div>
                        </div>
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

function TaskTable({ tasks, partners, updateStatus, updateProgress, updateTask, deleteTask, archiveTask }: { tasks: Task[]; partners: Partner[]; updateStatus: (id: string, status: Task["status"]) => void; updateProgress: (id: string, progress: number) => void; updateTask: (id: string, patch: Partial<Task> & { responsiblePartnerId?: string | null }) => void; deleteTask: (id: string) => void; archiveTask: (id: string) => void }) {
  return (
    <Card className="overflow-hidden bg-card/75 backdrop-blur">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Tarea</th><th>Fase</th><th>Prioridad</th><th>Estado</th><th>Responsable</th><th>Avance</th><th>Comentarios</th><th></th></tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-t border-border">
                <td className="p-3"><div className="font-medium">{task.title}</div><div className="text-xs text-muted-foreground">{task.description}</div></td>
                <td>{task.phase.name}</td>
                <td><Select value={task.priority} onChange={(e) => updateTask(task.id, { priority: e.target.value as Task["priority"] })}><option value="LOW">Baja</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option><option value="CRITICAL">Critica</option></Select></td>
                <td><Select value={task.status} onChange={(e) => updateStatus(task.id, e.target.value as Task["status"])}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></td>
                <td><Select value={task.responsiblePartner?.id ?? ""} onChange={(e) => updateTask(task.id, { responsiblePartnerId: e.target.value || null })}><option value="">Sin responsable</option>{partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</Select></td>
                <td><Input type="number" min={0} max={100} value={task.progress} onChange={(e) => updateProgress(task.id, Number(e.target.value))} /></td>
                <td>{task.comments.length}</td>
                <td className="flex gap-2 py-3">{!task.archived && <Button size="sm" variant="secondary" onClick={() => archiveTask(task.id)}><Archive className="h-4 w-4" /></Button>}<Button size="sm" variant="outline" onClick={() => deleteTask(task.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
