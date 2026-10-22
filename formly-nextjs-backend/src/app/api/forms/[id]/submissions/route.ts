import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { submissionSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin().from("submissions")
      .select("id,form_id,answers,source,created_at")
      .eq("form_id", id).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("GET submissions", error);
    return NextResponse.json({ error: "Impossible de charger les réponses." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const parsed = submissionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Réponses invalides.", details: parsed.error.flatten() }, { status: 400 });

    const db = supabaseAdmin();
    const { data: form, error: formError } = await db.from("forms")
      .select("id,status,questions").eq("id", id).maybeSingle();
    if (formError) throw formError;
    if (!form || form.status !== "published") return NextResponse.json({ error: "Ce formulaire n'est pas disponible." }, { status: 404 });

    const questions = (form.questions ?? []) as Array<{id:string; required?:boolean; type:string; options?:string[]}>;
    for (const q of questions) {
      const answer = parsed.data.answers[String(q.id)] ?? "";
      if (q.required && !answer.trim()) return NextResponse.json({ error: `La question « ${q.id} » est obligatoire.` }, { status: 400 });
      if (q.type === "email" && answer && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
      if (q.type === "choice" && answer && !(q.options ?? []).includes(answer)) return NextResponse.json({ error: "Option de réponse invalide." }, { status: 400 });
      if (q.type === "yesno" && answer && !["Yes", "No", "Oui", "Non"].includes(answer)) return NextResponse.json({ error: "Réponse oui/non invalide." }, { status: 400 });
    }

    const { data, error } = await db.from("submissions")
      .insert({ form_id: id, answers: parsed.data.answers, source: parsed.data.source })
      .select("id,form_id,answers,source,created_at").single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("POST submissions", error);
    return NextResponse.json({ error: "Impossible d'enregistrer les réponses." }, { status: 500 });
  }
}
