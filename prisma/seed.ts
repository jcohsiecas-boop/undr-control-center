import { PrismaClient, Priority, TaskStatus, FinancialType, PartnerType, InventoryCategory, InventoryStatus, AttachmentType, TaxType, InvoiceStatus, EventLineType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("UNDR2026!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@undr.co" },
    update: {},
    create: {
      name: "UNDR Admin",
      email: "admin@undr.co",
      passwordHash,
      role: "SUPER_ADMIN"
    }
  });

  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.eventLineItem.deleteMany();
  await prisma.eventFinance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.movementPayment.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.financialCategory.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.inventory.deleteMany();

  const phases = await Promise.all(
    [
      ["Fundacion y Gobierno", "Estructura legal, socios, obligaciones y trazabilidad."],
      ["Operacion", "Procesos, eventos, proveedores, checklist ejecutivo."],
      ["Finanzas", "Caja, costos, utilidad, presupuestos y auditoria."],
      ["Escalabilidad", "Preparacion para crecimiento, inversion y reporting."]
    ].map(([name, description], order) =>
      prisma.phase.upsert({
        where: { name },
        update: { description, order },
        create: { name, description, order }
      })
    )
  );

  await prisma.partner.createMany({
    data: [
      { name: "Socio Operador", type: PartnerType.ACTIVE, contribution: 65000000, withdrawals: 12000000, loans: 0, participation: 42 },
      { name: "Socio Capital", type: PartnerType.PASSIVE, contribution: 90000000, withdrawals: 0, loans: 18000000, participation: 38 },
      { name: "Socio Creativo", type: PartnerType.ACTIVE, contribution: 25000000, withdrawals: 6000000, loans: 0, participation: 20 }
    ]
  });
  const partners = await prisma.partner.findMany({ orderBy: { name: "asc" } });

  const taskPayload = [
    ["Centralizar actas societarias", "Digitalizar actas, estatutos, RUT, camara de comercio y contratos clave.", TaskStatus.IN_PROGRESS, Priority.CRITICAL, 65, phases[0].id, ["legal", "auditoria"]],
    ["Implementar control de caja semanal", "Registrar ingresos, egresos y conciliaciones con evidencia por semana.", TaskStatus.IN_PROGRESS, Priority.HIGH, 55, phases[2].id, ["caja", "finanzas"]],
    ["Cerrar presupuesto evento Q2", "Validar presupuesto base, sponsors, costos de produccion y punto de equilibrio.", TaskStatus.BLOCKED, Priority.CRITICAL, 35, phases[1].id, ["evento", "roi"]],
    ["Inventario tecnico completo", "Codificar activos de audio, luces, tecnologia, branding y produccion.", TaskStatus.PENDING, Priority.HIGH, 20, phases[1].id, ["inventario"]],
    ["Dashboard mensual para socios", "Crear reporte con utilidad, deuda, participacion, KPIs y riesgos.", TaskStatus.COMPLETED, Priority.MEDIUM, 100, phases[3].id, ["socios", "reporting"]],
    ["Politica de aprobacion de gastos", "Definir responsables, limites, evidencias y flujo de aprobacion.", TaskStatus.PENDING, Priority.HIGH, 10, phases[2].id, ["gastos", "control"]]
  ] as const;

  for (const [title, description, status, priority, progress, phaseId, tags] of taskPayload) {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        progress,
        phaseId,
        assigneeId: admin.id,
        responsiblePartnerId: partners[0]?.id,
        tags: [...tags],
        completedAt: status === TaskStatus.COMPLETED ? new Date() : null
      }
    });
    await prisma.comment.create({
      data: {
        body: `Seguimiento inicial creado para ${title}.`,
        taskId: task.id,
        userId: admin.id
      }
    });
    await prisma.attachment.create({
      data: {
        name: "Carpeta de evidencia",
        url: "https://drive.google.com/",
        type: AttachmentType.LINK,
        taskId: task.id,
        userId: admin.id
      }
    });
    await prisma.activityLog.create({
      data: {
        action: "TASK_CREATED",
        taskId: task.id,
        userId: admin.id,
        metadata: { status, priority, progress }
      }
    });
  }

  const mainAccount = await prisma.bankAccount.create({
    data: { name: "Caja principal UNDR", bank: "Bancolombia", accountNo: "000-000", balance: 0 }
  });

  const records = [
    [FinancialType.INCOME, "Tickets", "Venta anticipada eventos", 168000000, "2026-01-01", false],
    [FinancialType.INCOME, "Sponsors", "Patrocinios confirmados", 72000000, "2026-01-01", false],
    [FinancialType.EXPENSE, "Produccion", "Audio, luces, venue y staff", 98000000, "2026-01-01", false],
    [FinancialType.EXPENSE, "Operacion", "Software, contabilidad, administracion", 24500000, "2026-01-01", false],
    [FinancialType.INCOME, "Proyeccion", "Pipeline comercial Q2", 210000000, "2026-02-01", true],
    [FinancialType.EXPENSE, "Proyeccion", "Costos proyectados Q2", 130000000, "2026-02-01", true]
  ] as const;
  await prisma.financialCategory.createMany({
    data: [
      { name: "Tickets", type: FinancialType.INCOME },
      { name: "Sponsors", type: FinancialType.INCOME },
      { name: "Venta barra", type: FinancialType.INCOME },
      { name: "Produccion", type: FinancialType.EXPENSE },
      { name: "Operacion", type: FinancialType.EXPENSE },
      { name: "Personal", type: FinancialType.EXPENSE }
    ],
    skipDuplicates: true
  });
  for (const [type, category, description, amount, month, projected] of records) {
    const paid = projected ? 0 : amount;
    await prisma.financialRecord.create({
      data: {
        type,
        category,
        description,
        amount,
        month: new Date(month),
        projected,
        documentStatus: projected ? "PROJECTED" : type === FinancialType.INCOME ? "COLLECTED" : "PAID",
        paymentStatus: projected ? "PENDING" : "SETTLED",
        paidAmount: paid,
        pendingBalance: amount - paid,
        dueDate: new Date("2026-03-15"),
        responsible: type === FinancialType.INCOME ? "Comercial" : "Operaciones",
        invoiceStatus: projected ? InvoiceStatus.RECEIVABLE : InvoiceStatus.PAID,
        taxType: type === FinancialType.INCOME ? TaxType.IVA : TaxType.NONE,
        bankAccountId: projected ? null : mainAccount.id
      }
    });
  }
  await prisma.bankAccount.update({
    where: { id: mainAccount.id },
    data: { balance: 168000000 + 72000000 - 98000000 - 24500000 }
  });

  const event = await prisma.event.create({
    data: {
      eventId: "UNDR-2026-Q2-001",
      slug: "undr-warehouse-session",
      name: "UNDR Warehouse Session",
      date: new Date("2026-06-20"),
      budget: 145000000,
      status: "PLANNING",
      sponsors: ["Redline Energy", "Nocturne Audio"],
      attendees: 1800
    }
  });
  await prisma.eventFinance.create({
    data: { eventId: event.id, income: 238000000, expenses: 151000000, utility: 87000000, roi: 57.62 }
  });
  await prisma.eventLineItem.createMany({
    data: [
      { eventId: event.id, type: EventLineType.EXPENSE, concept: "Alquiler de local", quantity: 1, unitCost: 14500000, projected: 14500000, actual: 14500000, paid: true, financialStatus: "SETTLED", actionedById: admin.id, actionedAt: new Date(), responsible: "Operacion" },
      { eventId: event.id, type: EventLineType.PERSONNEL, concept: "DJs y staff", quantity: 8, unitCost: 1200000, projected: 9600000, actual: 11200000, paid: true, financialStatus: "SETTLED", actionedById: admin.id, actionedAt: new Date(), responsible: "Produccion" },
      { eventId: event.id, type: EventLineType.INCOME, concept: "Venta de entradas", quantity: 1800, unitCost: 85000, projected: 153000000, actual: 166000000, paid: true, financialStatus: "SETTLED", actionedById: admin.id, actionedAt: new Date(), responsible: "Ticketing" },
      { eventId: event.id, type: EventLineType.SPONSOR, concept: "Patrocinios", quantity: 2, unitCost: 36000000, projected: 72000000, actual: 72000000, paid: true, financialStatus: "SETTLED", actionedById: admin.id, actionedAt: new Date(), responsible: "Comercial" }
    ]
  });

  await prisma.inventory.createMany({
    data: [
      { code: "AUD-001", name: "Sistema PA principal", category: InventoryCategory.AUDIO, value: 42000000, status: InventoryStatus.AVAILABLE, location: "Bodega Norte", responsible: "Produccion" },
      { code: "LGT-014", name: "Moving heads pack x8", category: InventoryCategory.LIGHTING, value: 28000000, status: InventoryStatus.IN_USE, location: "Venue aliado", responsible: "Lighting Lead" },
      { code: "BRD-006", name: "Backwall modular UNDR", category: InventoryCategory.BRANDING, value: 9500000, status: InventoryStatus.AVAILABLE, location: "Bodega Norte", responsible: "Brand Manager" },
      { code: "TEC-003", name: "MacBook produccion", category: InventoryCategory.TECHNOLOGY, value: 11500000, status: InventoryStatus.AVAILABLE, location: "Oficina", responsible: "Operaciones" }
    ]
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
