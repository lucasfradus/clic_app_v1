export interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  alumnoId: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface Sede {
  id: number;
  nombre: string;
  esBase?: boolean;
  direccion?: string;
  telefono?: string | null;
  toleranciaCancelacion?: number;
  antelacionReservaMinutos?: number;
}

export type SexoValue = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export type EstadoSuscripcionActiva =
  | 'ACTIVA'
  | 'VENCIDA'
  | 'CANCELADA'
  | 'EN_TOLERANCIA'
  | 'PAUSADA'
  | 'PENDIENTE_PAGO';

export interface SuscripcionActiva {
  plan: string;
  estado: EstadoSuscripcionActiva;
  fechaPago: string | null;
  vigenciaHasta: string | null;
}

export interface UltimoPago {
  id: number;
  fechaPago: string;
  plan: string;
  sedeId: number;
  vigenciaHasta: string | null;
  estado: 'ACREDITADO' | 'PAGADO';
  monto: number;
}

export interface Perfil {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  dni: string | null;
  sexo: SexoValue | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  fechaRegistro: string;
  /** Foto de perfil. URL (/api/storage/...) o data URI; null si no cargó ninguna. Ausente en backends viejos. */
  fotoUrl?: string | null;
  consentimientoFirmado: boolean;
  consentimientoVersion: string | null;
  /** La sede del alumno tiene consentimiento asignado. Ausente en backends viejos. */
  consentimientoRequerido?: boolean;
  politicasFirmado?: boolean;
  politicasVersion?: string | null;
  autorizacionMenoresRequerido?: boolean;
  autorizacionMenoresFirmado?: boolean;
  autorizacionMenoresVersion?: string | null;
  autorizacionMenoresEstado?: AutorizacionMenoresEstado | null;
  autorizacionMenoresMotivoRechazo?: string | null;
  sede: { id: number; nombre: string };
  suscripcionActiva: SuscripcionActiva | null;
  ultimosPagos: UltimoPago[];
}

export type SuscripcionModalidad = 'HORARIO_FIJO' | 'PACK';
export type SuscripcionEstado =
  | 'ACTIVA'
  | 'PAUSADA'
  | 'VENCIDA'
  | 'CANCELADA'
  | 'CAMBIO_PLAN';

export interface SuscripcionGrupo {
  id: number;
  nombre: string;
  accesos: number;
  accesosUsados: number;
  accesosExtra: number;
}

export interface Suscripcion {
  id: number;
  plan: string;
  modalidad: SuscripcionModalidad;
  sedeId: number;
  accesoMultisede: boolean;
  estado: SuscripcionEstado;
  inicio: string;
  fin: string;
  accesos: number;
  accesosUsados: number;
  accesosExtra: number;
  cancelaciones: number;
  cancelacionesUsadas: number;
  grupos?: SuscripcionGrupo[];
}

export type MotivoNoDisponible =
  | 'FUERA_DE_VENTANA'
  | 'LLENO'
  | 'YA_RESERVADA'
  | 'SIN_ACCESOS'
  | 'YA_COMENZO'
  | null;

export interface Clase {
  id: number;
  actividad: string;
  color: string;
  sede: { id: number; nombre: string };
  salon: { id: number; nombre: string } | null;
  instructor: string | null;
  inicio: string;
  fin: string;
  cupo: number;
  reservas: number;
  disponible: boolean;
  yaReservada: boolean;
  motivoNoDisponible?: MotivoNoDisponible;
}

// Disponibilidad del control de acceso (molinete) para una sede.
// `disponible` = la sede tiene molinete propio activo, o figura permitida en el
// molinete de una sede anfitriona activa. `sedeMolineteId` puede diferir del id
// de la sede (acceso físico compartido). No inferir de `esHome` ni del plan.
export interface ControlAcceso {
  disponible: boolean;
  sedeMolineteId: number | null;
}

export interface SedeAccesible {
  id: number;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  whatsappUrl: string | null;
  toleranciaCancelacionHoras: number;
  antelacionReservaMinutos: number;
  esHome: boolean;
  // Ausente en backends viejos → tratar como no disponible.
  controlAcceso?: ControlAcceso;
}

export interface SalonActividad {
  id: number;
  nombre: string;
  color: string | null;
}

