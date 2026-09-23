"use client";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/app/lib/supabase";
import PromotionsManager from "@/app/components/PromotionsManager";
type Reservation = {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
  staff_id: string | null;
  duration_minutes: number;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type Service = {
  id: string;
  name: string;
  allowed_durations: number[];
};

type Staff = {
  id: string;
  name: string;
  active: boolean;
};

type BlockedTime = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

const TIME_ZONE = "America/Asuncion";

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

const WEEKDAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

type ManualMode = "single" | "package";

function ymdToLocalDate(ymd: string) {
  const [year, month, day] = ymd
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0
  );
}

function localDateToYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function generatePackageDates(
  startDate: string,
  weekdays: number[],
  count: number
) {
  if (
    !startDate ||
    weekdays.length === 0 ||
    count <= 0
  ) {
    return [] as string[];
  }

  const dates: string[] = [];
  const cursor = ymdToLocalDate(
    startDate
  );

  let guard = 0;

  while (
    dates.length < count &&
    guard < 370
  ) {
    if (
      weekdays.includes(
        cursor.getDay()
      )
    ) {
      dates.push(
        localDateToYMD(cursor)
      );
    }

    cursor.setDate(
      cursor.getDate() + 1
    );

    guard++;
  }

  return dates;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  booked: "Reservado",
  confirmed: "Confirmado",
  rescheduled: "Reprogramado",
  cancelled: "Cancelado",
  attended: "Atendido",
  no_show: "No asistió",
};

