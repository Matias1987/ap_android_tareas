# OpDelSolEmpleados

Aplicación Android en React Native + Expo con API Node.js/Express, TypeScript, Prisma y MySQL.

## Qué incluye

- App móvil de demostración con panel de tareas, filtros, búsqueda, calendario mensual, detalle y marcado de tareas como terminadas.
- Selector de rol visual para revisar los dos tipos de experiencia. Los datos de esta app móvil son locales y de demostración.
- API con inicio de sesión JWT, administración de usuarios, asignación de tareas a múltiples personas, cancelación, historial y cierre directo de tareas.
- El estado vencida se deriva de la fecha límite para tareas pendientes o en progreso; no requiere un proceso programado.

## Ejecutar la app

Requiere Node.js LTS, npm y Expo Go o un emulador Android.

```sh
npm install
npx expo start
```

En Expo Go, escanea el QR. Para abrir en emulador Android, pulsa `a` en la terminal o ejecuta `npm run android`.

## Ejecutar la API

1. Crea una base de datos MySQL y copia `server/.env.example` a `server/.env`.
2. Completa `DATABASE_URL` y define un `JWT_SECRET` aleatorio y privado.
3. Desde `server/` ejecuta:

```sh
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

La API escucha en el puerto 3000. Rutas principales: `POST /auth/login`, `GET/POST /tasks`, `PATCH/DELETE /tasks/:id`, `GET/POST /users`, `PATCH /users/:id` y `GET /activity`. Protege el despliegue con HTTPS y configura variables de entorno en el proveedor cloud. El primer usuario administrador debe crearse mediante un proceso de alta seguro en el despliegue (no se incluye una contraseña predeterminada).

## Próximo paso para producción

La interfaz aún usa datos locales; hace falta conectarla a la URL cloud de la API, persistir la sesión de forma segura y completar formularios de edición/asignación de tarea y gestión de usuarios. Las notificaciones push requieren configurar Expo Notifications y credenciales de proyecto. El calendario mostrado es una vista mensual navegable de presentación; las fechas se conectarán a los vencimientos reales desde la API.
