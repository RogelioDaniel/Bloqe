// ============================================================
//  POST /api/contact
//  Validates a contact form with zod and persists an Inquiry.
//  Returns { ok: true } with 201 on success, 400 on validation error.
// ============================================================

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const contactSchema = z.object({
  name: z
    .string()
    .min(2, "name must be at least 2 characters"),
  email: z.email("email must be a valid email address"),
  phone: z.string().optional(),
  message: z
    .string()
    .min(5, "message must be at least 5 characters"),
  intent: z
    .enum(["general", "quote", "partnership"])
    .default("general"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, message, intent } = parsed.data;

  try {
    await db.inquiry.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        message,
        intent,
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Could not save inquiry: ${err?.message || err}` },
      { status: 500 }
    );
  }
}
