import { createClient } from "@supabase/supabase-js";

// Retrieve URL and Key from both process.env (injected by Vite define) and import.meta.env
const supabaseUrl = (typeof process !== "undefined" && process.env?.SUPABASE_URL) || "https://yddycgrgvmlalznepvop.supabase.co";
const supabaseAnonKey = (typeof process !== "undefined" && process.env?.SUPABASE_ANON_KEY) || "sb_publishable_yaa1MyV9NR4fe1-ppLbTNQ_V6Lylk_6";

// Sanitize URL in case it has the rest/v1 suffix
const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "");

export const supabase = createClient(cleanUrl, supabaseAnonKey);