function todayYMD() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dateYMD(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatHour(value: string) {
  return new Intl.DateTimeFormat("es-PY", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatLongDate(ymd: string) {
  const date = new Date(`${ymd}T12:00:00Z`);

  return new Intl.DateTimeFormat("es-PY", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizeParaguayPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (/^09\d{8}$/.test(digits)) {
    return `+595${digits.slice(1)}`;
  }

  if (/^5959\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  return "";
}

function whatsappPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function statusClasses(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";

    case "attended":
      return "bg-blue-100 text-blue-800";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "no_show":
      return "bg-orange-100 text-orange-800";

    case "rescheduled":
      return "bg-purple-100 text-purple-800";

    default:
      return "bg-[#efe5df] text-[#765648]";
  }
}

type AdminToolProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  dark?: boolean;
};

function AdminTool({
  eyebrow,
  title,
  children,
  dark = false,
}: AdminToolProps) {
  return (
    <details
      className={`group overflow-hidden rounded-3xl shadow-sm ${
        dark
          ? "bg-[#765648] text-white"
          : "bg-white text-[#332a27]"
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
        <div>
          <p
            className={`text-xs uppercase tracking-[0.22em] ${
              dark
                ? "text-white/60"
                : "text-[#9c7968]"
            }`}
          >
            {eyebrow}
          </p>

          <h2 className="mt-1 text-lg font-medium">
            {title}
          </h2>
        </div>

        <span
          className={`rounded-full border px-4 py-2 text-xs font-medium transition group-open:rotate-180 ${
            dark
              ? "border-white/40 text-white"
              : "border-[#765648] text-[#765648]"
          }`}
          aria-hidden="true"
        >
          ↓
        </span>
      </summary>

      <div
        className={`border-t px-6 pb-6 pt-5 ${
          dark
            ? "border-white/20"
            : "border-[#eee4dd]"
        }`}
      >
        {children}
      </div>
    </details>
  );
}

export default function AdminPage() {
  const [checkingSession, setCheckingSession] =
    useState(true);

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loginError, setLoginError] =
    useState("");

  const [loadingLogin, setLoadingLogin] =
    useState(false);

  const [selectedDate, setSelectedDate] =
    useState(todayYMD());

  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [services, setServices] =
    useState<Service[]>([]);

  const [staff, setStaff] =
    useState<Staff[]>([]);

  const [blocks, setBlocks] =
    useState<BlockedTime[]>([]);

  const [loadingAgenda, setLoadingAgenda] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [staffFilter, setStaffFilter] =
    useState("all");

  // TURNO MANUAL
  const [manualName, setManualName] =
    useState("");

  const [manualPhone, setManualPhone] =
    useState("");

  const [manualServiceId, setManualServiceId] =
    useState("");

  const [manualDuration, setManualDuration] =
    useState<number | null>(null);

  const [manualStaffId, setManualStaffId] =
    useState("");

  const [manualDate, setManualDate] =
    useState(todayYMD());

  const [manualTime, setManualTime] =
    useState("");

  const [manualNotes, setManualNotes] =
    useState("");

  const [manualSlots, setManualSlots] =
    useState<string[]>([]);

  const [loadingManualSlots, setLoadingManualSlots] =
    useState(false);

  const [savingManual, setSavingManual] =
    useState(false);


  const [manualMode, setManualMode] =
    useState<ManualMode>("single");

  const [packageCount, setPackageCount] =
    useState(10);

  const [packageDays, setPackageDays] =
    useState<number[]>([1, 3, 5]);
  // REPROGRAMAR
  const [
    reprogramReservation,
    setReprogramReservation,
  ] = useState<Reservation | null>(null);

  const [
    reprogramStaffId,
    setReprogramStaffId,
  ] = useState("");

  const [
    reprogramDate,
    setReprogramDate,
  ] = useState(todayYMD());

  const [
    reprogramTime,
    setReprogramTime,
  ] = useState("");

  const [
    reprogramSlots,
    setReprogramSlots,
  ] = useState<string[]>([]);

  const [
    loadingReprogramSlots,
    setLoadingReprogramSlots,
  ] = useState(false);

  const [
    savingReprogram,
    setSavingReprogram,
  ] = useState(false);

  // BLOQUEOS
  const [blockStart, setBlockStart] =
    useState("12:00");

  const [blockEnd, setBlockEnd] =
    useState("13:00");

  const [blockReason, setBlockReason] =
    useState("");

  const [creatingBlock, setCreatingBlock] =
    useState(false);

  const serviceMap = useMemo(() => {
    return Object.fromEntries(
      services.map((service) => [
        service.id,
        service.name,
      ])
    );
  }, [services]);

  const staffMap = useMemo(() => {
    return Object.fromEntries(
      staff.map((person) => [
        person.id,
        person.name,
      ])
    );
  }, [staff]);

  const manualService = useMemo(
    () =>
      services.find(
        (service) =>
          service.id === manualServiceId
      ),
    [services, manualServiceId]
  );


  const packageDates = useMemo(
    () =>
      generatePackageDates(
        manualDate,
        packageDays,
        packageCount
      ),
    [
      manualDate,
      packageDays,
      packageCount,
    ]
  );

  const reservationsForDate =
    useMemo(() => {
      return reservations
        .filter(
          (reservation) =>
            dateYMD(
              reservation.starts_at
            ) === selectedDate
        )
        .sort(
          (a, b) =>
            new Date(
              a.starts_at
            ).getTime() -
            new Date(
              b.starts_at
            ).getTime()
        );
    }, [reservations, selectedDate]);

  const filteredReservations =
    useMemo(() => {
      if (staffFilter === "all") {
        return reservationsForDate;
      }

      return reservationsForDate.filter(
        (reservation) =>
          reservation.staff_id ===
          staffFilter
      );
    }, [
      reservationsForDate,
      staffFilter,
    ]);

  const visibleStaff =
    staffFilter === "all"
      ? staff
      : staff.filter(
          (person) =>
            person.id === staffFilter
        );

  const activeReservations =
    reservationsForDate.filter(
      (reservation) =>
        reservation.status !==
        "cancelled"
    );

  const confirmedCount =
    reservationsForDate.filter(
      (reservation) =>
        reservation.status ===
        "confirmed"
    ).length;

  const attendedCount =
    reservationsForDate.filter(
      (reservation) =>
        reservation.status ===
        "attended"
    ).length;

  const blocksForDate =
    blocks.filter(
      (block) =>
        dateYMD(block.starts_at) ===
        selectedDate
    );

  const loadAdminData =
    useCallback(async () => {
      setLoadingAgenda(true);

      const [
        reservationsResult,
        servicesResult,
        staffResult,
        blocksResult,
      ] = await Promise.all([
        supabase
          .from("reservations")
          .select(
            `
            id,
            customer_name,
            customer_phone,
            service_id,
            staff_id,
            duration_minutes,
            starts_at,
            ends_at,
            status,
            notes,
            created_at
            `
          )
          .order("starts_at", {
            ascending: true,
          }),

        supabase
          .from("services")
          .select(
            "id, name, allowed_durations"
          )
          .eq("active", true)
          .order("name"),

        supabase
          .from("staff")
          .select(
            "id, name, active"
          )
          .eq("active", true)
          .order("name"),

        supabase
          .from("blocked_times")
          .select(
            "id, starts_at, ends_at, reason"
          )
          .order("starts_at", {
            ascending: true,
          }),
      ]);

      if (reservationsResult.error) {
        console.error(
          reservationsResult.error
        );
      }

      if (servicesResult.error) {
        console.error(
          servicesResult.error
        );
      }

      if (staffResult.error) {
        console.error(
          staffResult.error
        );
      }

      if (blocksResult.error) {
        console.error(
          blocksResult.error
        );
      }

      setReservations(
        (reservationsResult.data ??
          []) as Reservation[]
      );

      setServices(
        (servicesResult.data ??
          []) as Service[]
      );

      setStaff(
        (staffResult.data ??
          []) as Staff[]
      );

      setBlocks(
        (blocksResult.data ??
          []) as BlockedTime[]
      );

      setLoadingAgenda(false);
    }, []);

  // SESIÓN
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session) {
        setLoggedIn(false);
        setCheckingSession(false);
        return;
      }

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "is_admin"
        );

      if (
        error ||
        data !== true
      ) {
        await supabase.auth.signOut();

        setLoggedIn(false);
        setCheckingSession(false);

        return;
      }

      setLoggedIn(true);
      setCheckingSession(false);
    }

    checkSession();
  }, []);

  useEffect(() => {
    if (loggedIn) {
      loadAdminData();
    }
  }, [
    loggedIn,
    loadAdminData,
  ]);

  // HORARIOS TURNO MANUAL
  useEffect(() => {
    async function loadSlots() {
      if (manualMode === "package") {
        setLoadingManualSlots(false);
        setManualSlots(HOURS);

        if (
          manualTime &&
          !HOURS.includes(manualTime)
        ) {
          setManualTime("");
        }

        return;
      }

      if (
        !manualDate ||
        !manualStaffId
      ) {
        setManualSlots([]);
        return;
      }

      setLoadingManualSlots(true);
      setManualTime("");

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "get_available_slots",
          {
            p_date:
              manualDate,

            p_staff_id:
              manualStaffId,
          }
        );

      setLoadingManualSlots(false);

      if (error) {
        console.error(error);

        setManualSlots([]);

        setMessage(
          `No se pudieron cargar los horarios: ${error.message}`
        );

        return;
      }

      setManualSlots(
        (data ?? []).map(
          (
            row: {
              slot_time: string;
            }
          ) =>
            row.slot_time.slice(
              0,
              5
            )
        )
      );
    }

    loadSlots();
  }, [
    manualDate,
    manualStaffId,
    manualMode,
    manualTime,
  ]);

  // HORARIOS REPROGRAMACIÓN
  useEffect(() => {
    async function loadSlots() {
      if (
        !reprogramReservation ||
        !reprogramDate ||
        !reprogramStaffId
      ) {
        setReprogramSlots([]);
        return;
      }

      setLoadingReprogramSlots(true);

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "get_admin_available_slots",
          {
            p_date:
              reprogramDate,

            p_staff_id:
              reprogramStaffId,

            p_reservation_id:
              reprogramReservation.id,
          }
        );

      setLoadingReprogramSlots(false);

      if (error) {
        console.error(error);

        setReprogramSlots([]);

        setMessage(
          `No se pudieron cargar los horarios para reprogramar: ${error.message}`
        );

        return;
      }

      const slots =
        (data ?? []).map(
          (
            row: {
              slot_time: string;
            }
          ) =>
            row.slot_time.slice(
              0,
              5
            )
        );

      setReprogramSlots(
        slots
      );

      if (
        reprogramTime &&
        !slots.includes(
          reprogramTime
        )
      ) {
        setReprogramTime("");
      }
    }

    loadSlots();
  }, [
    reprogramReservation,
    reprogramDate,
    reprogramStaffId,
  ]);

  async function login(
    event: FormEvent
  ) {
    event.preventDefault();

    setLoadingLogin(true);
    setLoginError("");

    const { error } =
      await supabase.auth
        .signInWithPassword({
          email,
          password,
        });

    if (error) {
      setLoginError(
        "Correo o contraseña incorrectos."
      );

      setLoadingLogin(false);
      return;
    }

    const {
      data: isAdmin,
      error: adminError,
    } =
      await supabase.rpc(
        "is_admin"
      );

    if (
      adminError ||
      isAdmin !== true
    ) {
      await supabase.auth.signOut();

      setLoginError(
        "Este usuario no tiene acceso al panel."
      );

      setLoadingLogin(false);
      return;
    }

    setLoggedIn(true);
    setPassword("");
    setLoadingLogin(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setLoggedIn(false);
  }

  async function changeStatus(
    reservationId: string,
    status: string
  ) {
    setMessage("");

    const { error } =
      await supabase.rpc(
        "admin_set_booking_status",
        {
          p_reservation_id:
            reservationId,

          p_status:
            status,
        }
      );

    if (error) {
      alert(
        `No se pudo actualizar:\n${error.message}`
      );

      return;
    }

    setMessage(
      "Reserva actualizada correctamente."
    );

    await loadAdminData();
  }

  async function deleteReservation(
    reservation: Reservation
  ) {
    const confirmed =
      window.confirm(
        `¿Eliminar definitivamente la reserva de ${reservation.customer_name}?\n\nEl horario volverá a quedar disponible.`
      );

    if (!confirmed) {
      return;
    }

    const { error } =
      await supabase.rpc(
        "admin_delete_booking",
        {
          p_reservation_id:
            reservation.id,
        }
      );

    if (error) {
      alert(
        `No se pudo eliminar:\n${error.message}`
      );

      return;
    }

    setMessage(
      "Reserva eliminada correctamente."
    );

    await loadAdminData();
  }

  async function clearDayAgenda() {
    const person =
      staffFilter === "all"
        ? "TODAS las profesionales"
        : staffMap[
            staffFilter
          ] ?? "la profesional seleccionada";

    const firstConfirm =
      window.confirm(
        `¿Quieres borrar la agenda del ${formatLongDate(
          selectedDate
        )} para ${person}?`
      );

    if (!firstConfirm) {
      return;
    }

    const secondConfirm =
      window.confirm(
        "Esta acción eliminará definitivamente las reservas de ese día. ¿Continuar?"
      );

    if (!secondConfirm) {
      return;
    }

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "admin_delete_day_bookings",
        {
          p_date:
            selectedDate,

          p_staff_id:
            staffFilter ===
            "all"
              ? null
              : staffFilter,
        }
      );

    if (error) {
      alert(
        `No se pudo borrar la agenda:\n${error.message}`
      );

      return;
    }

    setMessage(
      `Agenda borrada. Reservas eliminadas: ${data ?? 0}.`
    );

    await loadAdminData();
  }

  function openWhatsApp(
    reservation: Reservation
  ) {
    const service =
      serviceMap[
        reservation.service_id
      ] ?? "Servicio";

    const person =
      reservation.staff_id
        ? staffMap[
            reservation.staff_id
          ]
        : "Mistica Spa";

    const text = [
      `Hola ${reservation.customer_name},`,
      "",
      "Te escribimos de Mistica Spa.",
      "",
      `Servicio: ${service}`,
      `Profesional: ${person}`,
      `Fecha: ${formatLongDate(
        dateYMD(
          reservation.starts_at
        )
      )}`,
      `Hora: ${formatHour(
        reservation.starts_at
      )}`,
      "",
      "¿Confirmas tu asistencia?",
    ].join("\n");

    window.open(
      `https://wa.me/${whatsappPhone(
        reservation.customer_phone
      )}?text=${encodeURIComponent(
        text
      )}`,
      "_blank"
    );
  }

  async function editStaffName(
    person: Staff
  ) {
    const newName =
      window.prompt(
        "Nuevo nombre de la profesional:",
        person.name
      );

    if (!newName?.trim()) {
      return;
    }

    const { error } =
      await supabase.rpc(
        "admin_update_staff_name",
        {
          p_staff_id:
            person.id,

          p_name:
            newName.trim(),
        }
      );

    if (error) {
      alert(
        `No se pudo modificar:\n${error.message}`
      );

      return;
    }

    setMessage(
      "Nombre actualizado correctamente."
    );

    await loadAdminData();
  }

  async function createManualBooking(
    event: FormEvent
  ) {
    event.preventDefault();

    setMessage("");

    if (!manualName.trim()) {
      alert(
        "Debes ingresar el nombre del cliente."
      );
      return;
    }

    if (!manualPhone.trim()) {
      alert(
        "Debes ingresar el WhatsApp del cliente."
      );
      return;
    }

    if (!manualServiceId) {
      alert(
        "Selecciona un servicio."
      );
      return;
    }

    if (!manualDuration) {
      alert(
        "Selecciona una duración."
      );
      return;
    }

    if (!manualStaffId) {
      alert(
        "Selecciona una profesional."
      );
      return;
    }

    if (!manualDate) {
      alert(
        manualMode === "package"
          ? "Selecciona la fecha desde la que comenzará el paquete."
          : "Selecciona una fecha."
      );
      return;
    }

    if (!manualTime) {
      alert(
        "Selecciona un horario."
      );
      return;
    }

    const phone =
      normalizeParaguayPhone(
        manualPhone
      );

    if (!phone) {
      alert(
        "Número inválido. Ejemplo: 0981 123 456"
      );
      return;
    }

    /* =========================================
       TURNO INDIVIDUAL
    ========================================= */
    if (manualMode === "single") {
      setSavingManual(true);

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "create_booking",
          {
            p_customer_name:
              manualName.trim(),

            p_customer_phone:
              phone,

            p_service_id:
              manualServiceId,

            p_staff_id:
              manualStaffId,

            p_duration:
              manualDuration,

            p_date:
              manualDate,

            p_time:
              `${manualTime}:00`,

            p_notes:
              manualNotes.trim() ||
              null,
          }
        );

      setSavingManual(false);

      if (error) {
        console.error(error);

        alert(
          `No se pudo crear el turno:\n${error.message}`
        );

        return;
      }

      alert(
        `Turno creado correctamente.\nCódigo: ${String(
          data
        ).slice(0, 8)}`
      );

      setMessage(
        "Turno creado correctamente."
      );

      setManualName("");
      setManualPhone("");
      setManualNotes("");
      setManualTime("");

      setSelectedDate(
        manualDate
      );

      await loadAdminData();
      return;
    }

    /* =========================================
       PAQUETE DE SESIONES
    ========================================= */
    if (
      packageCount < 2 ||
      packageCount > 50
    ) {
      alert(
        "La cantidad de sesiones debe estar entre 2 y 50."
      );
      return;
    }

    if (packageDays.length === 0) {
      alert(
        "Selecciona al menos un día de la semana."
      );
      return;
    }

    if (
      packageDates.length !==
      packageCount
    ) {
      alert(
        "No se pudieron generar todas las fechas del paquete."
      );
      return;
    }

    const confirmPackage =
      window.confirm(
        `Se crearán ${packageCount} sesiones para ${manualName.trim()} a las ${manualTime}.\n\n¿Continuar?`
      );

    if (!confirmPackage) {
      return;
    }

    setSavingManual(true);

    /*
     * PAQUETES:
     *
     * No usamos get_available_slots() para validar todas
     * las fechas antes de crear el paquete.
     *
     * Esa comprobación podía marcar horarios como ocupados
     * aunque la agenda estuviera vacía.
     *
     * create_booking() es la validación definitiva:
     * si una fecha realmente está ocupada o bloqueada,
     * Supabase rechazará solamente esa creación.
     *
     * Si alguna sesión falla, eliminamos todas las sesiones
     * que se hayan creado durante este intento para evitar
     * dejar un paquete incompleto.
     */
    const createdIds: string[] = [];

    for (
      let index = 0;
      index < packageDates.length;
      index++
    ) {
      const date =
        packageDates[index];

      const packageNote = [
        `Paquete de ${packageCount} sesiones`,
        `Sesión ${index + 1} de ${packageCount}`,
        manualNotes.trim(),
      ]
        .filter(Boolean)
        .join(" · ");

      const {
        data,
        error,
      } = await supabase.rpc(
        "create_booking",
        {
          p_customer_name:
            manualName.trim(),

          p_customer_phone:
            phone,

          p_service_id:
            manualServiceId,

          p_staff_id:
            manualStaffId,

          p_duration:
            manualDuration,

          p_date:
            date,

          p_time:
            `${manualTime}:00`,

          p_notes:
            packageNote,
        }
      );

      if (error) {
        console.error(error);

        for (
          const reservationId of
          createdIds
        ) {
          await supabase.rpc(
            "admin_delete_booking",
            {
              p_reservation_id:
                reservationId,
            }
          );
        }

        setSavingManual(false);

        alert(
          `No se pudo completar el paquete.\n\nFalló la sesión ${index + 1} del ${formatLongDate(
            date
          )} a las ${manualTime}.\n\nLas sesiones creadas durante este intento fueron eliminadas para no dejar el paquete incompleto.\n\n${error.message}`
        );

        await loadAdminData();
        return;
      }

      createdIds.push(
        String(data)
      );
    }

    setSavingManual(false);

    alert(
      `Paquete creado correctamente.\n\n${packageCount} sesiones reservadas para ${manualName.trim()}.`
    );

    setMessage(
      `Paquete creado correctamente: ${packageCount} sesiones.`
    );

    setSelectedDate(
      packageDates[0]
    );

    setManualName("");
    setManualPhone("");
    setManualNotes("");
    setManualTime("");

    await loadAdminData();
  }

  function startReprogram(
    reservation: Reservation
  ) {
    setMessage("");

    setReprogramReservation(
      reservation
    );

    setReprogramStaffId(
      reservation.staff_id ??
        ""
    );

    setReprogramDate(
      dateYMD(
        reservation.starts_at
      )
    );

    setReprogramTime(
      formatHour(
        reservation.starts_at
      )
    );

    setTimeout(() => {
      document
        .getElementById(
          "reprogramar-turno"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 100);
  }

  async function saveReprogram() {
    if (
      !reprogramReservation
    ) {
      return;
    }

    if (!reprogramStaffId) {
      alert(
        "Selecciona una profesional."
      );
      return;
    }

    if (!reprogramDate) {
      alert(
        "Selecciona una fecha."
      );
      return;
    }

    if (!reprogramTime) {
      alert(
        "Selecciona un horario."
      );
      return;
    }

    setSavingReprogram(true);

    const { error } =
      await supabase.rpc(
        "admin_reschedule_booking",
        {
          p_reservation_id:
            reprogramReservation.id,

          p_staff_id:
            reprogramStaffId,

          p_date:
            reprogramDate,

          p_time:
            `${reprogramTime}:00`,
        }
      );

    setSavingReprogram(false);

    if (error) {
      console.error(error);

      alert(
        `No se pudo reprogramar:\n${error.message}`
      );

      return;
    }

    alert(
      "Turno reprogramado correctamente."
    );

    setMessage(
      "Turno reprogramado correctamente."
    );

    setSelectedDate(
      reprogramDate
    );

    setReprogramReservation(
      null
    );

    setReprogramTime("");

    await loadAdminData();
  }

  async function createBlock(
    event: FormEvent
  ) {
    event.preventDefault();

    setCreatingBlock(true);

    const { error } =
      await supabase.rpc(
        "create_admin_block",
        {
          p_date:
            selectedDate,

          p_start:
            `${blockStart}:00`,

          p_end:
            `${blockEnd}:00`,

          p_reason:
            blockReason.trim() ||
            null,
        }
      );

    setCreatingBlock(false);

    if (error) {
      alert(
        `No se pudo bloquear:\n${error.message}`
      );

      return;
    }

    setBlockReason("");

    setMessage(
      "Horario bloqueado correctamente."
    );

    await loadAdminData();
  }

  async function deleteBlock(
    id: string
  ) {
    if (
      !window.confirm(
        "¿Liberar este horario?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase.rpc(
        "admin_delete_block",
        {
          p_block_id:
            id,
        }
      );

    if (error) {
      alert(
        `No se pudo liberar:\n${error.message}`
      );

      return;
    }

    setMessage(
      "Horario liberado."
    );

    await loadAdminData();
  }

  // LOGIN
  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ef]">
        Verificando acceso...
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ef] px-6 text-[#332a27]">

        <form
          onSubmit={login}
          className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl"
        >

          <div className="mb-8 text-center">

            <p className="text-sm uppercase tracking-[0.35em] text-[#9c7968]">
              Administración
            </p>

            <h1 className="mt-4 text-4xl font-light">
              Mistica Spa
            </h1>

          </div>

          <input
            type="email"
            required
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
          />

          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="mt-4 w-full rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
          />

          {loginError && (
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loadingLogin
            }
            className="mt-6 w-full rounded-full bg-[#765648] px-6 py-4 text-white disabled:opacity-50"
          >
            {loadingLogin
              ? "Ingresando..."
              : "Ingresar"}
          </button>

        </form>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#332a27]">

      <header className="border-b border-[#e5d8d0] bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>

            <p className="font-semibold tracking-[0.15em]">
              MISTICA SPA
            </p>

            <p className="text-xs uppercase tracking-[0.25em] text-[#9c7968]">
              Administración
            </p>

          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-[#765648] px-5 py-2 text-sm text-[#765648]"
          >
            Cerrar sesión
          </button>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="flex flex-col justify-between gap-5 md:flex-row">

          <div>

            <p className="text-sm uppercase tracking-[0.3em] text-[#9c7968]">
              Agenda
            </p>

            <h1 className="mt-2 text-4xl font-light capitalize">
              {formatLongDate(
                selectedDate
              )}
            </h1>

          </div>

          <input
            type="date"
            value={
              selectedDate
            }
            onChange={(e) =>
              setSelectedDate(
                e.target.value
              )
            }
            className="rounded-xl border bg-white px-4 py-3"
          />

        </div>

        {/* FILTROS */}
        <div className="mt-6 flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={() =>
              setStaffFilter(
                "all"
              )
            }
            className={`rounded-full px-5 py-2 text-sm ${
              staffFilter ===
              "all"
                ? "bg-[#765648] text-white"
                : "bg-white"
            }`}
          >
            Todas
          </button>

          {staff.map(
            (person) => (

              <button
                key={
                  person.id
                }
                type="button"
                onClick={() =>
                  setStaffFilter(
                    person.id
                  )
                }
                className={`rounded-full px-5 py-2 text-sm ${
                  staffFilter ===
                  person.id
                    ? "bg-[#765648] text-white"
                    : "bg-white"
                }`}
              >
                {person.name}
              </button>

            )
          )}

          <button
            type="button"
            onClick={
              clearDayAgenda
            }
            className="ml-auto rounded-full border border-red-500 px-5 py-2 text-sm text-red-600"
          >
            Borrar agenda del día
          </button>

        </div>

        {/* RESUMEN */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl bg-white p-6">

            <p className="text-sm text-[#756762]">
              Turnos
            </p>

            <p className="mt-2 text-3xl">
              {
                activeReservations.length
              }
            </p>

          </div>

          <div className="rounded-2xl bg-white p-6">

            <p className="text-sm text-[#756762]">
              Confirmados
            </p>

            <p className="mt-2 text-3xl">
              {
                confirmedCount
              }
            </p>

          </div>

          <div className="rounded-2xl bg-white p-6">

            <p className="text-sm text-[#756762]">
              Atendidos
            </p>

            <p className="mt-2 text-3xl">
              {
                attendedCount
              }
            </p>

          </div>

        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-[#e2d6cf] bg-white p-4 text-sm">
            {message}
          </div>
        )}

        {/* REPROGRAMAR */}
        {reprogramReservation && (

          <section
            id="reprogramar-turno"
            className="mt-8 rounded-3xl border-2 border-[#c7aa9b] bg-white p-7 shadow-sm"
          >

            <div className="flex items-start justify-between gap-5">

              <div>

                <p className="text-sm uppercase tracking-[0.25em] text-[#9c7968]">
                  Reprogramar turno
                </p>

                <h2 className="mt-2 text-2xl font-medium">
                  {
                    reprogramReservation.customer_name
                  }
                </h2>

                <p className="mt-1 text-sm text-[#756762]">
                  {serviceMap[
                    reprogramReservation.service_id
                  ] ?? "Servicio"}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setReprogramReservation(
                    null
                  )
                }
                className="rounded-full border px-4 py-2 text-sm"
              >
                Cerrar
              </button>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              <select
                value={
                  reprogramStaffId
                }
                onChange={(e) => {
                  setReprogramStaffId(
                    e.target.value
                  );

                  setReprogramTime(
                    ""
                  );
                }}
                className="rounded-xl border border-[#dfd2c7] px-4 py-3"
              >

                <option value="">
                  Selecciona profesional
                </option>

                {staff.map(
                  (person) => (
                    <option
                      key={
                        person.id
                      }
                      value={
                        person.id
                      }
                    >
                      {
                        person.name
                      }
                    </option>
                  )
                )}

              </select>

              <input
                type="date"
                min={todayYMD()}
                value={
                  reprogramDate
                }
                onChange={(e) => {
                  setReprogramDate(
                    e.target.value
                  );

                  setReprogramTime(
                    ""
                  );
                }}
                className="rounded-xl border border-[#dfd2c7] px-4 py-3"
              />

              <select
                value={
                  reprogramTime
                }
                onChange={(e) =>
                  setReprogramTime(
                    e.target.value
                  )
                }
                disabled={
                  loadingReprogramSlots ||
                  !reprogramStaffId
                }
                className="rounded-xl border border-[#dfd2c7] px-4 py-3 disabled:opacity-50"
              >

                <option value="">
                  {loadingReprogramSlots
                    ? "Cargando horarios..."
                    : "Selecciona horario"}
                </option>

                {reprogramSlots.map(
                  (time) => (
                    <option
                      key={
                        time
                      }
                      value={
                        time
                      }
                    >
                      {time}
                    </option>
                  )
                )}

              </select>

            </div>

            {reprogramSlots.length ===
              0 &&
              !loadingReprogramSlots &&
              reprogramStaffId && (
                <p className="mt-4 text-sm text-red-600">
                  No hay horarios disponibles para esta fecha y profesional.
                </p>
              )}

            <button
              type="button"
              onClick={
                saveReprogram
              }
              disabled={
                savingReprogram ||
                !reprogramTime
              }
              className="mt-5 rounded-full bg-[#765648] px-7 py-3 text-white disabled:opacity-40"
            >
              {savingReprogram
                ? "Guardando..."
                : "Guardar nueva fecha"}
            </button>

          </section>
        )}

        {/* AGENDA POR HORARIO */}
        <section className="mt-10">

          <div className="flex items-center justify-between">

            <h2 className="text-2xl font-medium">
              Agenda por horario
            </h2>

            <button
              type="button"
              onClick={
                loadAdminData
              }
              className="text-sm text-[#765648] underline"
            >
              Actualizar
            </button>

          </div>

          <div className="mt-5 overflow-x-auto rounded-3xl bg-white shadow-sm">

            <table className="w-full min-w-[700px]">

              <thead>

                <tr className="border-b">

                  <th className="p-4 text-left">
                    Hora
                  </th>

                  {visibleStaff.map(
                    (person) => (
                      <th
                        key={
                          person.id
                        }
                        className="p-4 text-left"
                      >
                        {
                          person.name
                        }
                      </th>
                    )
                  )}

                </tr>

              </thead>

              <tbody>

                {HOURS.map(
                  (hour) => (

                    <tr
                      key={
                        hour
                      }
                      className="border-b last:border-0"
                    >

                      <td className="p-4 font-medium text-[#765648]">
                        {hour}
                      </td>

                      {visibleStaff.map(
                        (person) => {
                          const reservation =
                            reservationsForDate.find(
                              (item) =>
                                item.staff_id ===
                                  person.id &&
                                formatHour(
                                  item.starts_at
                                ) ===
                                  hour &&
                                item.status !==
                                  "cancelled"
                            );

                          return (
                            <td
                              key={
                                person.id
                              }
                              className="p-4"
                            >

                              {reservation ? (

                                <div className="rounded-xl bg-[#f8f4ef] p-3">

                                  <p className="font-medium">
                                    {
                                      reservation.customer_name
                                    }
                                  </p>

                                  <p className="mt-1 text-sm text-[#756762]">
                                    {serviceMap[
                                      reservation.service_id
                                    ] ??
                                      "Servicio"}
                                  </p>

                                  <p className="mt-1 text-xs">
                                    {
                                      reservation.duration_minutes
                                    }{" "}
                                    min
                                  </p>

                                </div>

                              ) : (

                                <span className="text-sm text-green-700">
                                  Disponible
                                </span>

                              )}

                            </td>
                          );
                        }
                      )}

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </section>

        <div className="mt-10 space-y-10">

          {/* TURNOS */}
          <section>

            <h2 className="text-2xl font-medium">
              Turnos del día
            </h2>

            {loadingAgenda ? (

              <div className="mt-5 rounded-3xl bg-white p-8">
                Cargando...
              </div>

            ) : filteredReservations.length ===
              0 ? (

              <div className="mt-5 rounded-3xl bg-white p-8 text-center text-[#756762]">
                No hay turnos para este día.
              </div>

            ) : (

              <div className="mt-5 space-y-4">

                {filteredReservations.map(
                  (reservation) => (

                    <article
                      key={
                        reservation.id
                      }
                      className="rounded-3xl bg-white p-6 shadow-sm"
                    >

                      <div className="flex flex-col justify-between gap-5 sm:flex-row">

                        <div>

                          <p className="text-2xl font-medium text-[#765648]">
                            {formatHour(
                              reservation.starts_at
                            )}
                          </p>

                          <p className="mt-3 text-lg font-medium">
                            {
                              reservation.customer_name
                            }
                          </p>

                          <p className="text-sm text-[#756762]">
                            {serviceMap[
                              reservation.service_id
                            ] ??
                              "Servicio"}
                          </p>

                          <p className="mt-2 text-sm">
                            Profesional:{" "}
                            {reservation.staff_id
                              ? staffMap[
                                  reservation.staff_id
                                ]
                              : "Sin asignar"}
                          </p>

                          <p className="mt-1 text-sm">
                            Duración:{" "}
                            {
                              reservation.duration_minutes
                            }{" "}
                            min
                          </p>

                          <p className="mt-1 text-sm">
                            WhatsApp:{" "}
                            {
                              reservation.customer_phone
                            }
                          </p>

                          {reservation.notes && (
                            <p className="mt-2 text-sm text-[#756762]">
                              Observación:{" "}
                              {
                                reservation.notes
                              }
                            </p>
                          )}

                        </div>

                        <span
                          className={`h-fit rounded-full px-4 py-2 text-xs ${statusClasses(
                            reservation.status
                          )}`}
                        >
                          {statusLabels[
                            reservation.status
                          ] ??
                            reservation.status}
                        </span>

                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openWhatsApp(
                              reservation
                            )
                          }
                          className="rounded-full bg-[#765648] px-4 py-2 text-sm text-white"
                        >
                          WhatsApp
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            startReprogram(
                              reservation
                            )
                          }
                          className="rounded-full border border-[#765648] px-4 py-2 text-sm text-[#765648]"
                        >
                          Reprogramar
                        </button>

                        {reservation.status !==
                          "confirmed" && (
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(
                                reservation.id,
                                "confirmed"
                              )
                            }
                            className="rounded-full border border-green-600 px-4 py-2 text-sm text-green-700"
                          >
                            Confirmar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(
                              reservation.id,
                              "attended"
                            )
                          }
                          className="rounded-full border border-blue-600 px-4 py-2 text-sm text-blue-700"
                        >
                          Atendido
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(
                              reservation.id,
                              "no_show"
                            )
                          }
                          className="rounded-full border border-orange-500 px-4 py-2 text-sm text-orange-700"
                        >
                          No asistió
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "¿Cancelar este turno?"
                              )
                            ) {
                              changeStatus(
                                reservation.id,
                                "cancelled"
                              );
                            }
                          }}
                          className="rounded-full border border-red-500 px-4 py-2 text-sm text-red-700"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteReservation(
                              reservation
                            )
                          }
                          className="rounded-full bg-red-600 px-4 py-2 text-sm text-white"
                        >
                          Eliminar
                        </button>

                      </div>

                    </article>

                  )
                )}

              </div>
            )}

          </section>
               
          <aside className="space-y-3">

            <div className="mb-5">
              <p className="text-sm uppercase tracking-[0.3em] text-[#9c7968]">
                Herramientas
              </p>

              <h2 className="mt-2 text-2xl font-medium">
                Administración
              </h2>

              <p className="mt-2 text-sm text-[#756762]">
                Abre solamente la herramienta que necesites. La agenda permanece visible arriba.
              </p>
            </div>

            {/* TURNO MANUAL / PAQUETE */}
            <AdminTool
              eyebrow="Reservas"
              title="Crear turno manual o paquete"
            >
              <h2 className="text-xl font-medium">
                Crear turno manual
              </h2>

              <p className="mt-2 text-sm text-[#756762]">
                Puedes crear una sola reserva o un paquete completo de sesiones.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#f8f4ef] p-1">

                <button
                  type="button"
                  onClick={() => {
                    setManualMode(
                      "single"
                    );
                    setManualTime("");
                  }}
                  className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
                    manualMode ===
                    "single"
                      ? "bg-[#765648] text-white shadow-sm"
                      : "text-[#765648]"
                  }`}
                >
                  Una sesión
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setManualMode(
                      "package"
                    );
                    setManualTime("");
                  }}
                  className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
                    manualMode ===
                    "package"
                      ? "bg-[#765648] text-white shadow-sm"
                      : "text-[#765648]"
                  }`}
                >
                  Paquete de sesiones
                </button>

              </div>

              <form
                onSubmit={
                  createManualBooking
                }
                className="mt-6 space-y-4"
              >

                <input
                  type="text"
                  required
                  placeholder="Nombre y apellido"
                  value={manualName}
                  onChange={(e) =>
                    setManualName(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#dfd2c7] px-4 py-3"
                />

                <input
                  type="tel"
                  required
                  placeholder="0981 123 456"
                  value={manualPhone}
                  onChange={(e) =>
                    setManualPhone(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#dfd2c7] px-4 py-3"
                />

                <select
                  required
                  value={manualServiceId}
                  onChange={(e) => {
                    setManualServiceId(
                      e.target.value
                    );
                    setManualDuration(
                      null
                    );
                  }}
                  className="w-full rounded-xl border border-[#dfd2c7] px-4 py-3"
                >
                  <option value="">
                    Selecciona servicio
                  </option>

                  {services.map(
                    (service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.name}
                      </option>
                    )
                  )}
                </select>

                {manualService && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Duración
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {manualService.allowed_durations
                        .slice()
                        .sort(
                          (a, b) =>
                            a - b
                        )
                        .map(
                          (duration) => (
                            <button
                              key={duration}
                              type="button"
                              onClick={() =>
                                setManualDuration(
                                  duration
                                )
                              }
                              className={`rounded-xl border py-3 text-sm ${
                                manualDuration ===
                                duration
                                  ? "border-[#765648] bg-[#765648] text-white"
                                  : "border-[#dfd2c7]"
                              }`}
                            >
                              {duration} min
                            </button>
                          )
                        )}
                    </div>
                  </div>
                )}

                <select
                  required
                  value={manualStaffId}
                  onChange={(e) => {
                    setManualStaffId(
                      e.target.value
                    );
                    setManualTime("");
                  }}
                  className="w-full rounded-xl border border-[#dfd2c7] px-4 py-3"
                >
                  <option value="">
                    Selecciona profesional
                  </option>

                  {staff.map(
                    (person) => (
                      <option
                        key={person.id}
                        value={person.id}
                      >
                        {person.name}
                      </option>
                    )
                  )}
                </select>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {manualMode ===
                    "package"
                      ? "Comenzar desde"
                      : "Fecha"}
                  </label>

                  <input
                    type="date"
                    required
                    min={todayYMD()}
                    value={manualDate}
                    onChange={(e) => {
                      setManualDate(
                        e.target.value
                      );
                      setManualTime("");
                    }}
                    className="w-full rounded-xl border border-[#dfd2c7] px-4 py-3"
                  />
                </div>

                {manualMode ===
                  "package" && (
                  <div className="rounded-2xl border border-[#e6dbd4] bg-[#fcfaf8] p-4">

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Cantidad de sesiones
                      </label>

                      <input
                        type="number"
                        min={2}
                        max={50}
                        value={packageCount}
                        onChange={(e) =>
                          setPackageCount(
                            Math.max(
                              2,
                              Math.min(
                                50,
                                Number(
                                  e.target.value
                                ) || 2
                              )
                            )
                          )
                        }
                        className="w-full rounded-xl border border-[#dfd2c7] bg-white px-4 py-3"
                      />
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium">
                        Días en que vendrá
                      </p>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {WEEKDAYS.map(
                          (day) => {
                            const active =
                              packageDays.includes(
                                day.value
                              );

                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() =>
                                  setPackageDays(
                                    (current) =>
                                      active
                                        ? current.filter(
                                            (value) =>
                                              value !==
                                              day.value
                                          )
                                        : [
                                            ...current,
                                            day.value,
                                          ].sort()
                                  )
                                }
                                className={`rounded-xl border px-3 py-3 text-sm transition ${
                                  active
                                    ? "border-[#765648] bg-[#765648] text-white"
                                    : "border-[#dfd2c7] bg-white"
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {packageDates.length >
                      0 && (
                      <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="text-sm font-medium text-[#765648]">
                          Fechas del paquete
                        </p>

                        <div className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-[#756762]">
                          {packageDates.map(
                            (date, index) => (
                              <p key={date}>
                                {index + 1}. {formatLongDate(
                                  date
                                )}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <p className="mt-3 text-xs leading-5 text-[#756762]">
                      Ejemplo: si marcas lunes, miércoles y viernes y eliges 10 sesiones, el sistema tomará las próximas 10 fechas que coincidan con esos días.
                    </p>

                  </div>
                )}

                <details className="overflow-hidden rounded-2xl border border-[#dfd2c7] bg-white">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-[#765648]">
                    <span>Horarios disponibles</span>
                    <span className="text-xs">Abrir ↓</span>
                  </summary>

                  <div className="border-t border-[#eee4dd] p-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Horario
                      </label>

                      <select
                        required
                        value={manualTime}
                        onChange={(e) =>
                          setManualTime(
                            e.target.value
                          )
                        }
                        disabled={
                          !manualStaffId ||
                          (manualMode ===
                            "single" &&
                            loadingManualSlots)
                        }
                        className="w-full rounded-xl border border-[#dfd2c7] px-4 py-3 disabled:opacity-50"
                      >
                        <option value="">
                          {manualMode ===
                            "single" &&
                          loadingManualSlots
                            ? "Cargando horarios..."
                            : "Selecciona horario"}
                        </option>

                        {(manualMode ===
                        "package"
                          ? HOURS
                          : manualSlots
                        ).map((time) => (
                          <option
                            key={time}
                            value={time}
                          >
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    {manualMode ===
                      "single" &&
                      manualStaffId &&
                      !loadingManualSlots &&
                      manualSlots.length ===
                        0 && (
                        <p className="text-sm text-red-600">
                          No hay horarios disponibles para ese día.
                        </p>
                      )}
                  </div>
                </details>

                {manualMode ===
                  "package" && (
                  <p className="rounded-xl bg-[#f8f4ef] p-3 text-xs leading-5 text-[#756762]">
                    Antes de guardar, el sistema comprobará todas las fechas. Si una sola está ocupada, no se creará ninguna sesión hasta que cambies la hora, los días o la profesional.
                  </p>
                )}

                <textarea
                  placeholder="Observación opcional"
                  value={manualNotes}
                  onChange={(e) =>
                    setManualNotes(
                      e.target.value
                    )
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#dfd2c7] px-4 py-3"
                />

                <button
                  type="submit"
                  disabled={savingManual}
                  className="w-full rounded-full bg-[#765648] px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingManual
                    ? manualMode ===
                      "package"
                      ? "Comprobando y creando sesiones..."
                      : "Guardando..."
                    : manualMode ===
                      "package"
                    ? `Crear paquete de ${packageCount} sesiones`
                    : "Crear turno"}
                </button>

              </form>

            </AdminTool>

            {/* PROMOCIONES */}
            <AdminTool
              eyebrow="Web"
              title="Promociones y combos"
            >
              <PromotionsManager />
            </AdminTool>

            {/* PROFESIONALES */}
            <AdminTool
              eyebrow="Equipo"
              title="Profesionales"
            >

              <div className="space-y-3">

                {staff.map(
                  (person) => (

                    <div
                      key={
                        person.id
                      }
                      className="flex items-center justify-between rounded-xl bg-[#f8f4ef] p-4"
                    >

                      <span>
                        {
                          person.name
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          editStaffName(
                            person
                          )
                        }
                        className="text-sm text-[#765648] underline"
                      >
                        Editar
                      </button>

                    </div>

                  )
                )}

              </div>

            </AdminTool>

            {/* BLOQUEAR */}
            <AdminTool
              eyebrow="Agenda"
              title="Bloquear horario"
              dark
            >
              <p className="text-sm text-white/80">
                El bloqueo afectará a las dos profesionales.
              </p>

              <form
                onSubmit={createBlock}
                className="mt-5"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs">
                      Desde
                    </label>

                    <input
                      type="time"
                      required
                      min="08:00"
                      max="20:00"
                      value={blockStart}
                      onChange={(e) =>
                        setBlockStart(e.target.value)
                      }
                      className="w-full rounded-xl bg-white px-3 py-3 text-black"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs">
                      Hasta
                    </label>

                    <input
                      type="time"
                      required
                      min="09:00"
                      max="21:00"
                      value={blockEnd}
                      onChange={(e) =>
                        setBlockEnd(e.target.value)
                      }
                      className="w-full rounded-xl bg-white px-3 py-3 text-black"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Motivo opcional"
                  value={blockReason}
                  onChange={(e) =>
                    setBlockReason(e.target.value)
                  }
                  className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-black"
                />

                <button
                  type="submit"
                  disabled={creatingBlock}
                  className="mt-3 w-full rounded-full bg-white py-3 font-medium text-[#765648] disabled:opacity-50"
                >
                  {creatingBlock
                    ? "Bloqueando..."
                    : "Bloquear horario"}
                </button>
              </form>
            </AdminTool>

            {/* BLOQUEOS */}
            <AdminTool
              eyebrow="Agenda"
              title="Horarios bloqueados"
            >
              {blocksForDate.length === 0 ? (
                <p className="text-sm text-[#756762]">
                  No hay bloqueos para este día.
                </p>
              ) : (
                <div className="space-y-3">
                  {blocksForDate.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-[#f8f4ef] p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {formatHour(block.starts_at)} - {formatHour(block.ends_at)}
                        </p>

                        {block.reason && (
                          <p className="mt-1 text-xs text-[#756762]">
                            {block.reason}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        className="text-sm text-red-600"
                      >
                        Liberar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </AdminTool>

          </aside>

        </div>

      </div>

    </main>
  );
}