export interface Salon {
  id: number;
  nombre: string;
  actividades: SalonActividad[];
}

export type ReservaEstado =
  | 'CONFIRMADA'
  | 'CANCELADA_ALUMNO'
  | 'CANCELADA_SEDE'
  | 'AUSENTE'
  | 'ASISTIO';

// Discrimina una reserva normal de una entrada en lista de espera.
export type TurnoTipo = 'RESERVA' | 'LISTA_ESPERA';

// Item plano de GET /turnos. `tipo` discrimina reserva de lista de espera y
// `claseId` viene siempre. `reservaId`/`estado` solo aplican a RESERVA;
// `posicion` solo a LISTA_ESPERA (necesaria para mostrar el puesto).
export interface Turno {
  tipo: TurnoTipo;
  claseId: number;
  reservaId?: number;
  estado?: ReservaEstado;
  posicion?: number;
  actividad: string;
  color: string;
  sede: { id: number; nombre: string };
  instructor: string | null;
  inicio: string;
  fin: string;
  cupo: number;
}

// Resultado normalizado de POST /reservas. Si la clase estaba llena, el alumno
// queda en lista de espera (enListaEspera === true) y `posicion` indica el puesto.
export interface ReservaResult {
  enListaEspera: boolean;
  posicion?: number;
  yaEstaba?: boolean;
  reservaId?: number;
  message?: string;
}

// GET /consentimiento/texto
export type ConsentimientoTexto =
  | { requerido: false }
  | { requerido: true; id: number; version: string; titulo: string; texto: string };

// GET /consentimiento/firmado
export type ConsentimientoFirmado =
  | { requerido: false; firmado: false }
  | { requerido: true; firmado: false; versionRequerida: string }
  | { requerido: true; firmado: true; fecha: string; version: string; firma: string; ip: string };

// POST /consentimiento sub-objects
export interface ContactoEmergencia {
  nombre1: string; telefono1: string; vinculo1: string; telefonoAlt1: string;
  nombre2: string; telefono2: string; vinculo2: string; telefonoAlt2: string;
}

export interface DatosSalud {
  cardiacas: boolean;
  oseas: boolean;
  tiroides: boolean;
  respiratorias: boolean;
  cirugias: boolean;
  musculares: boolean;
  hipertension: boolean;
  intoleranciaCalor: boolean;
  embarazo: boolean;
  embarazoSemanas: number | null;
  diabetes: boolean;
  mareos: boolean;
  otra: boolean;
  detalle: string;
}

export interface FirmarConsentimientoBody {
  firma: string;
  version: string;
  consentimientoId: number;
  emergencia: ContactoEmergencia;
  salud: DatosSalud;
}

// Autorización de menores. NO bloquea nada: es autogestión + registro.
// null = nunca enviada · PENDIENTE = esperando revisión de recepción ·
// APROBADA · RECHAZADA (el tutor puede reenviarla).
export type AutorizacionMenoresEstado = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export type TutorRelacion = 'PADRE' | 'MADRE' | 'TUTOR';

// GET /autorizacion-menores/texto (sin auth)
export interface AutorizacionMenoresTexto {
  version: string;
  titulo: string;
  texto: string;
}

// GET /autorizacion-menores/firmado — siempre responde 200
export interface AutorizacionMenoresFirmado {
  requerido: boolean;
  firmado: boolean;
  estado: AutorizacionMenoresEstado | null;
  motivoRechazo: string | null;
  fecha?: string | null;
  version?: string | null;
  firma?: string | null;
  documentoUrl?: string | null;
  ip?: string | null;
  tutor?: {
    nombre: string;
    apellido: string;
    dni: string;
    contacto: string;
    relacion: TutorRelacion;
  } | null;
}

// POST /autorizacion-menores — documento = foto del DNI del tutor (data URI)
export interface EnviarAutorizacionMenoresBody {
  firma: string;
  documento: string;
  version: string;
  tutorNombre: string;
  tutorApellido: string;
  tutorDni: string;
  tutorContacto: string;
  tutorRelacion: TutorRelacion;
}

export interface Novedad {
  id: number;
  titulo: string;
  contenido: string;
  imagenUrl: string | null;
  publicadaEn: string;
  vigenciaHasta: string | null;
}

export interface PoliticasTexto {
  version: string;
  titulo: string;
  texto: string;
}
