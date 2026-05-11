import fs from "node:fs";
import path from "node:path";
import { PrismaClient, Priority } from "@prisma/client";

function loadEnvFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const prisma = new PrismaClient();

const phases = [
  { name: "FASE 1 - Estructura financiera y operativa", description: "Base bancaria, eventos, ingresos, gastos, caja, facturacion, socios e inventario.", order: 10 },
  { name: "FASE 2 - Estructura gerencial", description: "Dashboard, KPIs, control administrativo y control legal.", order: 20 },
  { name: "FASE 3 - Automatizacion", description: "Automatizacion fiscal e integraciones de ventas y conciliacion.", order: 30 },
  { name: "FASE 4 - Escalamiento", description: "Preparacion para inversion, profesionalizacion y auditoria interna.", order: 40 }
];

type Ticket = {
  number: number;
  phase: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
};

const tickets: Ticket[] = [
  {
    number: 1,
    phase: phases[0].name,
    title: "Estructura bancaria",
    description: "Crear y documentar cuentas: Cuenta Operativa, Cuenta Eventos, Cuenta Impuestos y Cuenta Reserva/Reinversion.",
    priority: Priority.CRITICAL,
    tags: ["bancos", "finanzas", "fase-1"]
  },
  {
    number: 2,
    phase: phases[0].name,
    title: "Control de eventos",
    description: "Definir EVENT_ID, plantilla oficial de presupuesto, plantilla de cierre financiero, responsable financiero por evento y flujo de aprobacion de gastos.",
    priority: Priority.CRITICAL,
    tags: ["eventos", "presupuesto", "fase-1"]
  },
  {
    number: 3,
    phase: phases[0].name,
    title: "Registro de ingresos",
    description: "Separar ingresos por tipo: Entradas, Sponsors, Barra, Merch, VIP, Food court, Transferencias, POS, Bitcoin y EasyPass.",
    priority: Priority.HIGH,
    tags: ["ingresos", "finanzas", "fase-1"]
  },
  {
    number: 4,
    phase: phases[0].name,
    title: "Registro de gastos",
    description: "Separar gastos por tipo: DJs, Venue, Staff, Produccion, Marketing, Seguridad, Transporte, Hospitality e Imprevistos.",
    priority: Priority.HIGH,
    tags: ["gastos", "finanzas", "fase-1"]
  },
  {
    number: 5,
    phase: phases[0].name,
    title: "Control de efectivo",
    description: "Crear caja inicial por evento, corte de caja, registro de efectivo, evidencia fotografica, responsable de caja y arqueo final.",
    priority: Priority.CRITICAL,
    tags: ["caja", "eventos", "fase-1"]
  },
  {
    number: 6,
    phase: phases[0].name,
    title: "Facturacion",
    description: "Definir politica: que se factura, que entra como consumidor final, factura global diaria, sponsors con credito fiscal, control IVA y control de retenciones.",
    priority: Priority.CRITICAL,
    tags: ["facturacion", "impuestos", "fase-1"]
  },
  {
    number: 7,
    phase: phases[0].name,
    title: "Socios",
    description: "Formalizar roles, participacion, socio activo, socio pasivo, firma autorizada, politica de retiros, politica de reinversion y politica de utilidades.",
    priority: Priority.HIGH,
    tags: ["socios", "gobierno", "fase-1"]
  },
  {
    number: 8,
    phase: phases[0].name,
    title: "Inventario oficial",
    description: "Crear inventario oficial para Audio, Luces, Branding, Produccion, Tecnologia y Oficina. Cada activo debe tener codigo, valor, estado, responsable y ubicacion.",
    priority: Priority.HIGH,
    tags: ["inventario", "activos", "fase-1"]
  },
  {
    number: 9,
    phase: phases[1].name,
    title: "Dashboard financiero",
    description: "Visualizar utilidad por evento, ROI, ticket promedio, gasto promedio, sponsors activos, flujo mensual, costos fijos y costos variables.",
    priority: Priority.HIGH,
    tags: ["dashboard", "kpi", "fase-2"]
  },
  {
    number: 10,
    phase: phases[1].name,
    title: "KPI de eventos",
    description: "Medir aforo real, conversion de ventas, costo por asistente, rentabilidad sponsor, retorno marketing y punto de equilibrio.",
    priority: Priority.HIGH,
    tags: ["eventos", "kpi", "fase-2"]
  },
  {
    number: 11,
    phase: phases[1].name,
    title: "Control administrativo",
    description: "Crear flujo de aprobaciones, registro de pagos, registro de prestamos, registro de deudas, calendario fiscal y calendario operativo.",
    priority: Priority.HIGH,
    tags: ["administracion", "aprobaciones", "fase-2"]
  },
  {
    number: 12,
    phase: phases[1].name,
    title: "Control legal",
    description: "Organizar contratos DJs, contratos sponsors, contratos venues, acuerdos socios, marca UNDR y documentos fiscales.",
    priority: Priority.HIGH,
    tags: ["legal", "contratos", "fase-2"]
  },
  {
    number: 14,
    phase: phases[2].name,
    title: "Automatizacion Hacienda",
    description: "Preparar facturacion automatica, reportes IVA y exportacion contable.",
    priority: Priority.MEDIUM,
    tags: ["automatizacion", "hacienda", "fase-3"]
  },
  {
    number: 15,
    phase: phases[2].name,
    title: "Integracion EasyPass",
    description: "Integrar ventas automaticas, check-in, reportes y conciliacion de pagos.",
    priority: Priority.MEDIUM,
    tags: ["easypass", "integracion", "fase-3"]
  },
  {
    number: 16,
    phase: phases[3].name,
    title: "Estructura para inversion",
    description: "Preparar estados financieros, reportes trimestrales, rentabilidad historica, proyeccion anual, estructura accionaria y cap table.",
    priority: Priority.MEDIUM,
    tags: ["inversion", "reporting", "fase-4"]
  },
  {
    number: 17,
    phase: phases[3].name,
    title: "Profesionalizacion",
    description: "Crear manual operativo, manual financiero, manual eventos, politica de compras, politica de caja y politica sponsors.",
    priority: Priority.MEDIUM,
    tags: ["manuales", "procesos", "fase-4"]
  },
  {
    number: 18,
    phase: phases[3].name,
    title: "Auditoria interna",
    description: "Validar caja, inventario, gastos, socios e impuestos.",
    priority: Priority.HIGH,
    tags: ["auditoria", "control", "fase-4"]
  }
];

async function main() {
  const admin = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  const phaseMap = new Map<string, string>();

  for (const phase of phases) {
    const saved = await prisma.phase.upsert({
      where: { name: phase.name },
      update: { description: phase.description, order: phase.order },
      create: phase
    });
    phaseMap.set(saved.name, saved.id);
  }

  let created = 0;
  let updated = 0;

  for (const ticket of tickets) {
    const phaseId = phaseMap.get(ticket.phase);
    if (!phaseId) throw new Error(`Missing phase: ${ticket.phase}`);
    const title = `${ticket.number}. ${ticket.title}`;
    const existing = await prisma.task.findFirst({ where: { title, phaseId } });
    const data = {
      title,
      description: ticket.description,
      priority: ticket.priority,
      tags: ticket.tags,
      phaseId,
      assigneeId: admin?.id ?? null,
      archived: false
    };

    if (existing) {
      await prisma.task.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.task.create({ data });
      created += 1;
    }
  }

  console.log(`Operational tickets synced. Created: ${created}. Updated: ${updated}. Total: ${tickets.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
