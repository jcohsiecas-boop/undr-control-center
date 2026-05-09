# UNDR Control Center

Plataforma SaaS administrativa para THE BASS THE RHYTHM & THE KICK S.A.S bajo la marca UNDR. Incluye dashboard ejecutivo, checklist empresarial, Kanban, tabla filtrable, comentarios, evidencias, finanzas, eventos, socios, inventario, NextAuth, Prisma y PostgreSQL preparado para Supabase/Vercel.

## Stack

- Next.js 15 App Router, React, TypeScript
- TailwindCSS, componentes estilo ShadCN UI, Framer Motion, Lucide Icons
- NextAuth Credentials con JWT
- Prisma ORM
- PostgreSQL compatible con Supabase
- Recharts para visualizaciones

## Desarrollo local

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Usuario demo creado por el seed:

```txt
admin@undr.co
UNDR2026!
```

## Variables de entorno

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public&pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public"
NEXTAUTH_SECRET="replace-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://tu-dominio.vercel.app"
```

`DATABASE_URL` se usa para runtime y Vercel. `DIRECT_URL` se usa por Prisma Migrate para conexiones directas.

## Despliegue paso a paso

### PASO 1: Crear proyecto en Supabase

Entra a [Supabase](https://supabase.com), crea un proyecto nuevo, elige la region y guarda la contraseña de base de datos.

### PASO 2: Copiar DATABASE_URL

En Supabase abre Project Settings > Database > Connection string. Usa la cadena PostgreSQL para Prisma. Configura:

- `DATABASE_URL` con pooling/pgbouncer y `connection_limit=1`
- `DIRECT_URL` con conexion directa

### PASO 3: Crear repositorio GitHub

Crea un repositorio nuevo, por ejemplo `undr-control-center`.

### PASO 4: Subir proyecto

```bash
git init
git add .
git commit -m "Initial UNDR Control Center"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/undr-control-center.git
git push -u origin main
```

### PASO 5: Conectar GitHub con Vercel

En [Vercel](https://vercel.com), importa el repositorio desde GitHub. Framework preset: Next.js.

### PASO 6: Agregar variables de entorno

En Vercel > Project Settings > Environment Variables agrega:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Genera `NEXTAUTH_SECRET` con:

```bash
openssl rand -base64 32
```

En produccion, `NEXTAUTH_URL` debe ser la URL final de Vercel.

### PASO 7: Ejecutar Prisma migrations

Desde tu maquina o desde CI:

```bash
npm install
npm run prisma:deploy
npm run prisma:seed
```

Para crear nuevas migraciones durante desarrollo:

```bash
npm run prisma:migrate
```

### PASO 8: Deploy produccion

Haz push a `main`. Vercel ejecutara:

```bash
npm run build
```

El script de build ejecuta `prisma generate` antes de compilar Next.js.

## Modulos incluidos

- Dashboard ejecutivo con progreso, actividad reciente, tareas criticas y metricas.
- Checklist con estados Pendiente, En proceso, Bloqueado y Completado.
- Kanban drag and drop con persistencia via API.
- Tabla con busqueda, filtros y edicion rapida de estado.
- Comentarios, evidencias y activity logs por tarea.
- Dashboard financiero con ingresos, gastos, utilidad real, utilidad proyectada y flujo mensual.
- Eventos con EVENT_ID, presupuesto, ingresos, gastos, sponsors, utilidad, ROI y asistentes.
- Socios con activos/pasivos, aportes, retiros, prestamos y participacion.
- Inventario por audio, luces, branding, tecnologia y produccion.

## Comandos utiles

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
```
# undr-control-center
# undr-control-center
# undr-control-center
# undr-control-center
