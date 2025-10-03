import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
	}
	return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
