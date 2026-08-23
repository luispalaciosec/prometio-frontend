import { supabase } from "@/lib/supabase"

const CALENDAR_SCOPES = [
  "email",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ")

export async function iniciarConexionCalendar(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/cuenta")}&calendar=1`,
      scopes: CALENDAR_SCOPES,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })
  if (error) {
    throw error
  }
}
