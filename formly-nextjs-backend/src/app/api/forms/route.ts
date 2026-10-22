
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formSchema } from "@/lib/validation";

const ALLOWED_ORIGIN = "https://formbuilder-plum.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export const runtime = "nodejs";

function corsResponse(
  body: unknown,
  status = 200
) {
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

export async function GET() {
  try {
    const db = supabaseAdmin();

    const { data, error } = await db
      .from("forms")
      .select(
        "id,title,description,status,color,welcome,questions,created_at,updated_at"
      )
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return corsResponse({ data: data ?? [] });
  } catch (error) {
    console.error("GET /api/forms", error);

    return corsResponse(
      { error: "Impossible de charger les formulaires." },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = formSchema.safeParse(await request.json());

    if (!parsed.success) {
      return corsResponse(
        {
          error: "Données invalides.",
          details: parsed.error.flatten(),
        },
        400
      );
    }

    // TODO production: derive owner_id from the verified Supabase Auth session.
    const { data, error } = await supabaseAdmin()
      .from("forms")
      .insert({
        ...parsed.data,
        status: parsed.data.status.toLowerCase(),
      })
      .select(
        "id,title,description,status,color,welcome,questions,created_at,updated_at"
      )
      .single();

    if (error) throw error;

    return corsResponse(
      {
        data: {
          ...data,
          status: capitalizeStatus(data.status),
        },
      },
      201
    );
  } catch (error) {
    console.error("POST /api/forms", error);

    return corsResponse(
      { error: "Impossible de créer le formulaire." },
      500
    );
  }
}

function capitalizeStatus(status: string): "Published" | "Draft" {
  return status === "published" ? "Published" : "Draft";
}
