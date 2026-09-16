import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { count: cueCount } = await supabase.from("cue_cards").select("*", { count: "exact", head: true });
const { count: p1Count } = await supabase.from("question_bank").select("*", { count: "exact", head: true }).eq("part", 1);
const { count: p3Count } = await supabase.from("question_bank").select("*", { count: "exact", head: true }).eq("part", 3);
const { count: p3Linked } = await supabase.from("question_bank").select("*", { count: "exact", head: true }).eq("part", 3).not("cue_card_id", "is", null);

console.log("cue_cards:", cueCount, "(expect 20)");
console.log("part 1 questions:", p1Count, "(expect 60)");
console.log("part 3 questions:", p3Count, "(expect 60)");
console.log("part 3 linked to a cue card:", p3Linked, "(expect 60)");
