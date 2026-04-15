import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: { search: 5, chat: 3, diagnostico: 2, peticao: 0 },
  profissional: { search: 50, chat: 30, diagnostico: 15, peticao: 10 },
  escritorio: { search: 200, chat: 100, diagnostico: 50, peticao: 30 },
};

export async function checkRateLimit(
  userId: string,
  action: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user plan via security definer function
  const { data: planData } = await supabase.rpc("get_user_plan", {
    p_user_id: userId,
    p_env: "live",
  });
  const plan = planData || "free";
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const limit = limits[action] ?? 10;

  // If limit is 0, action is not allowed on this plan
  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0 };
  }

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
