"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Reservation = {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
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
};

type BlockedTime = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

const TIME_ZONE = "America/Asuncion";

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

function dateYMD(date: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

function formatHour(date: string) {
  return new Intl.DateTimeFormat("es-PY", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

function formatLongDate(ymd: string) {
  const date = new Date(`${ymd}T12:00:00`);

  return new Intl.DateTimeFormat("es-PY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("595")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `595${digits.slice(1)}`;
  }

  return digits;
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
    default:
      return "bg-[#efe5df] text-[#765648]";
  }
}

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);

  const [loggedIn, setLoggedIn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [selectedDate, setSelectedDate] =
    useState(todayYMD());

  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [services, setServices] =
    useState<Service[]>([]);

  const [blocks, setBlocks] =
    useState<BlockedTime[]>([]);

  const [loadingAgenda, setLoadingAgenda] =
    useState(false);

  const [message, setMessage] = useState("");

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

  const reservationsForDate = useMemo(() => {
    return reservations
      .filter(
        (reservation) =>
          dateYMD(reservation.starts_at) ===
          selectedDate
      )
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() -
          new Date(b.starts_at).getTime()
      );
  }, [reservations, selectedDate]);

  const blocksForDate = useMemo(() => {
    return blocks
      .filter(
        (block) =>
          dateYMD(block.starts_at) ===
          selectedDate
      )
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() -
          new Date(b.starts_at).getTime()
      );
  }, [blocks, selectedDate]);

  const activeReservations =
    reservationsForDate.filter(
      (reservation) =>
        reservation.status !== "cancelled"
    );

  const confirmedCount =
    reservationsForDate.filter(
      (reservation) =>
        reservation.status === "confirmed"
    ).length;

  const attendedCount =
    reservationsForDate.filter(
      (reservation) =>
        reservation.status === "attended"
    ).length;

  const loadAdminData = useCallback(async () => {
    setLoadingAgenda(true);
    setMessage("");

    const [
      reservationsResult,
      servicesResult,
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
        .select("id, name")
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

      setMessage(
        "No se pudieron cargar las reservas."
      );
    }

    if (servicesResult.error) {
      console.error(servicesResult.error);
    }

    if (blocksResult.error) {
      console.error(blocksResult.error);
    }

    setReservations(
      (reservationsResult.data ?? []) as Reservation[]
    );

    setServices(
      (servicesResult.data ?? []) as Service[]
    );

    setBlocks(
      (blocksResult.data ?? []) as BlockedTime[]
    );

    setLoadingAgenda(false);
  }, []);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoggedIn(false);
        setCheckingSession(false);
        return;
      }

      const { data, error } =
        await supabase.rpc("is_admin");

      if (error || data !== true) {
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
  }, [loggedIn, loadAdminData]);

  async function login(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setLoadingLogin(true);
    setLoginError("");

    const { error } =
      await supabase.auth.signInWithPassword({
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

    const { data: isAdmin, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || isAdmin !== true) {
      await supabase.auth.signOut();

      setLoginError(
        "Este usuario no tiene acceso al panel administrativo."
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
    setEmail("");
    setPassword("");
  }

  async function changeStatus(
    reservationId: string,
    status: string
  ) {
    setMessage("");

    const { error } = await supabase
      .from("reservations")
      .update({
        status,
      })
      .eq("id", reservationId);

    if (error) {
      console.error(error);

      setMessage(
        "No se pudo actualizar la reserva."
      );

      return;
    }

    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === reservationId
          ? {
              ...reservation,
              status,
            }
          : reservation
      )
    );

    setMessage(
      "La reserva fue actualizada correctamente."
    );
  }

  function openWhatsApp(
    reservation: Reservation
  ) {
    const phone = normalizePhone(
      reservation.customer_phone
    );

    const service =
      serviceMap[reservation.service_id] ??
      "Servicio";

    const message = [
      `Hola ${reservation.customer_name},`,
      "",
      "Te escribimos de Mistica Spa.",
      "",
      `Tu turno es para ${service}.`,
      `Fecha: ${formatLongDate(
        dateYMD(reservation.starts_at)
      )}`,
      `Hora: ${formatHour(
        reservation.starts_at
      )}`,
      "",
      "¿Podrías confirmarnos tu asistencia?",
    ].join("\n");

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  }

  async function createBlock(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setCreatingBlock(true);
    setMessage("");

    const { error } = await supabase.rpc(
      "create_admin_block",
      {
        p_date: selectedDate,
        p_start: `${blockStart}:00`,
        p_end: `${blockEnd}:00`,
        p_reason:
          blockReason.trim() || null,
      }
    );

    if (error) {
      console.error(error);

      setMessage(error.message);
      setCreatingBlock(false);

      return;
    }

    setMessage(
      "Horario bloqueado correctamente."
    );

    setBlockReason("");
    setCreatingBlock(false);

    await loadAdminData();
  }

  async function deleteBlock(
    blockId: string
  ) {
    const confirmed =
      window.confirm(
        "¿Quieres liberar este horario?"
      );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("blocked_times")
      .delete()
      .eq("id", blockId);

    if (error) {
      console.error(error);

      setMessage(
        "No se pudo liberar el horario."
      );

      return;
    }

    setBlocks((current) =>
      current.filter(
        (block) => block.id !== blockId
      )
    );

    setMessage(
      "El horario volvió a quedar disponible."
    );
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ef] text-[#332a27]">
        <p>
          Verificando acceso...
        </p>
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f4ef] px-6 text-[#332a27]">

        <div className="w-full max-w-md">

          <div className="mb-8 text-center">

            <p className="text-sm uppercase tracking-[0.35em] text-[#9c7968]">
              Administración
            </p>

            <h1 className="mt-4 text-4xl font-light">
              Mistica Spa
            </h1>

            <p className="mt-3 text-sm text-[#756762]">
              Acceso exclusivo para la propietaria
            </p>

          </div>

          <form
            onSubmit={login}
            className="rounded-[2rem] bg-white p-8 shadow-xl"
          >

            <label className="text-sm">
              Correo electrónico
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
              placeholder="correo@ejemplo.com"
            />

            <label className="mt-6 block text-sm">
              Contraseña
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
              placeholder="••••••••"
            />

            {loginError && (
              <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingLogin}
              className="mt-7 w-full rounded-full bg-[#765648] px-6 py-4 font-medium text-white transition hover:bg-[#5f4439] disabled:opacity-50"
            >
              {loadingLogin
                ? "Ingresando..."
                : "Ingresar al panel"}
            </button>

          </form>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#332a27]">

      {/* CABECERA */}
      <header className="border-b border-[#e5d8d0] bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <p className="text-lg font-semibold tracking-[0.15em]">
              MISTICA SPA
            </p>

            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-[#9c7968]">
              Administración
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-full border border-[#765648] px-5 py-2 text-sm text-[#765648] transition hover:bg-[#765648] hover:text-white"
          >
            Cerrar sesión
          </button>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* FECHA */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>

            <p className="text-sm uppercase tracking-[0.3em] text-[#9c7968]">
              Agenda
            </p>

            <h1 className="mt-2 text-4xl font-light capitalize">
              {formatLongDate(selectedDate)}
            </h1>

          </div>

          <div>

            <label className="mb-2 block text-sm text-[#756762]">
              Cambiar fecha
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(
                  event.target.value
                )
              }
              className="rounded-xl border border-[#dfd2c7] bg-white px-4 py-3 outline-none focus:border-[#765648]"
            />

          </div>

        </div>

        {/* RESUMEN */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl bg-white p-6">
            <p className="text-sm text-[#756762]">
              Turnos
            </p>

            <p className="mt-2 text-3xl font-light">
              {activeReservations.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6">
            <p className="text-sm text-[#756762]">
              Confirmados
            </p>

            <p className="mt-2 text-3xl font-light">
              {confirmedCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6">
            <p className="text-sm text-[#756762]">
              Atendidos
            </p>

            <p className="mt-2 text-3xl font-light">
              {attendedCount}
            </p>
          </div>

        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-[#dfd2c7] bg-white p-4 text-sm">
            {message}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.7fr_1fr]">

          {/* RESERVAS */}
          <section>

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-2xl font-medium">
                Turnos del día
              </h2>

              <button
                onClick={loadAdminData}
                className="text-sm text-[#765648] underline underline-offset-4"
              >
                Actualizar
              </button>

            </div>

            {loadingAgenda ? (

              <div className="rounded-3xl bg-white p-8 text-center text-[#756762]">
                Cargando agenda...
              </div>

            ) : reservationsForDate.length === 0 ? (

              <div className="rounded-3xl bg-white p-10 text-center">

                <p className="text-lg">
                  No hay turnos para este día.
                </p>

                <p className="mt-2 text-sm text-[#756762]">
                  Los nuevos turnos aparecerán aquí automáticamente.
                </p>

              </div>

            ) : (

              <div className="space-y-4">

                {reservationsForDate.map(
                  (reservation) => (

                    <article
                      key={reservation.id}
                      className={`rounded-3xl bg-white p-6 ${
                        reservation.status ===
                        "cancelled"
                          ? "opacity-60"
                          : ""
                      }`}
                    >

                      <div className="flex flex-col justify-between gap-5 md:flex-row">

                        <div className="flex gap-5">

                          <div className="min-w-[72px]">

                            <p className="text-2xl font-medium text-[#765648]">
                              {formatHour(
                                reservation.starts_at
                              )}
                            </p>

                            <p className="mt-1 text-xs text-[#756762]">
                              {
                                reservation.duration_minutes
                              }{" "}
                              min
                            </p>

                          </div>

                          <div>

                            <p className="text-lg font-medium">
                              {
                                reservation.customer_name
                              }
                            </p>

                            <p className="mt-1 text-sm text-[#756762]">
                              {serviceMap[
                                reservation.service_id
                              ] ?? "Servicio"}
                            </p>

                            <p className="mt-1 text-sm text-[#756762]">
                              {
                                reservation.customer_phone
                              }
                            </p>

                            {reservation.notes && (
                              <p className="mt-3 rounded-xl bg-[#f8f4ef] p-3 text-sm text-[#675954]">
                                {
                                  reservation.notes
                                }
                              </p>
                            )}

                          </div>

                        </div>

                        <div>

                          <span
                            className={`inline-block rounded-full px-4 py-2 text-xs font-medium ${statusClasses(
                              reservation.status
                            )}`}
                          >
                            {statusLabels[
                              reservation.status
                            ] ??
                              reservation.status}
                          </span>

                        </div>

                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">

                        <button
                          onClick={() =>
                            openWhatsApp(
                              reservation
                            )
                          }
                          className="rounded-full bg-[#765648] px-4 py-2 text-sm text-white"
                        >
                          WhatsApp
                        </button>

                        {reservation.status !==
                          "confirmed" &&
                          reservation.status !==
                            "cancelled" &&
                          reservation.status !==
                            "attended" && (
                            <button
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

                        {reservation.status !==
                          "attended" &&
                          reservation.status !==
                            "cancelled" && (
                            <button
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
                          )}

                        {reservation.status !==
                          "no_show" &&
                          reservation.status !==
                            "cancelled" &&
                          reservation.status !==
                            "attended" && (
                            <button
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
                          )}

                        {reservation.status !==
                          "cancelled" &&
                          reservation.status !==
                            "attended" && (
                            <button
                              onClick={() => {
                                const confirmed =
                                  window.confirm(
                                    "¿Seguro que quieres cancelar este turno?"
                                  );

                                if (confirmed) {
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
                          )}

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          </section>

          {/* BLOQUEAR HORARIO */}
          <aside>

            <div className="rounded-3xl bg-[#765648] p-7 text-white">

              <p className="text-sm uppercase tracking-[0.25em] text-[#eadfd7]">
                Disponibilidad
              </p>

              <h2 className="mt-3 text-2xl font-light">
                Bloquear horario
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#eadfd7]">
                Úsalo para almuerzo, trámites o cualquier momento en que no se puedan recibir turnos.
              </p>

              <form
                onSubmit={createBlock}
                className="mt-7"
              >

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <label className="text-xs">
                      Desde
                    </label>

                    <input
                      type="time"
                      min="08:00"
                      max="20:00"
                      required
                      value={blockStart}
                      onChange={(event) =>
                        setBlockStart(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl bg-white px-3 py-3 text-[#332a27]"
                    />
                  </div>

                  <div>
                    <label className="text-xs">
                      Hasta
                    </label>

                    <input
                      type="time"
                      min="08:00"
                      max="20:00"
                      required
                      value={blockEnd}
                      onChange={(event) =>
                        setBlockEnd(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl bg-white px-3 py-3 text-[#332a27]"
                    />
                  </div>

                </div>

                <input
                  type="text"
                  placeholder="Motivo opcional"
                  value={blockReason}
                  onChange={(event) =>
                    setBlockReason(
                      event.target.value
                    )
                  }
                  className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-[#332a27]"
                />

                <button
                  type="submit"
                  disabled={creatingBlock}
                  className="mt-4 w-full rounded-full bg-white px-5 py-3 font-medium text-[#765648] disabled:opacity-50"
                >
                  {creatingBlock
                    ? "Bloqueando..."
                    : "Bloquear horario"}
                </button>

              </form>

            </div>

            {/* BLOQUEOS DEL DÍA */}
            <div className="mt-6 rounded-3xl bg-white p-6">

              <h3 className="text-lg font-medium">
                Horarios bloqueados
              </h3>

              {blocksForDate.length === 0 ? (

                <p className="mt-4 text-sm text-[#756762]">
                  No hay bloqueos para este día.
                </p>

              ) : (

                <div className="mt-4 space-y-3">

                  {blocksForDate.map(
                    (block) => (

                      <div
                        key={block.id}
                        className="rounded-xl bg-[#f8f4ef] p-4"
                      >

                        <div className="flex items-center justify-between gap-3">

                          <div>

                            <p className="font-medium">
                              {formatHour(
                                block.starts_at
                              )}
                              {" - "}
                              {formatHour(
                                block.ends_at
                              )}
                            </p>

                            {block.reason && (
                              <p className="mt-1 text-xs text-[#756762]">
                                {block.reason}
                              </p>
                            )}

                          </div>

                          <button
                            onClick={() =>
                              deleteBlock(
                                block.id
                              )
                            }
                            className="text-xs text-red-600 underline"
                          >
                            Liberar
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>
              )}

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}