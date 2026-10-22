
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { submissionSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

const ALLOWED_ORIGIN = "https://formbuilder-plum.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export const runtime = "nodejs";

function corsResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: corsHeaders,
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin()
      .from("submissions")
      .select("id,form_id,answers,source,created_at")
      .eq("form_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return corsResponse({ data: data ?? [] });
  } catch (error) {
    console.error("GET submissions", error);

    return corsResponse(
      { error: "Impossible de charger les réponses." },
      500
    );
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const parsed = submissionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return corsResponse(
        {
          error: "Réponses invalides.",
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const db = supabaseAdmin();

    const { data: form, error: formError } = await db
      .from("forms")
      .select("id,status,questions")
      .eq("id", id)
      .maybeSingle();

    if (formError) throw formError;

    if (!form || form.status !== "published") {
      return corsResponse(
        { error: "Ce formulaire n'est pas disponible." },
        404
      );
    }

    const questions = (form.questions ?? []) as Array<{
      id: string;
      required?: boolean;
      type: string;
      options?: string[];
    }>;

    for (const q of questions) {
      const answer = parsed.data.answers[String(q.id)] ?? "";

      if (q.required && !answer.trim()) {
        return corsResponse(
          { error: `La question « ${q.id} » est obligatoire.` },
          400
        );
      }

      if (
        q.type === "email" &&
        answer &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)
      ) {
        return corsResponse(
          { error: "Adresse e-mail invalide." },
          400
        );
      }

      if (
        q.type === "choice" &&
        answer &&
        !(q.options ?? []).includes(answer)
      ) {
        return corsResponse(
          { error: "Option de réponse invalide." },
          400
        );
      }

      if (
        q.type === "yesno" &&
        answer &&
        !["Yes", "No", "Oui", "Non"].includes(answer)
      ) {
        return corsResponse(
          { error: "Réponse oui/non invalide." },
          400
        );
      }
    }

    const { data, error } = await db
      .from("submissions")
      .insert({
        form_id: id,
        answers: parsed.data.answers,
        source: parsed.data.source,
      })
      .select("id,form_id,answers,source,created_at")
      .single();

    if (error) throw error;

    return corsResponse({ data }, 201);
  } catch (error) {
    console.error("POST submissions", error);

    return corsResponse(
      { error: "Impossible d'enregistrer les réponses." },
      500
    );
  }
}
