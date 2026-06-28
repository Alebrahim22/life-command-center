import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tcgxbmufnjiycnnzkohj.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjZ3hibXVmbmppeWNubnprb2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODQ3MjIsImV4cCI6MjA5ODE2MDcyMn0.2brTx1gYeUMjGrPl_U_Z1Q7zqwIB5HscYrlBjFEatAg"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
