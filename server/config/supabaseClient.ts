import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables if they haven't been loaded
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[SUPABASE WARNING] Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment. Supabase client initialized with placeholders."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
