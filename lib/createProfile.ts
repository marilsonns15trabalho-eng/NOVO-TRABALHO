import { createClient } from "@/utils/supabase/client";

export async function createProfileIfNotExists(user: any) {
  const supabase = createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || "",
      role: "student",
    });
  }
}