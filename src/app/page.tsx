import BookingForm from "@/app/components/BookingForm";

const servicios = [
  {
    categoria: "Masajes y terapias",
    items: [
      "Masaje terapéutico",
      "Masaje descontracturante",
      "Masaje deportivo",
      "Masaje relajante",
      "Masaje reductor",
      "Shiatsu",
      "Drenaje linfático",
      "Liberación miofascial craneal",
      "Terapia para bruxismo y ATM",
    ],
  },
  {
    categoria: "Tratamientos corporales",
    items: [
      "Masaje reductor moldeador de cintura de avispa",
      "Masaje postoperatorio de recuperación",
      "Tratamiento anticelulítico",
      "Levantamiento de glúteo",
      "Baño de luna",
    ],
  },
  {
    categoria: "Faciales",
    items: [
      "Limpieza facial express",
      "Limpieza facial profunda",
    ],
  },
  {
    categoria: "Belleza y bienestar",
    items: [
      "Sauna seca",
      "Manicura",
      "Pedicura",
    ],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#332a27]">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#dfd2c7] bg-[#f8f4ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <a
            href="#inicio"
            className="text-2xl font-semibold tracking-[0.18em]"
          >
            MISTICA
            <span className="ml-2 text-sm font-normal tracking-[0.3em] text-[#9c7968]">
              SPA
            </span>
          </a>

          <nav className="hidden gap-8 text-sm md:flex">
            <a
              href="#inicio"
              className="transition hover:text-[#9c7968]"
            >
              Inicio
            </a>

            <a
              href="#servicios"
              className="transition hover:text-[#9c7968]"
            >
              Servicios
            </a>

            <a
              href="#horarios"
              className="transition hover:text-[#9c7968]"
            >
              Horarios
            </a>

            <a
              href="#contacto"
              className="transition hover:text-[#9c7968]"
            >
              Contacto
            </a>
          </nav>

          <a
            href="#reservar"
            className="rounded-full bg-[#765648] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#5f4439]"
          >
            Reservar turno
          </a>

        </div>
      </header>

      {/* INICIO */}
      <section
        id="inicio"
        className="relative overflow-hidden px-6 py-24 md:py-36"
      >
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#e8d7cc] blur-3xl" />
        <div className="absolute -bottom-48 -left-20 h-96 w-96 rounded-full bg-[#ded8c8] blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 md:grid-cols-2">

          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.35em] text-[#9c7968]">
              Bienestar · Belleza · Relajación
            </p>

            <h1 className="max-w-xl text-5xl font-light leading-tight md:text-7xl">
              Tu momento de
              <span className="block font-medium italic text-[#765648]">
                bienestar
              </span>
              comienza aquí.
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-8 text-[#756762]">
              Un espacio dedicado al cuidado personal, la relajación y
              tratamientos pensados para ayudarte a sentirte mejor.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              <a
                href="#reservar"
                className="rounded-full bg-[#765648] px-7 py-4 font-medium text-white transition hover:bg-[#5f4439]"
              >
                Reservar mi turno
              </a>

              <a
                href="https://wa.me/595981490443"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#765648] px-7 py-4 font-medium text-[#765648] transition hover:bg-[#765648] hover:text-white"
              >
                WhatsApp
              </a>

            </div>
          </div>

          <div className="relative mx-auto flex h-[450px] w-full max-w-md items-center justify-center rounded-[4rem_1rem_4rem_1rem] bg-[#d8c3b7] shadow-2xl">

            <div className="absolute inset-5 rounded-[3.4rem_0.8rem_3.4rem_0.8rem] border border-white/50" />

            <div className="text-center text-[#654a40]">

              <p className="text-sm uppercase tracking-[0.4em]">
                Mistica
              </p>

              <p className="mt-3 text-6xl font-light">
                SPA
              </p>

              <div className="mx-auto my-7 h-px w-20 bg-[#765648]" />

              <p className="text-sm tracking-widest">
                RELÁJATE · RENUEVA · DISFRUTA
              </p>

            </div>
          </div>

        </div>
      </section>

      {/* SERVICIOS */}
      <section
        id="servicios"
        className="bg-white px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mx-auto mb-14 max-w-2xl text-center">

            <p className="text-sm uppercase tracking-[0.35em] text-[#9c7968]">
              Nuestros servicios
            </p>

            <h2 className="mt-4 text-4xl font-light md:text-5xl">
              Encuentra el tratamiento ideal para ti
            </h2>

            <p className="mt-5 leading-7 text-[#756762]">
              Puedes elegir sesiones de 30, 45 o 60 minutos según el servicio.
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {servicios.map((grupo) => (
              <article
                key={grupo.categoria}
                className="rounded-3xl border border-[#eadfd7] bg-[#fbf8f5] p-8 transition hover:-translate-y-1 hover:shadow-xl"
              >

                <h3 className="mb-6 text-2xl font-medium text-[#765648]">
                  {grupo.categoria}
                </h3>

                <div className="space-y-4">

                  {grupo.items.map((servicio) => (
                    <div
                      key={servicio}
                      className="flex items-center justify-between border-b border-[#eadfd7] pb-4"
                    >

                      <span>
                        {servicio}
                      </span>

                      <a
                        href="#reservar"
                        className="ml-5 whitespace-nowrap text-sm font-medium text-[#9c7968] hover:text-[#765648]"
                      >
                        Reservar
                      </a>

                    </div>
                  ))}

                </div>

              </article>
            ))}

          </div>

        </div>
      </section>

      {/* HORARIOS */}
      <section
        id="horarios"
        className="px-6 py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-12 rounded-[2.5rem] bg-[#765648] px-8 py-14 text-white md:grid-cols-2 md:px-16">

          <div>

            <p className="text-sm uppercase tracking-[0.35em] text-[#e8d7cc]">
              Horarios
            </p>

            <h2 className="mt-4 text-4xl font-light">
              Reserva el momento que mejor se adapte a ti
            </h2>

            <p className="mt-5 max-w-lg leading-7 text-[#eadfd7]">
              Nuestro calendario mostrará los días y horarios disponibles
              para que puedas elegir tu turno.
            </p>

          </div>

          <div className="flex flex-col justify-center rounded-3xl bg-white/10 p-8 backdrop-blur">

            <div className="flex justify-between border-b border-white/20 py-4">
              <span>
                Lunes a sábado
              </span>

              <strong>
                08:00 - 20:00
              </strong>
            </div>

            <div className="flex justify-between py-4">
              <span>
                Domingo
              </span>

              <strong>
                Cerrado
              </strong>
            </div>

          </div>

        </div>
      </section>

      {/* FORMULARIO REAL DE RESERVAS */}
      <BookingForm />

      {/* CONTACTO */}
      <section
        id="contacto"
        className="bg-white px-6 py-24"
      >
        <div className="mx-auto max-w-6xl">

          <div className="grid gap-12 md:grid-cols-2">

            <div>

              <p className="text-sm uppercase tracking-[0.35em] text-[#9c7968]">
                Contacto
              </p>

              <h2 className="mt-4 text-4xl font-light">
                Mistica Spa
              </h2>

              <div className="mt-8 space-y-4 text-[#675954]">

                <p>
                  Quirino Codas Thompson, San Lorenzo
                </p>

                <p>
                  0981 490443
                </p>

                <p>
                  Lunes a sábado · 08:00 a 20:00
                </p>

              </div>

              <div className="mt-9 flex flex-wrap gap-4">

                <a
                  href="https://wa.me/595981490443"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#765648] px-6 py-3 text-white transition hover:bg-[#5f4439]"
                >
                  Escribir por WhatsApp
                </a>

                <a
                  href="https://g.page/r/CYShAR7rfMcqEBM/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[#765648] px-6 py-3 text-[#765648] transition hover:bg-[#765648] hover:text-white"
                >
                  Dejar una reseña
                </a>

              </div>

            </div>

            <div className="rounded-3xl bg-[#f8f4ef] p-10">

              <p className="text-sm uppercase tracking-[0.3em] text-[#9c7968]">
                Google
              </p>

              <p className="mt-5 text-5xl font-light">
                4.9
              </p>

              <p className="mt-2 text-xl tracking-widest text-[#9c7968]">
                ★★★★★
              </p>

              <p className="mt-4 text-[#756762]">
                Valoración actual de Mistica Spa en Google.
              </p>

              <a
                href="https://g.page/r/CYShAR7rfMcqEBM/review"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-block font-medium text-[#765648] underline underline-offset-4"
              >
                Compartir mi experiencia
              </a>

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#332a27] px-6 py-10 text-center text-sm text-[#d6c7bf]">

        <p className="text-lg tracking-[0.25em] text-white">
          MISTICA SPA
        </p>

        <p className="mt-3">
          Bienestar y cuidado personal
        </p>

      </footer>

    </main>
  );
}