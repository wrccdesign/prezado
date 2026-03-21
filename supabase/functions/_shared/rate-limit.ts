import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LIMITS: Record<string, number> = {
  search: 20,
  chat: 10,
  diagnostico: 5,
  peticao: 3,
};

export async function checkRateLimit(
  userId: string,
  action: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const limit = LIMITS[action] ?? 10;

  const today = new Date().toISOString().split("T")[0];

  const { count } = await supabase
    .from("usage_tracking")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", `${today}T00:00:00.000Z`);

  const used = count ?? 0;

  if (used >= limit) {
    return { allowed: false, used, limit };
  }

  await supabase.from("usage_tracking").insert({ user_id: userId, action });

  return { allowed: true, used: used + 1, limit };
}
