"use client";

import { useEffect, useState } from "react";
import BookingForm from "@/app/components/BookingForm";
import { supabase } from "@/app/lib/supabase";

type ServiceItem = {
  nombre: string;
  descripcion: string;
};

type ServiceGroup = {
  categoria: string;
  color: string;
  text: string;
  decoracion: "lily" | "calla" | "lavender" | "olive";
  items: ServiceItem[];
};


type Promotion = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  details: string | null;
  badge: string | null;
  normal_price: number | null;
  promo_price: number | null;
  start_date: string | null;
  end_date: string | null;
  whatsapp_message: string | null;
  active: boolean;
  sort_order: number;
};

const servicios: ServiceGroup[] = [
  {
    categoria: "Masajes y terapias",
    color: "from-[#4A2356] to-[#633A78]",
    text: "text-white",
    decoracion: "lily",
    items: [
      {
        nombre: "Masaje terapéutico",
        descripcion:
          "Ideal para aliviar tensión muscular, molestias por sobrecarga y recuperar una sensación de bienestar corporal.",
      },
      {
        nombre: "Masaje descontracturante",
        descripcion:
          "Trabaja zonas rígidas y contracturadas. Recomendado para espalda, cuello y hombros cargados.",
      },
      {
        nombre: "Masaje relajante",
        descripcion:
          "Movimientos suaves que favorecen la relajación, disminuyen la tensión y ayudan a desconectarse del estrés diario.",
      },
      {
        nombre: "Masaje deportivo",
        descripcion:
          "Pensado para músculos exigidos por actividad física. Ayuda a reducir tensión y mejorar la sensación de recuperación.",
      },
      {
        nombre: "Masaje reductor",
        descripcion:
          "Masaje corporal intenso enfocado en zonas específicas y acompañado de técnicas de modelado.",
      },
      {
        nombre: "Shiatsu",
        descripcion:
          "Técnica de presión manual sobre distintos puntos del cuerpo, orientada a generar relajación y equilibrio corporal.",
      },
      {
        nombre: "Drenaje linfático",
        descripcion:
          "Técnica suave que favorece el movimiento de líquidos y brinda sensación de ligereza.",
      },
      {
        nombre: "Liberación miofascial craneal",
        descripcion:
          "Trabajo suave sobre cabeza, cuello y tejidos asociados, ideal para disminuir sensación de tensión acumulada.",
      },
      {
        nombre: "Terapia para bruxismo y ATM",
        descripcion:
          "Trabajo manual en mandíbula, rostro y zonas cercanas para ayudar a relajar la musculatura sometida a tensión.",
      },
    ],
  },
  {
    categoria: "Tratamientos corporales",
    color: "from-[#CDB3D9] to-[#E1CFE7]",
    text: "text-[#3B174D]",
    decoracion: "calla",
    items: [
      {
        nombre: "Masaje reductor moldeador de cintura de avispa",
        descripcion:
          "Técnicas manuales enfocadas en cintura y abdomen para acompañar tratamientos de modelado corporal.",
      },
      {
        nombre: "Masaje postoperatorio de recuperación",
        descripcion:
          "Sesión de acompañamiento corporal orientada al bienestar durante procesos de recuperación, según indicación profesional.",
      },
      {
        nombre: "Tratamiento anticelulítico",
        descripcion:
          "Combina maniobras corporales enfocadas en mejorar la apariencia y textura de zonas con celulitis.",
      },
      {
        nombre: "Levantamiento de glúteo",
        descripcion:
          "Tratamiento corporal enfocado en glúteos mediante técnicas manuales de estimulación y modelado.",
      },
      {
        nombre: "Baño de luna",
        descripcion:
          "Tratamiento estético para iluminar la apariencia de la piel y aclarar visualmente el vello corporal.",
      },
    ],
  },
  {
    categoria: "Faciales",
    color: "from-[#E9E0EF] to-[#F5EFF7]",
    text: "text-[#4A2356]",
    decoracion: "lavender",
    items: [
      {
        nombre: "Limpieza facial express",
        descripcion:
          "Opción rápida para limpiar, refrescar y devolver una apariencia más cuidada al rostro.",
      },
      {
        nombre: "Limpieza facial profunda",
        descripcion:
          "Limpieza más completa para retirar impurezas y dejar la piel con una sensación fresca y renovada.",
      },
    ],
  },
  {
    categoria: "Belleza y bienestar",
    color: "from-[#DDE1CF] to-[#BAC59D]",
    text: "text-[#39401F]",
    decoracion: "olive",
    items: [
      {
        nombre: "Sauna seca",
        descripcion:
          "Una pausa de calor y relajación ideal para descansar, desconectarse y liberar sensación de tensión corporal.",
      },
      {
        nombre: "Manicura",
        descripcion:
          "Cuidado de manos y uñas para mantenerlas prolijas, limpias y con una presentación cuidada.",
      },
      {
        nombre: "Pedicura",
        descripcion:
          "Cuidado estético de pies y uñas que aporta limpieza, comodidad y una apariencia renovada.",
      },
    ],
  },
];

