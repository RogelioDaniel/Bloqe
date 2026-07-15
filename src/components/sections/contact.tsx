"use client";

import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Mail, Phone, ArrowUpRight, Send } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const INTENTS = [
  { value: "quote", label: "Cotizar obra" },
  { value: "partnership", label: "Alianza" },
  { value: "visit", label: "Visita obra" },
  { value: "general", label: "Otro" },
] as const;

const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Tu nombre necesita al menos 2 caracteres.")
    .max(120, "Demasiado largo."),
  email: z.email("Escribe un correo válido."),
  phone: z.string().max(40, "Demasiado largo.").optional(),
  message: z
    .string()
    .min(12, "Cuéntanos un poco más — al menos 12 caracteres.")
    .max(2000, "Demasiado largo."),
  intent: z.enum(["quote", "partnership", "visit", "general"]),
});

// The backend (POST /api/contact) accepts intents: general | quote | partnership.
// "visit" is a UI-only intent — map it to "general" and flag it in the message.
const INTENT_LABEL: Record<ContactValues["intent"], string> = {
  quote: "Cotizar obra",
  partnership: "Alianza",
  visit: "Visita a obra",
  general: "Otro",
};

type ContactValues = z.infer<typeof contactSchema>;

const CONTACT_DETAILS = [
  { icon: MapPin, label: "Estudio", value: "Av. Insurgentes 1245, CDMX" },
  { icon: Mail, label: "Correo", value: "hola@bloqe.mx", href: "mailto:hola@bloqe.mx" },
  { icon: Phone, label: "Teléfono", value: "+52 55 8472 9900", href: "tel:+525584729900" },
];

export function Contact() {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      intent: "quote",
    },
  });

  const { register, handleSubmit, setValue, watch, formState } = form;
  const intentValue = watch("intent");
  const isSubmitting = formState.isSubmitting;

  function selectIntent(value: ContactValues["intent"]) {
    setValue("intent", value, { shouldValidate: false });
  }

  async function onSubmit(values: ContactValues) {
    // Normalize intent for backend: "visit" → "general" + flag in message.
    const apiIntent =
      values.intent === "visit" ? "general" : values.intent;
    const messageBody =
      values.intent === "visit"
        ? `[Solicitud: ${INTENT_LABEL[values.intent]}] ${values.message}`
        : values.message;
    const payload = { ...values, intent: apiIntent, message: messageBody };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      toast.success("Solicitud enviada", {
        description:
          "Te respondemos en menos de 24 horas hábiles. Revisa también tu carpeta de promociones.",
      });
      form.reset();
    } catch (err) {
      toast.error("No se pudo enviar", {
        description:
          "Algo falló en el envío. Escríbenos a hola@bloqe.mx o intenta de nuevo en un momento.",
      });
    }
  }

  return (
    <section
      id="contacto"
      className="relative bg-ink bg-grain py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: copy + details + intent pills */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-5"
          >
            <span className="label-mono text-signal">Contacto</span>
            <h2 className="mt-4 font-display font-extrabold tracking-tight text-balance text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98]">
              Cotiza tu obra.
            </h2>
            <p className="mt-5 max-w-md text-lg text-muted-foreground text-pretty leading-relaxed">
              Cuéntanos qué tienes en mente. Te devolvemos un blueprint
              cotizable en la primera sesión, sin compromiso.
            </p>

            {/* Intent pills */}
            <div className="mt-8">
              <span className="label-mono text-muted-foreground">
                Intención
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {INTENTS.filter((i) => i.value !== "general").map((intent) => {
                  const active = intentValue === intent.value;
                  return (
                    <button
                      key={intent.value}
                      type="button"
                      onClick={() => selectIntent(intent.value)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        active
                          ? "border-signal bg-signal text-signal-foreground"
                          : "border-border bg-ink-2/50 text-muted-foreground hover:border-signal/40 hover:text-foreground"
                      )}
                    >
                      {intent.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact details */}
            <div className="mt-10 space-y-3">
              {CONTACT_DETAILS.map((d) => {
                const Icon = d.icon;
                const content = (
                  <>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-ink-2/60 text-signal">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block label-mono text-muted-foreground">
                        {d.label}
                      </span>
                      <span className="block text-sm text-foreground">
                        {d.value}
                      </span>
                    </span>
                  </>
                );
                return d.href ? (
                  <a
                    key={d.label}
                    href={d.href}
                    className="flex items-center gap-3 rounded-xl border border-border bg-ink-2/30 p-3 transition-colors hover:border-signal/40"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={d.label}
                    className="flex items-center gap-3 rounded-xl border border-border bg-ink-2/30 p-3"
                  >
                    {content}
                  </div>
                );
              })}
            </div>

            <a
              href="#estudio"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-signal link-signal"
            >
              ¿Prefieres empezar por el estudio de bloques?
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="rounded-2xl border border-border bg-ink-2/40 p-6 sm:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div className="grid gap-2">
                  <Label htmlFor="contact-name">
                    Nombre <span className="text-signal">*</span>
                  </Label>
                  <Input
                    id="contact-name"
                    placeholder="Tu nombre"
                    autoComplete="name"
                    aria-invalid={!!formState.errors.name}
                    {...register("name")}
                  />
                  {formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">
                    Correo <span className="text-signal">*</span>
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    aria-invalid={!!formState.errors.email}
                    {...register("email")}
                  />
                  {formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="grid gap-2">
                  <Label htmlFor="contact-phone">Teléfono</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="+52 55 0000 0000"
                    autoComplete="tel"
                    aria-invalid={!!formState.errors.phone}
                    {...register("phone")}
                  />
                  {formState.errors.phone && (
                    <p className="text-xs text-destructive">
                      {formState.errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Intent select */}
                <div className="grid gap-2">
                  <Label htmlFor="contact-intent">
                    Intención <span className="text-signal">*</span>
                  </Label>
                  <Select
                    value={intentValue}
                    onValueChange={(v) =>
                      setValue("intent", v as ContactValues["intent"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      id="contact-intent"
                      className="w-full"
                      aria-invalid={!!formState.errors.intent}
                    >
                      <SelectValue placeholder="Selecciona una intención" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTENTS.map((i) => (
                        <SelectItem key={i.value} value={i.value}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formState.errors.intent && (
                    <p className="text-xs text-destructive">
                      {formState.errors.intent.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="mt-5 grid gap-2">
                <Label htmlFor="contact-message">
                  Mensaje <span className="text-signal">*</span>
                </Label>
                <Textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Cuéntanos sobre la obra: ubicación, m2 aproximados, tiempos, referencia visual si la tienes."
                  aria-invalid={!!formState.errors.message}
                  {...register("message")}
                />
                {formState.errors.message && (
                  <p className="text-xs text-destructive">
                    {formState.errors.message.message}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Al enviar aceptas nuestro aviso de privacidad. Respondemos en
                  menos de 24 horas hábiles.
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-signal text-signal-foreground hover:bg-signal-2 rounded-full px-6 sm:min-w-[180px]"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Enviando…" : "Enviar solicitud"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
