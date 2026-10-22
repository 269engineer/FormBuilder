import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("forms")
      .select("id,title,description,status,color,welcome,questions,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("GET /api/forms", error);
    return NextResponse.json({ error: "Impossible de charger les formulaires." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = formSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides.", details: parsed.error.flatten() }, { status: 400 });

    // TODO production: derive owner_id from the verified Supabase Auth session.
    const { data, error } = await supabaseAdmin()
      .from("forms")
      .insert({ ...parsed.data, status: parsed.data.status.toLowerCase() })
      .select("id,title,description,status,color,welcome,questions,created_at,updated_at")
      .single();
    if (error) throw error;
    return NextResponse.json({ data: { ...data, status: capitalizeStatus(data.status) } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/forms", error);
    return NextResponse.json({ error: "Impossible de créer le formulaire." }, { status: 500 });
  }
}

function capitalizeStatus(status: string): "Published" | "Draft" {
  return status === "published" ? "Published" : "Draft";
}