function LotusIcon() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 40C16 35 12 28 13 20C20 22 24 27 24 34"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M24 40C32 35 36 28 35 20C28 22 24 27 24 34"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M24 34C17 27 18 18 24 10C30 18 31 27 24 34Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M13 27C8 26 5 23 3 19C10 18 15 20 18 24"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M35 27C40 26 43 23 45 19C38 18 33 20 30 24"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LilyFlower({ className = "" }: { className?: string }) {
  return (
    <div className={`botanical ${className}`}>
      <svg width="245" height="270" viewBox="0 0 245 270" fill="none">
        <path
          d="M118 263C115 211 118 169 129 119"
          stroke="#6D7C3D"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M123 194C90 177 67 157 56 131"
          stroke="#6D7C3D"
          strokeWidth="3"
        />
        <path
          d="M126 214C154 190 177 171 188 142"
          stroke="#6D7C3D"
          strokeWidth="3"
        />

        <ellipse
          cx="59"
          cy="132"
          rx="36"
          ry="12"
          transform="rotate(34 59 132)"
          fill="#8DA249"
          opacity=".95"
          className="leaf-animated"
        />

        <ellipse
          cx="187"
          cy="141"
          rx="34"
          ry="12"
          transform="rotate(-34 187 141)"
          fill="#A9B57E"
          opacity=".9"
          className="leaf-animated"
        />

        <g className="flower-bloom">
          <ellipse
            cx="129"
            cy="91"
            rx="24"
            ry="50"
            transform="rotate(-5 129 91)"
            fill="#F1E9F4"
          />
          <ellipse
            cx="101"
            cy="98"
            rx="23"
            ry="46"
            transform="rotate(-42 101 98)"
            fill="#A675B6"
          />
          <ellipse
            cx="158"
            cy="98"
            rx="23"
            ry="46"
            transform="rotate(42 158 98)"
            fill="#754486"
          />
          <ellipse
            cx="112"
            cy="118"
            rx="20"
            ry="40"
            transform="rotate(-23 112 118)"
            fill="#D8C3E0"
          />
          <ellipse
            cx="148"
            cy="118"
            rx="20"
            ry="40"
            transform="rotate(23 148 118)"
            fill="#C29BD0"
          />
          <circle cx="130" cy="111" r="8" fill="#EBCB6A" />
        </g>
      </svg>
    </div>
  );
}

function CallaFlower({ className = "" }: { className?: string }) {
  return (
    <div className={`botanical ${className}`}>
      <svg width="185" height="250" viewBox="0 0 185 250" fill="none">
        <path
          d="M91 244C91 193 94 146 103 94"
          stroke="#64752F"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M98 177C68 161 51 142 40 118"
          stroke="#64752F"
          strokeWidth="3"
        />

        <ellipse
          cx="42"
          cy="118"
          rx="29"
          ry="10"
          transform="rotate(37 42 118)"
          fill="#8DA249"
          opacity=".9"
          className="leaf-animated"
        />

        <g className="flower-bloom">
          <path
            d="M103 94C74 76 75 41 106 24C132 45 133 78 103 94Z"
            fill="#EEE2F2"
          />
          <path
            d="M103 93C100 63 111 44 128 36C143 65 130 87 103 93Z"
            fill="#815799"
          />
          <ellipse
            cx="106"
            cy="75"
            rx="5"
            ry="20"
            fill="#EDCA6A"
            transform="rotate(7 106 75)"
          />
        </g>
      </svg>
    </div>
  );
}

