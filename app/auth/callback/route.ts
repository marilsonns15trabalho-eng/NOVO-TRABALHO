import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const supabase = await createClient();

  // 🔐 troca o code pela sessão
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 👤 pega usuário logado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🚫 se não tiver usuário, volta pro login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 📊 busca o perfil
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // ⚠️ fallback (se der erro no profile)
  if (error || !profile) {
    return NextResponse.redirect(new URL("/aluna/dashboard", request.url));
  }

  // 👑 ADMIN
  if (profile.role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 👩‍🎓 ALUNA (padrão)
  return NextResponse.redirect(new URL("/aluna/dashboard", request.url));
}