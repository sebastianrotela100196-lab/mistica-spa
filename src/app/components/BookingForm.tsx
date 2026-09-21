"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Service = {
  id: string;
  name: string;
  category: string;
  allowed_durations: number[];
};

type Staff = {
  id: string;
  name: string;
  active: boolean;
};

function dateToYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function shortDate(date: Date) {
  return date.toLocaleDateString("es-PY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function fullDate(date: Date) {
  return date.toLocaleDateString("es-PY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function cleanTime(value: string) {
  return value.slice(0, 5);
}

/*
 * Convierte números paraguayos a formato internacional.
 *
 * Ejemplos:
 * 0981 123 456     -> +595981123456
 * 0984-123-456     -> +595984123456
 * +595 981 123456  -> +595981123456
 */
function normalizeParaguayPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  // Formato local: 09XX XXX XXX
  if (/^09\d{8}$/.test(digits)) {
    return `+595${digits.slice(1)}`;
  }

  // Formato internacional sin +
  if (/^5959\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  return "";
}

function isValidParaguayPhone(value: string) {
  const normalized = normalizeParaguayPhone(value);

  return /^\+5959\d{8}$/.test(normalized);
}

function getEndTime(startTime: string) {
  const [hours] = startTime.split(":").map(Number);

  const nextHour = hours + 1;

  return `${String(nextHour).padStart(2, "0")}:00`;
}

export default function BookingForm() {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");

  const [duration, setDuration] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] =
    useState<Date | null>(null);

  const [selectedTime, setSelectedTime] = useState("");

  const [availableTimes, setAvailableTimes] =
    useState<string[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingServices, setLoadingServices] =
    useState(true);

  const [loadingStaff, setLoadingStaff] =
    useState(true);

  const [loadingTimes, setLoadingTimes] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const selectedService = services.find(
    (service) => service.id === serviceId
  );

  const selectedStaff = staff.find(
    (person) => person.id === staffId
  );

  /*
   * Mostramos los próximos 14 días disponibles.
   * Domingo queda fuera.
   */
  const availableDays = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();

    let offset = 0;

    while (days.length < 14) {
      const date = new Date(today);

      date.setHours(12, 0, 0, 0);
      date.setDate(today.getDate() + offset);

      // Domingo = 0
      if (date.getDay() !== 0) {
        days.push(date);
      }

      offset++;
    }

    return days;
  }, []);

  /*
   * CARGAR SERVICIOS
   */
  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);

      const { data, error } = await supabase
        .from("services")
        .select(
          "id, name, category, allowed_durations"
        )
        .eq("active", true)
        .order("category")
        .order("name");

      if (error) {
        console.error(error);

        setErrorMessage(
          "No pudimos cargar los servicios. Intenta nuevamente."
        );
      } else {
        setServices(
          (data ?? []) as Service[]
        );
      }

      setLoadingServices(false);
    }

    loadServices();
  }, []);

  /*
   * CARGAR MASAJISTAS
   */
  useEffect(() => {
    async function loadStaff() {
      setLoadingStaff(true);

      const { data, error } = await supabase
        .from("staff")
        .select("id, name, active")
        .eq("active", true)
        .order("name");

      if (error) {
        console.error(error);

        setErrorMessage(
          "No pudimos cargar las profesionales."
        );
      } else {
        setStaff(
          (data ?? []) as Staff[]
        );
      }

      setLoadingStaff(false);
    }

    loadStaff();
  }, []);

  /*
   * CONSULTAR HORARIOS DISPONIBLES.
   *
   * La disponibilidad depende de:
   * - fecha
   * - masajista
   *
   * No depende de si el masaje dura 30, 45 o 60 min,
   * porque cada reserva bloquea una hora completa.
   */
  useEffect(() => {
    async function loadAvailableTimes() {
      if (!selectedDate || !staffId) {
        setAvailableTimes([]);
        return;
      }

      setLoadingTimes(true);
      setSelectedTime("");
      setErrorMessage("");

      const { data, error } = await supabase.rpc(
        "get_available_slots",
        {
          p_date: dateToYMD(selectedDate),
          p_staff_id: staffId,
        }
      );

      if (error) {
        console.error(error);

        setErrorMessage(
          "No pudimos consultar los horarios disponibles."
        );

        setAvailableTimes([]);
        setLoadingTimes(false);

        return;
      }

      let times = (data ?? []).map(
        (row: { slot_time: string }) =>
          cleanTime(row.slot_time)
      );

      /*
       * Seguridad adicional:
       * solamente mostramos horas completas.
       */
      times = times.filter((time: string) =>
        time.endsWith(":00")
      );

      /*
       * Si el cliente selecciona hoy,
       * ocultamos los horarios que ya pasaron.
       */
      const now = new Date();

      if (sameDay(selectedDate, now)) {
        const currentMinutes =
          now.getHours() * 60 +
          now.getMinutes();

        times = times.filter(
          (time: string) => {
            const [hours, minutes] = time
              .split(":")
              .map(Number);

            const slotMinutes =
              hours * 60 + minutes;

            return slotMinutes >
              currentMinutes;
          }
        );
      }

      setAvailableTimes(times);
      setLoadingTimes(false);
    }

    loadAvailableTimes();
  }, [selectedDate, staffId]);

  function handleServiceChange(id: string) {
    setServiceId(id);

    setDuration(null);
    setStaffId("");
    setSelectedDate(null);
    setSelectedTime("");
    setAvailableTimes([]);

    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleStaffChange(id: string) {
    setStaffId(id);

    setSelectedDate(null);
    setSelectedTime("");
    setAvailableTimes([]);

    setErrorMessage("");
    setSuccessMessage("");
  }

  /*
   * CREAR RESERVA
   */
  async function createReservation() {
    setErrorMessage("");
    setSuccessMessage("");

    /*
     * SERVICIO
     */
    if (!selectedService) {
      setErrorMessage(
        "Debes seleccionar un servicio."
      );

      return;
    }

    /*
     * DURACIÓN
     */
    if (!duration) {
      setErrorMessage(
        "Debes seleccionar la duración del servicio."
      );

      return;
    }

    /*
     * PROFESIONAL
     */
    if (!selectedStaff) {
      setErrorMessage(
        "Debes seleccionar una profesional."
      );

      return;
    }

    /*
     * FECHA
     */
    if (!selectedDate) {
      setErrorMessage(
        "Debes seleccionar un día."
      );

      return;
    }

    /*
     * HORARIO
     */
    if (!selectedTime) {
      setErrorMessage(
        "Debes seleccionar un horario."
      );

      return;
    }

    /*
     * NOMBRE OBLIGATORIO
     */
    if (!name.trim()) {
      setErrorMessage(
        "Debes ingresar tu nombre y apellido."
      );

      return;
    }

    /*
     * WHATSAPP OBLIGATORIO
     */
    if (!phone.trim()) {
      setErrorMessage(
        "Debes ingresar tu número de WhatsApp."
      );

      return;
    }

    /*
     * VALIDAR NÚMERO PARAGUAYO
     */
    if (!isValidParaguayPhone(phone)) {
      setErrorMessage(
        "Ingresa un número de WhatsApp válido de Paraguay. Ejemplo: 0981 123 456 o +595 981 123 456."
      );

      return;
    }

    const normalizedPhone =
      normalizeParaguayPhone(phone);

    setSaving(true);

    const reservedTime = selectedTime;

    /*
     * GUARDAR EN SUPABASE
     */
    const { data, error } =
      await supabase.rpc(
        "create_booking",
        {
          p_customer_name:
            name.trim(),

          p_customer_phone:
            normalizedPhone,

          p_service_id:
            selectedService.id,

          p_staff_id:
            selectedStaff.id,

          p_duration:
            duration,

          p_date:
            dateToYMD(selectedDate),

          p_time:
            `${reservedTime}:00`,

          p_notes:
            notes.trim() || null,
        }
      );

    /*
     * ERROR AL RESERVAR
     */
    if (error) {
      console.error(error);

      const errorText =
        error.message.toLowerCase();

      if (
        errorText.includes("reservado")
      ) {
        setErrorMessage(
          "Ese horario acaba de ser reservado con esta profesional. Elige otro horario."
        );
      } else if (
        errorText.includes("disponible")
      ) {
        setErrorMessage(
          "Ese horario ya no está disponible. Elige otro."
        );
      } else if (
        errorText.includes("whatsapp")
      ) {
        setErrorMessage(
          "Debes ingresar un número de WhatsApp válido de Paraguay."
        );
      } else {
        setErrorMessage(
          error.message
        );
      }

      setSaving(false);
      setSelectedTime("");

      /*
       * Actualizamos la disponibilidad.
       */
      const { data: refreshed } =
        await supabase.rpc(
          "get_available_slots",
          {
            p_date:
              dateToYMD(selectedDate),

            p_staff_id:
              selectedStaff.id,
          }
        );

      if (refreshed) {
        setAvailableTimes(
          refreshed
            .map(
              (
                row: {
                  slot_time: string;
                }
              ) =>
                cleanTime(
                  row.slot_time
                )
            )
            .filter(
              (time: string) =>
                time.endsWith(":00")
            )
        );
      }

      return;
    }

    const bookingId =
      data as string;

    /*
     * ACTUALIZAMOS HORARIOS.
     *
     * Aunque el masaje sea de 30 o 45 minutos,
     * la hora completa queda ocupada para esa profesional.
     */
    const { data: refreshed } =
      await supabase.rpc(
        "get_available_slots",
        {
          p_date:
            dateToYMD(selectedDate),

          p_staff_id:
            selectedStaff.id,
        }
      );

    if (refreshed) {
      setAvailableTimes(
        refreshed
          .map(
            (
              row: {
                slot_time: string;
              }
            ) =>
              cleanTime(
                row.slot_time
              )
          )
          .filter(
            (time: string) =>
              time.endsWith(":00")
          )
      );
    } else {
      setAvailableTimes(
        (current) =>
          current.filter(
            (time) =>
              time !== reservedTime
          )
      );
    }

    /*
     * MENSAJE DE CONFIRMACIÓN
     */
    setSuccessMessage(
      `Tu turno fue reservado correctamente con ${selectedStaff.name} para las ${reservedTime}. Código de reserva: ${bookingId.slice(
        0,
        8
      )}.`
    );

    /*
     * LIMPIAR DATOS PERSONALES.
     *
     * Dejamos servicio, duración, profesional
     * y fecha seleccionados por comodidad.
     */
    setName("");
    setPhone("");
    setNotes("");
    setSelectedTime("");

    setSaving(false);
  }

  const complete =
    selectedService &&
    duration &&
    selectedStaff &&
    selectedDate &&
    selectedTime &&
    name.trim() &&
    phone.trim();

  return (
    <section
      id="reservar"
      className="bg-[#e8d7cc] px-6 py-24"
    >
      <div className="mx-auto max-w-5xl">

        {/* TÍTULO */}
        <div className="mx-auto mb-12 max-w-2xl text-center">

          <p className="text-sm uppercase tracking-[0.35em] text-[#765648]">
            Reserva online
          </p>

          <h2 className="mt-4 text-4xl font-light md:text-5xl">
            Reserva tu momento en Mistica Spa
          </h2>

          <p className="mt-5 leading-7 text-[#675954]">
            Selecciona el servicio,
            la duración, la profesional,
            el día y el horario que prefieras.
          </p>

        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10">

          {/* ÉXITO */}
          {successMessage && (
            <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">

              <p className="font-medium">
                Reserva confirmada
              </p>

              <p className="mt-2 text-sm">
                {successMessage}
              </p>

              <p className="mt-2 text-sm">
                Tu turno ya aparece en la agenda
                de Mistica Spa.
              </p>

            </div>
          )}

          {/* ERROR */}
          {errorMessage && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* 1. SERVICIO */}
          <div>

            <p className="mb-4 text-lg font-medium">
              1. Elige tu servicio
            </p>

            <select
              value={serviceId}
              disabled={loadingServices}
              onChange={(event) =>
                handleServiceChange(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-[#dfd2c7] bg-white px-4 py-4 outline-none focus:border-[#765648] disabled:opacity-50"
            >

              <option value="">
                {loadingServices
                  ? "Cargando servicios..."
                  : "Selecciona un servicio"}
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

          </div>

          {/* 2. DURACIÓN */}
          {selectedService && (
            <div className="mt-10">

              <p className="mb-4 text-lg font-medium">
                2. Elige la duración
              </p>

              <div className="grid grid-cols-3 gap-3">

                {selectedService
                  .allowed_durations
                  .slice()
                  .sort(
                    (a, b) =>
                      a - b
                  )
                  .map(
                    (minutes) => (

                      <button
                        key={minutes}
                        type="button"
                        onClick={() => {
                          setDuration(
                            minutes
                          );

                          setStaffId("");
                          setSelectedDate(
                            null
                          );
                          setSelectedTime(
                            ""
                          );

                          setSuccessMessage(
                            ""
                          );
                        }}
                        className={`rounded-xl border px-4 py-4 transition ${
                          duration ===
                          minutes
                            ? "border-[#765648] bg-[#765648] text-white"
                            : "border-[#dfd2c7] bg-white hover:border-[#765648]"
                        }`}
                      >
                        {minutes} min
                      </button>

                    )
                  )}

              </div>

              <p className="mt-3 text-sm text-[#756762]">
                Independientemente de la duración,
                cada turno ocupa un bloque de una hora
                en la agenda.
              </p>

            </div>
          )}

          {/* 3. PROFESIONAL */}
          {duration && (
            <div className="mt-10">

              <p className="mb-4 text-lg font-medium">
                3. Elige tu profesional
              </p>

              {loadingStaff ? (

                <div className="rounded-xl bg-[#f8f4ef] p-5 text-center text-sm text-[#756762]">
                  Cargando profesionales...
                </div>

              ) : (

                <div className="grid gap-3 md:grid-cols-2">

                  {staff.map(
                    (person) => (

                      <button
                        key={person.id}
                        type="button"
                        onClick={() =>
                          handleStaffChange(
                            person.id
                          )
                        }
                        className={`rounded-xl border px-5 py-5 text-left transition ${
                          staffId ===
                          person.id
                            ? "border-[#765648] bg-[#765648] text-white"
                            : "border-[#dfd2c7] bg-white hover:border-[#765648]"
                        }`}
                      >
                        <span className="block font-medium">
                          {person.name}
                        </span>

                        <span
                          className={`mt-1 block text-sm ${
                            staffId ===
                            person.id
                              ? "text-white/80"
                              : "text-[#756762]"
                          }`}
                        >
                          Masajista
                        </span>

                      </button>

                    )
                  )}

                </div>
              )}

            </div>
          )}

          {/* 4. DÍA */}
          {selectedStaff && (
            <div className="mt-10">

              <p className="mb-4 text-lg font-medium">
                4. Elige el día
              </p>

              <div className="flex gap-3 overflow-x-auto pb-3">

                {availableDays.map(
                  (date) => {
                    const active =
                      selectedDate &&
                      sameDay(
                        selectedDate,
                        date
                      );

                    return (
                      <button
                        key={dateToYMD(
                          date
                        )}
                        type="button"
                        onClick={() => {
                          setSelectedDate(
                            date
                          );

                          setSelectedTime(
                            ""
                          );

                          setSuccessMessage(
                            ""
                          );
                        }}
                        className={`min-w-[110px] rounded-xl border px-4 py-4 text-center transition ${
                          active
                            ? "border-[#765648] bg-[#765648] text-white"
                            : "border-[#dfd2c7] bg-[#fbf8f5]"
                        }`}
                      >
                        <span className="block capitalize">
                          {shortDate(
                            date
                          )}
                        </span>
                      </button>
                    );
                  }
                )}

              </div>

            </div>
          )}

          {/* 5. HORARIO */}
          {selectedDate &&
            selectedStaff && (
              <div className="mt-10">

                <p className="mb-2 text-lg font-medium">
                  5. Elige tu horario
                </p>

                <p className="mb-2 text-sm capitalize text-[#756762]">
                  {fullDate(
                    selectedDate
                  )}
                </p>

                <p className="mb-5 text-sm text-[#756762]">
                  Profesional:{" "}
                  {selectedStaff.name}
                </p>

                {loadingTimes ? (

                  <div className="rounded-xl bg-[#f8f4ef] p-6 text-center text-[#756762]">
                    Consultando horarios disponibles...
                  </div>

                ) : availableTimes.length >
                  0 ? (

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">

                    {availableTimes.map(
                      (time) => (

                        <button
                          key={time}
                          type="button"
                          onClick={() => {
                            setSelectedTime(
                              time
                            );

                            setSuccessMessage(
                              ""
                            );

                            setErrorMessage(
                              ""
                            );
                          }}
                          className={`rounded-xl border px-3 py-3 text-sm transition ${
                            selectedTime ===
                            time
                              ? "border-[#765648] bg-[#765648] text-white"
                              : "border-[#dfd2c7] hover:border-[#765648]"
                          }`}
                        >
                          {time}
                        </button>

                      )
                    )}

                  </div>

                ) : (

                  <div className="rounded-xl bg-[#f8f4ef] p-6 text-center text-[#756762]">

                    <p>
                      No quedan horarios disponibles
                      con{" "}
                      {selectedStaff.name}{" "}
                      para este día.
                    </p>

                    <p className="mt-2 text-sm">
                      Puedes elegir otra profesional
                      o seleccionar otro día.
                    </p>

                  </div>

                )}

              </div>
            )}

          {/* 6. DATOS */}
          {selectedTime && (
            <div className="mt-10">

              <p className="mb-2 text-lg font-medium">
                6. Tus datos
              </p>

              <p className="mb-5 text-sm text-[#756762]">
                Los campos marcados con * son obligatorios.
              </p>

              <div className="grid gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Nombre y apellido *
                  </label>

                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Ej: María González"
                    value={name}
                    onChange={(
                      event
                    ) =>
                      setName(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Número de WhatsApp *
                  </label>

                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="09XX XXX XXX o +595 9XX XXX XXX"
                    value={phone}
                    onChange={(
                      event
                    ) =>
                      setPhone(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
                  />

                  <p className="mt-2 text-xs text-[#756762]">
                    Ejemplo: 0981 123 456
                    o +595 981 123 456
                  </p>

                </div>

              </div>

              <textarea
                placeholder="Observación opcional"
                value={notes}
                onChange={(
                  event
                ) =>
                  setNotes(
                    event.target.value
                  )
                }
                rows={3}
                className="mt-5 w-full resize-none rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
              />

              {/* RESUMEN */}
              <div className="mt-8 rounded-2xl bg-[#f8f4ef] p-6">

                <p className="font-medium">
                  Resumen de tu reserva
                </p>

                <div className="mt-4 space-y-2 text-sm text-[#675954]">

                  <p>
                    Servicio:{" "}
                    {selectedService?.name}
                  </p>

                  <p>
                    Duración del masaje:{" "}
                    {duration} minutos
                  </p>

                  <p>
                    Profesional:{" "}
                    {selectedStaff?.name}
                  </p>

                  <p className="capitalize">
                    Fecha:{" "}
                    {selectedDate &&
                      fullDate(
                        selectedDate
                      )}
                  </p>

                  <p>
                    Hora de inicio:{" "}
                    {selectedTime}
                  </p>

                  <p>
                    Bloque reservado:{" "}
                    {selectedTime} -{" "}
                    {getEndTime(
                      selectedTime
                    )}
                  </p>

                </div>

                {duration &&
                  duration < 60 && (
                    <p className="mt-4 text-xs leading-5 text-[#756762]">
                      El servicio dura{" "}
                      {duration} minutos,
                      pero el horario se reserva
                      durante una hora completa
                      para brindar margen entre
                      sesiones.
                    </p>
                  )}

              </div>

              <button
                type="button"
                disabled={
                  !complete ||
                  saving
                }
                onClick={
                  createReservation
                }
                className="mt-6 w-full rounded-full bg-[#765648] px-7 py-4 font-medium text-white transition hover:bg-[#5f4439] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? "Guardando reserva..."
                  : "Confirmar reserva"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-[#756762]">
                Al confirmar, tu turno quedará
                registrado automáticamente en la
                agenda de Mistica Spa.
              </p>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}