"use client";

import { useMemo, useState } from "react";

const servicios = [
  "Masaje terapéutico",
  "Masaje descontracturante",
  "Masaje deportivo",
  "Masaje relajante",
  "Masaje reductor",
  "Shiatsu",
  "Drenaje linfático",
  "Limpieza facial express",
  "Limpieza facial profunda",
  "Sauna seca",
  "Manicura",
  "Pedicura",
  "Masaje reductor moldeador de cintura de avispa",
  "Masaje postoperatorio de recuperación",
  "Tratamiento anticelulítico",
  "Levantamiento de glúteo",
  "Liberación miofascial craneal",
  "Terapia para bruxismo y ATM",
  "Baño de luna",
];

const duraciones = [30, 45, 60];

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-PY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function fechaCompleta(fecha: Date) {
  return fecha.toLocaleDateString("es-PY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function generarHorarios(duracion: number) {
  const horarios: string[] = [];

  const apertura = 8 * 60;
  const cierre = 20 * 60;

  for (
    let minutos = apertura;
    minutos + duracion <= cierre;
    minutos += 15
  ) {
    const hora = Math.floor(minutos / 60);
    const min = minutos % 60;

    horarios.push(
      `${String(hora).padStart(2, "0")}:${String(min).padStart(2, "0")}`
    );
  }

  return horarios;
}

export default function BookingForm() {
  const [servicio, setServicio] = useState("");
  const [duracion, setDuracion] = useState<number | null>(null);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [observacion, setObservacion] = useState("");

  const diasDisponibles = useMemo(() => {
    const dias: Date[] = [];
    const hoy = new Date();

    let contador = 0;

    while (dias.length < 14) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + contador);

      if (fecha.getDay() !== 0) {
        dias.push(fecha);
      }

      contador++;
    }

    return dias;
  }, []);

  const horarios = duracion ? generarHorarios(duracion) : [];

  function solicitarTurno() {
    if (
      !servicio ||
      !duracion ||
      !fecha ||
      !hora ||
      !nombre ||
      !telefono
    ) {
      return;
    }

    const mensaje = `
Hola Mistica Spa.

Quisiera solicitar un turno.

Servicio: ${servicio}
Duración: ${duracion} minutos
Fecha: ${fechaCompleta(fecha)}
Hora: ${hora}

Nombre: ${nombre}
WhatsApp: ${telefono}

Observación: ${observacion || "Sin observaciones"}
    `.trim();

    const url = `https://wa.me/595981490443?text=${encodeURIComponent(
      mensaje
    )}`;

    window.open(url, "_blank");
  }

  const completo =
    servicio &&
    duracion &&
    fecha &&
    hora &&
    nombre.trim() &&
    telefono.trim();

  return (
    <section id="reservar" className="bg-[#e8d7cc] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-[#765648]">
            Reserva online
          </p>

          <h2 className="mt-4 text-4xl font-light md:text-5xl">
            Reserva tu momento en Mistica Spa
          </h2>

          <p className="mt-5 leading-7 text-[#675954]">
            Selecciona el servicio, la duración y el horario que prefieras.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10">

          {/* SERVICIO */}
          <div>
            <p className="mb-4 text-lg font-medium">
              1. Elige tu servicio
            </p>

            <select
              value={servicio}
              onChange={(e) => {
                setServicio(e.target.value);
                setHora("");
              }}
              className="w-full rounded-xl border border-[#dfd2c7] bg-white px-4 py-4 outline-none focus:border-[#765648]"
            >
              <option value="">
                Selecciona un servicio
              </option>

              {servicios.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* DURACIÓN */}
          <div className="mt-10">
            <p className="mb-4 text-lg font-medium">
              2. Elige la duración
            </p>

            <div className="grid grid-cols-3 gap-3">
              {duraciones.map((minutos) => (
                <button
                  key={minutos}
                  type="button"
                  onClick={() => {
                    setDuracion(minutos);
                    setHora("");
                  }}
                  className={`rounded-xl border px-4 py-4 transition ${
                    duracion === minutos
                      ? "border-[#765648] bg-[#765648] text-white"
                      : "border-[#dfd2c7] bg-white hover:border-[#765648]"
                  }`}
                >
                  {minutos} min
                </button>
              ))}
            </div>
          </div>

          {/* FECHA */}
          <div className="mt-10">
            <p className="mb-4 text-lg font-medium">
              3. Elige el día
            </p>

            <div className="flex gap-3 overflow-x-auto pb-3">
              {diasDisponibles.map((dia) => {
                const seleccionado =
                  fecha?.toDateString() === dia.toDateString();

                return (
                  <button
                    key={dia.toISOString()}
                    type="button"
                    onClick={() => {
                      setFecha(dia);
                      setHora("");
                    }}
                    className={`min-w-[110px] rounded-xl border px-4 py-4 text-center transition ${
                      seleccionado
                        ? "border-[#765648] bg-[#765648] text-white"
                        : "border-[#dfd2c7] bg-[#fbf8f5]"
                    }`}
                  >
                    <span className="block capitalize">
                      {formatearFecha(dia)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HORARIOS */}
          {fecha && duracion && (
            <div className="mt-10">
              <p className="mb-2 text-lg font-medium">
                4. Elige tu horario
              </p>

              <p className="mb-5 text-sm text-[#756762]">
                {fechaCompleta(fecha)}
              </p>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {horarios.map((horario) => (
                  <button
                    key={horario}
                    type="button"
                    onClick={() => setHora(horario)}
                    className={`rounded-xl border px-3 py-3 text-sm transition ${
                      hora === horario
                        ? "border-[#765648] bg-[#765648] text-white"
                        : "border-[#dfd2c7] hover:border-[#765648]"
                    }`}
                  >
                    {horario}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DATOS */}
          {hora && (
            <div className="mt-10">
              <p className="mb-5 text-lg font-medium">
                5. Tus datos
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nombre y apellido"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
                />

                <input
                  type="tel"
                  placeholder="Número de WhatsApp"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
                />
              </div>

              <textarea
                placeholder="Observación opcional"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={3}
                className="mt-4 w-full resize-none rounded-xl border border-[#dfd2c7] px-4 py-4 outline-none focus:border-[#765648]"
              />

              {/* RESUMEN */}
              <div className="mt-8 rounded-2xl bg-[#f8f4ef] p-6">
                <p className="font-medium">
                  Resumen de tu solicitud
                </p>

                <div className="mt-4 space-y-2 text-sm text-[#675954]">
                  <p>Servicio: {servicio}</p>
                  <p>Duración: {duracion} minutos</p>
                  <p>Fecha: {fecha && fechaCompleta(fecha)}</p>
                  <p>Hora: {hora}</p>
                </div>
              </div>

              <button
                type="button"
                disabled={!completo}
                onClick={solicitarTurno}
                className="mt-6 w-full rounded-full bg-[#765648] px-7 py-4 font-medium text-white transition hover:bg-[#5f4439] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Solicitar turno por WhatsApp
              </button>

              <p className="mt-4 text-center text-xs text-[#756762]">
                En la siguiente etapa la reserva quedará confirmada
                automáticamente en nuestro calendario.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}