function LavenderBranch({ className = "" }: { className?: string }) {
  return (
    <div className={`botanical ${className}`}>
      <svg width="150" height="245" viewBox="0 0 150 245" fill="none">
        <path
          d="M62 239C69 189 79 132 87 47"
          stroke="#66753E"
          strokeWidth="3"
        />

        {[61, 84, 107, 130, 153].map((y, index) => (
          <g
            key={y}
            className="lavender-petal"
            style={{
              animationDelay: `${index * 0.18}s`,
            }}
          >
            <ellipse
              cx={76}
              cy={y}
              rx="14"
              ry="24"
              transform={`rotate(-36 76 ${y})`}
              fill={index % 2 === 0 ? "#815799" : "#CDB3D9"}
            />

            <ellipse
              cx={99}
              cy={y + 5}
              rx="12"
              ry="21"
              transform={`rotate(36 99 ${y + 5})`}
              fill="#633A78"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function OliveBranch({ className = "" }: { className?: string }) {
  const leaves = [
    [73, 193, -38],
    [101, 172, 32],
    [85, 150, -38],
    [113, 128, 32],
    [97, 105, -35],
    [126, 83, 32],
    [114, 59, -28],
  ];

  return (
    <div className={`botanical ${className}`}>
      <svg width="155" height="230" viewBox="0 0 155 230" fill="none">
        <path
          d="M59 223C80 178 103 130 132 37"
          stroke="#64752F"
          strokeWidth="3"
        />

        {leaves.map(([x, y, rotate], index) => (
          <ellipse
            key={index}
            cx={x}
            cy={y}
            rx="25"
            ry="9"
            transform={`rotate(${rotate} ${x} ${y})`}
            fill={index % 2 === 0 ? "#879D49" : "#A7B38A"}
            opacity=".93"
            className="leaf-animated"
          />
        ))}
      </svg>
    </div>
  );
}

function PetalCluster({ className = "" }: { className?: string }) {
  return (
    <div className={`botanical h-32 w-32 ${className}`}>
      <span className="petal petal-1" />
      <span className="petal petal-2" />
      <span className="petal petal-3" />
    </div>
  );
}

function Decoration({
  type,
}: {
  type: "lily" | "calla" | "lavender" | "olive";
}) {
  if (type === "lily") {
    return (
      <LilyFlower className="bottom-[-22px] right-[2%] z-[1] scale-[0.92] opacity-95" />
    );
  }

  if (type === "calla") {
    return (
      <CallaFlower className="bottom-[-18px] right-[4%] z-[1] scale-[0.9] opacity-95" />
    );
  }

  if (type === "lavender") {
    return (
      <LavenderBranch className="bottom-[-14px] right-[4%] z-[1] scale-[0.9] opacity-90" />
    );
  }

  return (
    <OliveBranch className="bottom-[-15px] right-[4%] z-[1] scale-[0.95] opacity-95" />
  );
}


function formatGuaranies(value: number | null) {
  if (value === null) {
    return "";
  }

  return new Intl.NumberFormat("es-PY").format(value);
}

function formatPromotionDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function PromotionsSection() {
  const [animationKey, setAnimationKey] = useState(0);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPromotions() {
      setLoading(true);

      const { data, error } = await supabase
        .from("promotions")
        .select(
          `
          id,
          title,
          subtitle,
          description,
          details,
          badge,
          normal_price,
          promo_price,
          start_date,
          end_date,
          whatsapp_message,
          active,
          sort_order,
          created_at
          `
        )
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando promociones:", error);
        setPromotions([]);
        setLoading(false);
        return;
      }

      setPromotions((data ?? []) as Promotion[]);
      setCurrentIndex(0);
      setAnimationKey((current) => current + 1);
      setLoading(false);
    }

    loadPromotions();
  }, []);

  useEffect(() => {
    if (promotions.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % promotions.length);
      setAnimationKey((current) => current + 1);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [promotions.length]);

  function previousPromotion() {
    if (promotions.length === 0) return;

    setCurrentIndex((current) =>
      current === 0 ? promotions.length - 1 : current - 1
    );
    setAnimationKey((current) => current + 1);
  }

  function nextPromotion() {
    if (promotions.length === 0) return;

    setCurrentIndex((current) => (current + 1) % promotions.length);
    setAnimationKey((current) => current + 1);
  }

  function goToPromotion(index: number) {
    setCurrentIndex(index);
    setAnimationKey((current) => current + 1);
  }

  if (loading) {
    return (
      <section
        id="promociones"
        className="promo-zone relative overflow-hidden px-4 py-16 sm:px-6"
      >
        <div className="mx-auto max-w-6xl text-center text-sm text-[#69636B]">
          Cargando promociones...
        </div>
      </section>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  const promotion = promotions[currentIndex];
  const detailLines =
    promotion.details
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean) ?? [];

  const whatsappMessage =
    promotion.whatsapp_message ||
    `Hola Mistica Spa, quiero consultar por la promoción ${promotion.title}.`;

  const whatsappUrl = `https://wa.me/595981490443?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const savings =
    promotion.normal_price !== null &&
    promotion.promo_price !== null &&
    promotion.normal_price > promotion.promo_price
      ? promotion.normal_price - promotion.promo_price
      : null;

  const discountPercent =
    savings !== null && promotion.normal_price
      ? Math.round((savings / promotion.normal_price) * 100)
      : null;

  return (
    <section
      id="promociones"
      className="promo-zone relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24"
    >
      <div className="promo-orb promo-orb-1" />
      <div className="promo-orb promo-orb-2" />
      <div className="promo-orb promo-orb-3" />
      <div className="promo-shine" />

      <OliveBranch className="-left-12 -top-12 scale-[0.8] opacity-25" />
      <LavenderBranch className="-bottom-24 -right-4 scale-[0.85] opacity-30" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="promo-label inline-flex rounded-full border border-[#815799]/20 bg-white/70 px-5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.34em] text-[#633A78] shadow-sm backdrop-blur">
            Promociones activas
          </span>

          <h2 className="mt-5 font-display text-4xl font-semibold text-[#3B174D] sm:text-5xl md:text-6xl">
            Beneficios especiales para ti
          </h2>

          <p className="mt-4 text-sm leading-6 text-[#69636B]">
            Descubre los combos y promociones disponibles en Mistica Spa.
          </p>
        </div>

        <article
          key={animationKey}
          className="promo-slide relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-br from-[#351544] via-[#5C2D6D] to-[#8E61A5] p-6 text-white shadow-[0_35px_100px_rgba(99,58,120,0.38)] sm:p-9 md:p-12"
        >
          <div className="promo-card-glow" />
          <LilyFlower className="-bottom-24 -right-8 z-[1] scale-[0.9] opacity-50" />
          <PetalCluster className="right-[12%] top-[5%] opacity-35" />

          <div className="relative z-10 grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                {promotion.badge && (
                  <span className="promo-badge inline-flex rounded-full border border-white/30 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur">
                    {promotion.badge}
                  </span>
                )}

                {discountPercent !== null && (
                  <span className="promo-discount rounded-full bg-[#D7E1A7] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#344526] shadow-lg">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              {promotion.subtitle && (
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#E5D6EB]">
                  {promotion.subtitle}
                </p>
              )}

              <h3 className="mt-3 max-w-2xl font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">
                {promotion.title}
              </h3>

              {promotion.description && (
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/82 sm:text-base">
                  {promotion.description}
                </p>
              )}

              {detailLines.length > 0 && (
                <div className="mt-7 space-y-3">
                  {detailLines.map((detail, index) => (
                    <div
                      key={`${detail}-${index}`}
                      className="promo-detail flex gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D7E1A7] text-xs font-bold text-[#344526]">
                        ✓
                      </span>

                      <p className="text-sm font-medium leading-6">{detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="promo-price-card relative rounded-[1.8rem] bg-[#F9F6F0] p-6 text-[#33283A] shadow-2xl sm:p-8">
              {savings !== null && (
                <div className="mb-5 rounded-2xl bg-[#EDF2DD] p-4 text-[#4B5E2C]">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em]">
                    Ahorras
                  </p>
                  <p className="mt-1 text-2xl font-extrabold">
                    {formatGuaranies(savings)} Gs
                  </p>
                </div>
              )}

              {promotion.normal_price !== null && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7D7480]">
                    Precio normal
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#7C787A] line-through decoration-red-500 decoration-2 sm:text-3xl">
                    {formatGuaranies(promotion.normal_price)} Gs
                  </p>
                </>
              )}

              {promotion.promo_price !== null && (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#815799]">
                    Precio promoción
                  </p>
                  <p className="mt-2 font-display text-5xl font-bold leading-none text-[#3B174D] sm:text-6xl">
                    {formatGuaranies(promotion.promo_price)}
                  </p>
                  <p className="mt-2 text-sm font-semibold">Gs</p>
                </div>
              )}

              {(promotion.start_date || promotion.end_date) && (
                <div className="mt-6 rounded-xl bg-[#EFE7F2] p-4 text-xs leading-5 text-[#645769]">
                  {promotion.start_date && promotion.end_date && (
                    <p>
                      Vigente del {formatPromotionDate(promotion.start_date)} al{" "}
                      {formatPromotionDate(promotion.end_date)}
                    </p>
                  )}

                  {promotion.start_date && !promotion.end_date && (
                    <p>
                      Disponible desde el{" "}
                      {formatPromotionDate(promotion.start_date)}
                    </p>
                  )}

                  {!promotion.start_date && promotion.end_date && (
                    <p>
                      Disponible hasta el{" "}
                      {formatPromotionDate(promotion.end_date)}
                    </p>
                  )}
                </div>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="promo-cta lux-button mt-7 block w-full rounded-full bg-[#815799] px-6 py-4 text-center font-semibold text-white hover:bg-[#633A78]"
              >
                Quiero esta promoción
              </a>
            </div>
          </div>
        </article>

        {promotions.length > 1 && (
          <>
            <div className="mx-auto mt-7 h-1.5 max-w-xl overflow-hidden rounded-full bg-[#D8C9DE]/70">
              <div
                key={`progress-${animationKey}`}
                className="promo-progress h-full rounded-full bg-gradient-to-r from-[#633A78] via-[#A675B6] to-[#6F9140]"
              />
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={previousPromotion}
                aria-label="Promoción anterior"
                className="promo-arrow flex h-12 w-12 items-center justify-center rounded-full border border-[#815799]/25 bg-white/90 text-2xl text-[#633A78] shadow-md transition hover:bg-[#815799] hover:text-white"
              >
                ‹
              </button>

              <div className="flex items-center gap-2">
                {promotions.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Ver promoción ${index + 1}`}
                    onClick={() => goToPromotion(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      currentIndex === index
                        ? "w-9 bg-[#815799] shadow-[0_0_14px_rgba(129,87,153,0.55)]"
                        : "w-2.5 bg-[#CDB3D9] hover:bg-[#A675B6]"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={nextPromotion}
                aria-label="Siguiente promoción"
                className="promo-arrow flex h-12 w-12 items-center justify-center rounded-full border border-[#815799]/25 bg-white/90 text-2xl text-[#633A78] shadow-md transition hover:bg-[#815799] hover:text-white"
              >
                ›
              </button>
            </div>

            <p className="mt-3 text-center text-xs font-medium tracking-[0.08em] text-[#817684]">
              {currentIndex + 1} de {promotions.length} promociones
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F4EE] text-[#2E2830]">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#E6E0D8] bg-[#F7F4EE]/95 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">

          <a
            href="#inicio"
            className="flex min-w-0 items-center gap-2 text-[#3D4036] sm:gap-3"
          >
            <span className="hidden text-[#633A78] sm:block">
              <LotusIcon />
            </span>

            <span className="font-display text-[1.7rem] font-semibold tracking-[0.12em] sm:text-3xl sm:tracking-[0.17em]">
              MISTICA
            </span>

            <span className="text-[0.62rem] font-semibold tracking-[0.22em] text-[#6F8F7A] sm:text-xs sm:tracking-[0.35em]">
              SPA
            </span>
          </a>

          <nav className="hidden gap-9 text-sm font-medium text-[#4E504B] md:flex">

            <a href="#inicio" className="transition hover:text-[#815799]">
              Inicio
            </a>

            <a href="#promociones" className="transition hover:text-[#815799]">
              Promociones
            </a>

            <a href="#servicios" className="transition hover:text-[#815799]">
              Servicios
            </a>

            <a href="#horarios" className="transition hover:text-[#815799]">
              Horarios
            </a>

            <a href="#contacto" className="transition hover:text-[#815799]">
              Contacto
            </a>

          </nav>

          <a
            href="#reservar"
            className="lux-button shrink-0 rounded-full bg-[#2F7057] px-4 py-3 text-sm font-semibold leading-tight text-white hover:bg-[#255B47] sm:px-6"
          >
            <span className="hidden sm:inline">
              Reservar turno
            </span>

            <span className="sm:hidden">
              Reservar
            </span>
          </a>

        </div>

      </header>

      {/* HERO */}
      <section
        id="inicio"
        className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:py-28"
      >

        <OliveBranch className="-left-10 top-4 scale-[0.64] opacity-55 sm:-left-9 sm:-top-12 sm:rotate-[18deg] sm:scale-[0.8] sm:opacity-70" />

        <LavenderBranch className="-right-10 top-28 scale-[0.58] opacity-45 sm:-right-6 sm:top-8 sm:scale-[0.8] sm:opacity-60" />

        <PetalCluster className="right-[8%] top-[22%] sm:right-[18%] sm:top-[12%]" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">

          <div className="animate-fade-left">

            <p className="mb-5 max-w-[20rem] text-xs font-semibold uppercase leading-6 tracking-[0.32em] text-[#633A78] sm:max-w-none sm:tracking-[0.4em]">
              Bienestar · Belleza · Relajación
            </p>

            <h1 className="max-w-[22rem] font-display text-[3.7rem] font-semibold leading-[0.88] tracking-[-0.035em] text-[#2F2930] sm:max-w-xl sm:text-6xl sm:leading-[0.94] md:text-8xl">

              <span className="block whitespace-nowrap">
                Tu momento de
              </span>

              <span className="block italic text-[#815799]">
                bienestar
              </span>

              <span className="block">
                comienza aquí.
              </span>

            </h1>

            <p className="mt-7 max-w-lg text-base font-medium leading-7 text-[#656168]">
              Un espacio dedicado al cuidado personal, la relajación y tratamientos pensados para ayudarte a sentirte mejor.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">

              <a
                href="#reservar"
                className="lux-button rounded-full bg-[#815799] px-7 py-4 font-semibold text-white hover:bg-[#633A78]"
              >
                Reservar mi turno
              </a>

              <a
                href="#promociones"
                className="lux-button rounded-full bg-[#2F7057] px-7 py-4 font-semibold text-white hover:bg-[#255B47]"
              >
                Promociones
              </a>

              <a
                href="https://wa.me/595981490443"
                target="_blank"
                rel="noopener noreferrer"
                className="lux-button rounded-full border-2 border-[#815799] bg-white/70 px-7 py-4 font-semibold text-[#4A2356] hover:bg-[#4A2356] hover:text-white"
              >
                WhatsApp
              </a>

            </div>

          </div>

          <div className="animate-fade-right">

            <div className="relative mx-auto flex min-h-[380px] max-w-lg items-center justify-center overflow-hidden rounded-[3rem_1rem_3rem_1rem] bg-gradient-to-br from-[#DCC9E3] via-[#EFE5F2] to-[#DDE1CF] shadow-[0_28px_70px_rgba(74,35,86,0.18)] sm:min-h-[440px] sm:rounded-[4rem_1rem_4rem_1rem]">

              <LilyFlower className="-bottom-16 -right-10 z-[1] scale-[0.82] sm:-right-3 sm:scale-[1.05]" />

              <CallaFlower className="-left-12 -top-24 z-[1] rotate-180 scale-[0.68] opacity-65 sm:-left-8 sm:scale-[0.8] sm:opacity-70" />

              <div className="absolute inset-5 rounded-[2.4rem_.7rem_2.4rem_.7rem] border border-white/70 sm:rounded-[3.4rem_.7rem_3.4rem_.7rem]" />

              <div className="relative z-10 text-center text-[#4A2356]">

                <div className="mx-auto mb-4 flex justify-center">
                  <LotusIcon />
                </div>

                <p className="text-xs uppercase tracking-[0.5em]">
                  Mistica
                </p>

                <p className="mt-3 font-display text-6xl font-semibold sm:text-7xl">
                  SPA
                </p>

                <div className="mx-auto my-6 h-px w-20 bg-[#815799]" />

                <p className="px-4 text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em]">
                  RELÁJATE · RENUEVA · DISFRUTA
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* PROMOCIONES */}
      <PromotionsSection />

      {/* SERVICIOS */}
      <section
        id="servicios"
        className="relative bg-[#FCFAF6] px-4 py-20 sm:px-6 sm:py-24"
      >

        <div className="mx-auto max-w-7xl">

          <div className="reveal mx-auto mb-14 max-w-2xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#815799]">
              Nuestros servicios
            </p>

            <h2 className="mt-4 font-display text-4xl font-semibold text-[#3B174D] sm:text-5xl md:text-6xl">
              Encuentra el tratamiento ideal para ti
            </h2>

            <p className="mt-4 text-sm font-medium text-[#69636B]">
              Lee qué puede aportarte cada tratamiento y elige el que mejor se adapte a lo que estás buscando.
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {servicios.map((grupo) => (

              <article
                key={grupo.categoria}
                className={`lux-card reveal relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br ${grupo.color} p-6 sm:p-7 ${grupo.text}`}
              >

                <Decoration type={grupo.decoracion} />

                <div className="relative z-10 pr-0 lg:pr-[150px]">

                  <div className="mb-6 flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-current/30 bg-white/15">
                      <LotusIcon />
                    </div>

                    <h3 className="font-display text-2xl font-semibold sm:text-3xl">
                      {grupo.categoria}
                    </h3>

                  </div>

                  <div className="space-y-5">

                    {grupo.items.map((servicio) => (

                      <div
                        key={servicio.nombre}
                        className="max-w-[100%] border-b border-current/15 pb-4 lg:max-w-[92%]"
                      >

                        <div className="flex flex-col gap-2">

                          <p className="text-sm font-semibold">
                            {servicio.nombre}
                          </p>

                          <p className="max-w-lg text-xs leading-5 opacity-80">
                            {servicio.descripcion}
                          </p>

                          <a
                            href="#reservar"
                            className="mt-1 w-fit text-xs font-semibold underline decoration-current/30 underline-offset-4 transition hover:translate-x-1"
                          >
                            Reservar →
                          </a>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>

      {/* HORARIOS */}
      <section
        id="horarios"
        className="relative px-4 py-20 sm:px-6 sm:py-24"
      >

        <div className="reveal relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2.2rem] bg-gradient-to-r from-[#3B174D] via-[#4A2356] to-[#633A78] px-6 py-12 text-white shadow-2xl sm:rounded-[3rem] sm:px-8 sm:py-14 md:grid-cols-2 md:px-14">

          <LilyFlower className="-bottom-20 -left-12 z-[1] scale-[0.62] opacity-75 sm:-left-9 sm:scale-[0.72] sm:opacity-85" />

          <CallaFlower className="-bottom-20 -right-10 z-[1] scale-[0.62] opacity-75 sm:-right-7 sm:scale-[0.74] sm:opacity-85" />

          <div className="relative z-10">

            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#E7DDEF]">
              Horarios
            </p>

            <h2 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
              Reserva el momento que mejor se adapte a ti
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-6 text-[#E8DCEB]">
              Nuestro calendario mostrará los días y horarios disponibles para que puedas elegir tu turno.
            </p>

          </div>

          <div className="relative z-10 rounded-[1.8rem] border border-white/20 bg-white/10 p-6 backdrop-blur sm:p-7">

            <div className="flex justify-between border-b border-white/20 py-4">
              <span>Lunes a sábado</span>

              <strong>
                08:00 - 20:00
              </strong>
            </div>

            <div className="flex justify-between py-4">
              <span>Domingo</span>

              <strong>
                Cerrado
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* RESERVAS */}
      <BookingForm />

      {/* CONTACTO */}
      <section
        id="contacto"
        className="relative overflow-hidden bg-[#FCFAF6] px-4 py-20 sm:px-6 sm:py-24"
      >

        <LavenderBranch className="-bottom-20 -right-8 scale-[0.7] opacity-55 sm:-right-4 sm:scale-[0.95] sm:opacity-75" />

        <OliveBranch className="-bottom-24 -left-10 scale-[0.65] opacity-40 sm:-left-8 sm:scale-[0.8] sm:opacity-50" />

        <div className="relative z-10 mx-auto grid max-w-6xl gap-8 md:grid-cols-2">

          <div className="reveal">

            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#815799]">
              Contacto
            </p>

            <h2 className="mt-3 font-display text-4xl font-semibold text-[#3B174D] sm:text-5xl">
              Mistica Spa
            </h2>

            <div className="mt-7 space-y-3 text-sm font-medium text-[#69636B]">

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

            <div className="mt-8 flex flex-wrap gap-3">

              <a
                href="https://wa.me/595981490443"
                target="_blank"
                rel="noopener noreferrer"
                className="lux-button rounded-full bg-[#6F9140] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5E7C35]"
              >
                WhatsApp
              </a>

              <a
                href="https://g.page/r/CYShAR7rfMcqEBM/review"
                target="_blank"
                rel="noopener noreferrer"
                className="lux-button rounded-full border border-[#D7D1C9] bg-white px-5 py-3 text-sm font-semibold"
              >
                <span className="google-g">
                  <span className="google-blue">G</span>
                  <span className="google-red">o</span>
                  <span className="google-yellow">o</span>
                  <span className="google-blue">g</span>
                  <span className="google-green">l</span>
                  <span className="google-red">e</span>
                </span>{" "}
                · Dejar una reseña
              </a>

              <a
                href="https://www.instagram.com/mistica_spa53/"
                target="_blank"
                rel="noopener noreferrer"
                className="lux-button rounded-full border-2 border-[#B05E9E] bg-white px-5 py-3 text-sm font-semibold text-[#8E3D82] hover:bg-[#B05E9E] hover:text-white"
              >
                Instagram
              </a>

            </div>

          </div>

          <div className="lux-card reveal relative overflow-hidden rounded-[2rem] border border-[#E1D9E4] bg-gradient-to-br from-white to-[#F1EAF4] p-7 sm:p-9">

            <CallaFlower className="-bottom-24 -right-6 z-[1] scale-[0.58] opacity-60 sm:-right-3 sm:scale-[0.7] sm:opacity-75" />

            <div className="relative z-10">

              <p className="google-g text-lg">
                <span className="google-blue">G</span>
                <span className="google-red">o</span>
                <span className="google-yellow">o</span>
                <span className="google-blue">g</span>
                <span className="google-green">l</span>
                <span className="google-red">e</span>
              </p>

              <div className="mt-3 flex items-center gap-4">

                <p className="font-display text-5xl font-semibold text-[#633A78] sm:text-6xl">
                  4.9
                </p>

                <p className="tracking-[0.18em] text-[#F4B400]">
                  ★★★★★
                </p>

              </div>

              <p className="mt-3 text-sm font-medium text-[#69636B]">
                Valoración actual de Mistica Spa en Google.
              </p>

              <a
                href="https://g.page/r/CYShAR7rfMcqEBM/review"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block text-sm font-semibold text-[#633A78] underline underline-offset-4"
              >
                Compartir mi experiencia →
              </a>

            </div>

          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="relative overflow-hidden bg-gradient-to-r from-[#3B174D] to-[#633A78] px-6 py-10 text-white">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">

          <div className="flex items-center gap-3">

            <LotusIcon />

            <span className="font-display text-2xl font-semibold tracking-[0.22em]">
              MISTICA
            </span>

            <span className="text-xs tracking-[0.3em]">
              SPA
            </span>

          </div>

          <p className="text-sm text-white/75">
            Bienestar y cuidado personal
          </p>

          <div className="flex items-center gap-3">

            <a
              href="https://wa.me/595981490443"
              target="_blank"
              rel="noopener noreferrer"
              className="lux-button rounded-full border border-white/40 px-4 py-2 text-sm"
            >
              WhatsApp
            </a>

            <a
              href="https://www.instagram.com/mistica_spa53/"
              target="_blank"
              rel="noopener noreferrer"
              className="lux-button rounded-full border border-white/40 px-4 py-2 text-sm"
            >
              Instagram
            </a>

          </div>

        </div>

      </footer>

    </main>
  );
}