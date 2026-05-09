import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/api";
import { TaskWorkspace } from "@/components/tasks/task-workspace";

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    include: {
      phase: true,
      assignee: true,
      comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
      attachments: true
    },
    orderBy: { updatedAt: "desc" }
  });
  const phases = await prisma.phase.findMany({ orderBy: { order: "asc" } });
  return <TaskWorkspace initialTasks={serialize(tasks)} phases={serialize(phases)} />;
}
