"use client";

import { type FormEvent, useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

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
  created_at?: string;
};

type PromotionForm = {
  title: string;
  subtitle: string;
  description: string;
  details: string;
  badge: string;
  normalPrice: string;
  promoPrice: string;
  startDate: string;
  endDate: string;
  whatsappMessage: string;
  active: boolean;
  sortOrder: string;
};

const EMPTY_FORM: PromotionForm = {
  title: "",
  subtitle: "",
  description: "",
  details: "",
  badge: "",
  normalPrice: "",
  promoPrice: "",
  startDate: "",
  endDate: "",
  whatsappMessage: "",
  active: true,
  sortOrder: "0",
};

function formatGs(value: number | null) {
  if (value === null) return "Sin precio";
  return `${new Intl.NumberFormat("es-PY").format(value)} Gs`;
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export default function PromotionsManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionForm>(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function loadPromotions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("promotions")
      .select(`
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
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      console.error("Error cargando promociones:", error);
      setMessage(`No se pudieron cargar las promociones: ${error.message}`);
      return;
    }

    setPromotions((data ?? []) as Promotion[]);
  }

  useEffect(() => {
    loadPromotions();
  }, []);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function openNewPromotion() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMessage("");
    setShowForm(true);
  }

  function startEdit(promotion: Promotion) {
    setEditingId(promotion.id);
    setShowForm(true);
    setMessage("");

    setForm({
      title: promotion.title ?? "",
      subtitle: promotion.subtitle ?? "",
      description: promotion.description ?? "",
      details: promotion.details ?? "",
      badge: promotion.badge ?? "",
      normalPrice:
        promotion.normal_price !== null ? String(promotion.normal_price) : "",
      promoPrice:
        promotion.promo_price !== null ? String(promotion.promo_price) : "",
      startDate: promotion.start_date ?? "",
      endDate: promotion.end_date ?? "",
      whatsappMessage: promotion.whatsapp_message ?? "",
      active: promotion.active,
      sortOrder: String(promotion.sort_order ?? 0),
    });

    setTimeout(() => {
      document.getElementById("promotion-form")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }

  async function savePromotion(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim()) {
      alert("Debes ingresar un título.");
      return;
    }

    const normalPrice = form.normalPrice.trim()
      ? Number(form.normalPrice)
      : null;
    const promoPrice = form.promoPrice.trim() ? Number(form.promoPrice) : null;

    if (normalPrice !== null && !Number.isFinite(normalPrice)) {
      alert("El precio normal no es válido.");
      return;
    }

    if (promoPrice !== null && !Number.isFinite(promoPrice)) {
      alert("El precio promocional no es válido.");
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      alert("La fecha final no puede ser anterior a la fecha inicial.");
      return;
    }

    setSaving(true);

    const commonParams = {
      p_title: form.title.trim(),
      p_subtitle: form.subtitle.trim() || null,
      p_description: form.description.trim() || null,
      p_details: form.details.trim() || null,
      p_badge: form.badge.trim() || null,
      p_normal_price: normalPrice,
      p_promo_price: promoPrice,
      p_start_date: form.startDate || null,
      p_end_date: form.endDate || null,
      p_whatsapp_message: form.whatsappMessage.trim() || null,
      p_active: form.active,
      p_sort_order: Number(form.sortOrder || "0"),
    };

    const { error } = editingId
      ? await supabase.rpc("admin_update_promotion", {
          p_id: editingId,
          ...commonParams,
        })
      : await supabase.rpc("admin_create_promotion", commonParams);

    setSaving(false);

    if (error) {
      console.error(error);
      alert(
        `${editingId ? "No se pudo actualizar" : "No se pudo crear"} la promoción:\n${error.message}`
      );
      return;
    }

    setMessage(
      editingId
        ? "Promoción actualizada correctamente."
        : "Promoción creada correctamente."
    );

    resetForm();
    await loadPromotions();
  }

  async function togglePromotion(promotion: Promotion) {
    const { error } = await supabase.rpc("admin_toggle_promotion", {
      p_id: promotion.id,
      p_active: !promotion.active,
    });

    if (error) {
      alert(`No se pudo cambiar el estado:\n${error.message}`);
      return;
    }

    setMessage(promotion.active ? "Promoción desactivada." : "Promoción activada.");
    await loadPromotions();
  }

  async function deletePromotion(promotion: Promotion) {
    const confirmed = window.confirm(
      `¿Eliminar definitivamente la promoción "${promotion.title}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase.rpc("admin_delete_promotion", {
      p_id: promotion.id,
    });

    if (error) {
      alert(`No se pudo eliminar:\n${error.message}`);
      return;
    }

    if (editingId === promotion.id) resetForm();

    setMessage("Promoción eliminada.");
    await loadPromotions();
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-[#756762]">
            Administra los combos que aparecen en la página web.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewPromotion}
          className="rounded-full bg-[#815799] px-5 py-2.5 text-sm font-medium text-white"
        >
          + Nueva promoción
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-xl border border-[#DCCFE2] bg-[#F7F1F9] p-4 text-sm text-[#633A78]">
          {message}
        </div>
      )}

      {showForm && (
        <form
          id="promotion-form"
          onSubmit={savePromotion}
          className="mt-6 rounded-2xl border border-[#E2D7E6] bg-[#F8F4FA] p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium text-[#4A2356]">
              {editingId ? "Editar promoción" : "Nueva promoción"}
            </p>

            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-[#756762] underline"
            >
              Cerrar
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <input
              type="text"
              required
              placeholder="Título. Ej: Combo Primavera"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
            />

            <input
              type="text"
              placeholder="Subtítulo opcional"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="w-full rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
            />

            <textarea
              rows={3}
              placeholder="Descripción breve de la promoción"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full resize-none rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
            />

            <div>
              <label className="mb-2 block text-xs font-semibold text-[#756762]">
                Qué incluye
              </label>

              <textarea
                rows={5}
                placeholder={
                  "Ejemplo:\n10 sesiones de masaje descontracturante (espalda, cuello y hombro)\n+ Drenaje linfático\n+ Sauna seca"
                }
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                className="w-full resize-none rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
              />

              <p className="mt-1 text-xs text-[#756762]">
                Escribe cada servicio o beneficio en una línea distinta.
              </p>
            </div>

            <input
              type="text"
              placeholder="Etiqueta. Ej: PRIMAVERA"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              className="w-full rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                min="0"
                placeholder="Precio normal"
                value={form.normalPrice}
                onChange={(e) =>
                  setForm({ ...form, normalPrice: e.target.value })
                }
                className="w-full rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
              />

              <input
                type="number"
                min="0"
                placeholder="Precio promoción"
                value={form.promoPrice}
                onChange={(e) =>
                  setForm({ ...form, promoPrice: e.target.value })
                }
                className="w-full rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#756762]">Desde</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#756762]">Hasta</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
                />
              </div>
            </div>

            <textarea
              rows={2}
              placeholder="Mensaje de WhatsApp. Ej: Hola Mistica Spa, quiero consultar por el Combo Primavera."
              value={form.whatsappMessage}
              onChange={(e) =>
                setForm({ ...form, whatsappMessage: e.target.value })
              }
              className="w-full resize-none rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#756762]">
                  Orden de aparición
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: e.target.value })
                  }
                  className="w-full rounded-xl border border-[#D8C9DE] bg-white px-4 py-3"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-[#D8C9DE] bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">Mostrar en la página</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#815799] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Guardar cambios"
                    : "Crear promoción"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[#815799] px-6 py-3 text-sm text-[#633A78]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-medium">Promociones cargadas</h3>

          <button
            type="button"
            onClick={loadPromotions}
            className="text-sm text-[#815799] underline"
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="mt-4 rounded-xl bg-[#F8F4FA] p-5 text-sm text-[#756762]">
            Cargando promociones...
          </div>
        ) : promotions.length === 0 ? (
          <div className="mt-4 rounded-xl bg-[#F8F4FA] p-5 text-sm text-[#756762]">
            Todavía no hay promociones.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {promotions.map((promotion) => (
              <details
                key={promotion.id}
                className="overflow-hidden rounded-2xl border border-[#E2D7E6] bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#4A2356]">
                      {promotion.title}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          promotion.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {promotion.active ? "Activa" : "Inactiva"}
                      </span>

                      {promotion.badge && (
                        <span className="rounded-full bg-[#EFE4F2] px-3 py-1 text-xs text-[#633A78]">
                          {promotion.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full border border-[#815799] px-4 py-2 text-xs font-medium text-[#633A78]">
                    Ver
                  </span>
                </summary>

                <div className="border-t border-[#E2D7E6] px-5 py-5">
                  {promotion.subtitle && (
                    <p className="text-sm text-[#756762]">
                      {promotion.subtitle}
                    </p>
                  )}

                  {promotion.description && (
                    <p className="mt-3 text-sm leading-6">
                      {promotion.description}
                    </p>
                  )}

                  {promotion.details && (
                    <div className="mt-4 whitespace-pre-line rounded-xl bg-[#F8F4FA] p-4 text-sm leading-6">
                      {promotion.details}
                    </div>
                  )}

                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <p>
                      Precio normal: {" "}
                      <span className="font-medium">
                        {formatGs(promotion.normal_price)}
                      </span>
                    </p>

                    <p>
                      Precio promo: {" "}
                      <span className="font-medium text-[#633A78]">
                        {formatGs(promotion.promo_price)}
                      </span>
                    </p>

                    <p>Desde: {formatDate(promotion.start_date)}</p>
                    <p>Hasta: {formatDate(promotion.end_date)}</p>
                  </div>

                  {promotion.whatsapp_message && (
                    <div className="mt-4 rounded-xl bg-[#F8F4FA] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#815799]">
                        Mensaje de WhatsApp
                      </p>
                      <p className="mt-2 text-sm text-[#756762]">
                        {promotion.whatsapp_message}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(promotion)}
                      className="rounded-full border border-[#815799] px-4 py-2 text-sm text-[#633A78]"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePromotion(promotion)}
                      className={`rounded-full px-4 py-2 text-sm ${
                        promotion.active
                          ? "border border-orange-400 text-orange-700"
                          : "border border-green-600 text-green-700"
                      }`}
                    >
                      {promotion.active ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deletePromotion(promotion)}
                      className="rounded-full border border-red-500 px-4 py-2 text-sm text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
