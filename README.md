# Sistema de Garantías - Distribuidor Punto PAS

Aplicación web funcional para registrar, administrar y consultar garantías de clientes de Distribuidor Punto PAS - San Lorenzo.

## Requisitos

- Node.js 20 o superior.
- Cuenta de Google Cloud con Google Sheets API habilitada.
- Service Account con acceso de editor a la hoja de cálculo.
- Hoja de Google Sheets: `1YXCxbjeTIPTmL6t1rw18WuJ0Q2eVmxGjlX_PNULElVE`.

## Instalación

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrir `http://localhost:3000`.

## Variables de entorno

Crear `.env.local` con:

```env
ADMIN_USERNAME=administradorPas
ADMIN_PASSWORD=coloque-la-clave-administrativa
GOOGLE_SHEET_ID=1YXCxbjeTIPTmL6t1rw18WuJ0Q2eVmxGjlX_PNULElVE
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="coloque-la-private-key-del-json-con-saltos-n"
SESSION_SECRET=coloque-un-secreto-largo-de-minimo-32-caracteres
```

Para producción se recomienda usar `ADMIN_PASSWORD_HASH` en lugar de `ADMIN_PASSWORD`. El hash esperado es SHA-256 hexadecimal de la contraseña.

## Configuración de Google Sheets API

1. Entrar a Google Cloud Console.
2. Crear o seleccionar un proyecto.
3. Habilitar `Google Sheets API`.
4. Crear una `Service Account`.
5. Crear una clave JSON para esa cuenta.
6. Copiar `client_email` en `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
7. Copiar `private_key` en `GOOGLE_PRIVATE_KEY`, conservando los saltos `\n`.
8. Compartir la hoja de cálculo con el correo de la Service Account como `Editor`.

## Hojas requeridas

El sistema trabaja con estas pestañas:

- `GARANTIAS`
- `HISTORIAL_ESTADOS`

Si no existen, la aplicación las crea automáticamente con los encabezados requeridos. No elimina ni sobrescribe información existente; cada nueva garantía se agrega como una nueva fila.

## Sucursales

El sistema separa las garantias entre `SAN LORENZO` y `ALMACEN PAS`.
Los registros anteriores sin columna Sucursal pertenecen a San Lorenzo.
La columna `Sucursal` se agrega al final de GARANTIAS sin mover datos existentes.
Los codigos siguen siendo unicos en toda la hoja; el historial permanece asociado a su codigo.

Las cuentas existentes (`ADMIN_USERNAME`, `ADMIN_USERS_JSON`) acceden a San Lorenzo.
`ALMACEN_ADMIN_USERS_JSON` contiene las cuentas de ALMACEN PAS en formato JSON:

```json
[{"username":"nombre-de-usuario","passwordHash":"hash-sha256-hexadecimal"}]
```

El selector en la cabecera cierra la sesion al cambiar de sucursal y solicita un nuevo login.
El backend filtra y autoriza las operaciones por la sucursal de la sesion.
La consulta publica sigue funcionando para ambas sucursales y muestra la sucursal del registro.
Actualizar las variables en Vercel requiere redeployar para que entren en vigor.

## Paginas

## Motos

Modulo independiente en `/admin/motos`, con registro, listado, filtros y detalle editable.
Usa `GOOGLE_MOTOS_SHEET_ID`, diferente del archivo de garantias.
Comparte la hoja de motos con la misma Service Account como Editor y ejecuta `npm run verify:motos`.
Las pestañas `MOTOS` y `HISTORIAL_MOTOS` se crean si faltan; los encabezados existentes no se sobrescriben si son incompatibles.

Cada sucursal ve y modifica solo sus motos. El alta acepta codigo, descripcion, marca y chasis,
asigna DISPONIBLE y fecha de ingreso automaticamente. La venta requiere factura, observaciones y enlace PDF.
La entrega requiere numero de matricula. Se permite retroceder con confirmacion y corregir datos sin borrar el historial.
Registro y movimiento de historial se guardan juntos en una peticion atomica a Sheets.
Las revisiones rechazan ediciones basadas en datos desactualizados; Sheets no es una base transaccional con bloqueo entre escritores simultaneos.

La cedula se ingresa como URL HTTPS, no se sube el archivo. Se admite cualquier formato y enlaces de Drive.
Se valida la URL (maximo 2000 caracteres, sin credenciales), sin consultar Drive API ni descargar archivos.
No se verifica disponibilidad, tipo MIME, contenido ni tamano del archivo externo.
El administrador debe comprobar que el enlace abra, contenga ambas caras y tenga los permisos apropiados.
La columna existente `PDF cedula` se conserva para no romper datos guardados, pero admite enlaces de cualquier formato.
Manten restringidos los documentos de identidad, no los publiques ni los compartas con cualquier persona que tenga el enlace.
No se exponen motos ni documentos en el portal publico.

## Rutas Del Sistema

- `/` redirige al portal público.
- `/consultar` portal público para clientes.
- `/login` acceso administrativo.
- `/admin` dashboard administrativo.
- `/admin/garantias` listado, búsqueda, filtros y exportación.
- `/admin/garantias/nueva` registro de garantía.
- `/admin/garantias/[id]` detalle, historial, cambio de estado y PDF.
- `/admin/garantias/[id]/editar` edición.
- `/admin/reportes` reportes y exportaciones.

## Inicio de sesión

Credenciales iniciales:

- Usuario: configurar `ADMIN_USERNAME` en `.env.local`.
- Contraseña: configurar `ADMIN_PASSWORD` o `ADMIN_PASSWORD_HASH` en `.env.local`.

La contraseña no está escrita en el frontend. La validación ocurre en rutas API del backend y la sesión se guarda en cookie `HttpOnly` firmada con `SESSION_SECRET`.

## Seguridad implementada

- Rutas administrativas protegidas con middleware.
- APIs administrativas protegidas con sesión del servidor.
- Cookie `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- Credenciales de Google solo en variables de entorno del servidor.
- Sanitización básica de entradas.
- Validaciones con Zod.
- Limitación básica de consultas públicas por IP.
- La consulta pública oculta documento completo y no muestra correo, observaciones ni usuarios administrativos.

## Funcionalidades

- Registro de garantías con código automático `GAR-AAAA-000001`.
- Validación de campos obligatorios.
- Advertencia de duplicados por factura + código de producto + número de serie.
- Dashboard con estadísticas.
- Búsqueda por cliente, documento, factura, código de garantía, producto, serie y teléfono.
- Filtros por estado, vendedor, producto y rango de recepción.
- Edición sin modificar el código único.
- Cambio de estado con historial automático.
- Exportación a Excel y PDF de garantías filtradas.
- PDF administrativo detallado por garantía.
- Portal público para consultar por documento o factura.
- PDF público informativo del estado de garantía.
- Diseño responsive para computadora, tablet y celular.

## Despliegue

1. Subir el proyecto a un proveedor compatible con Next.js, por ejemplo Vercel.
2. Configurar todas las variables de entorno en el panel del proveedor.
3. Verificar que `GOOGLE_PRIVATE_KEY` conserve saltos de línea o use `\n`.
4. Compartir la hoja con la Service Account.
5. Ejecutar build y publicar.

## Cambiar usuario o contraseña

Modificar en el entorno de despliegue:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` o `ADMIN_PASSWORD_HASH`

Después reiniciar o redeplegar la aplicación.

## Comandos

```bash
npm run dev
npm run build
npm run start
npm run lint
```
