import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { formSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin().from("forms")
      .select("id,title,description,status,color,welcome,questions,created_at,updated_at")
      .eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Formulaire introuvable." }, { status: 404 });
    return NextResponse.json({ data: { ...data, status: data.status === "published" ? "Published" : "Draft" } });
  } catch (error) {
    console.error("GET /api/forms/[id]", error);
    return NextResponse.json({ error: "Impossible de charger le formulaire." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const parsed = formSchema.partial().safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides.", details: parsed.error.flatten() }, { status: 400 });
    const update = { ...parsed.data, ...(parsed.data.status ? { status: parsed.data.status.toLowerCase() } : {}), updated_at: new Date().toISOString() };
    const { data, error } = await supabaseAdmin().from("forms").update(update).eq("id", id)
      .select("id,title,description,status,color,welcome,questions,created_at,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Formulaire introuvable." }, { status: 404 });
    return NextResponse.json({ data: { ...data, status: data.status === "published" ? "Published" : "Draft" } });
  } catch (error) {
    console.error("PATCH /api/forms/[id]", error);
    return NextResponse.json({ error: "Impossible de modifier le formulaire." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin().from("forms").delete().eq("id", id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/forms/[id]", error);
    return NextResponse.json({ error: "Impossible de supprimer le formulaire." }, { status: 500 });
  }
}
