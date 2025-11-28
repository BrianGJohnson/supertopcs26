"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    // Check URL for errors from OAuth provider
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      console.error("OAuth error:", error, errorDescription);
      setStatus(`Error: ${errorDescription || error}`);
      setTimeout(() => router.push(`/login?error=${error}`), 2000);
      return;
    }

    // Supabase JS client automatically detects the code in the URL and exchanges it
    // via PKCE using the code_verifier stored in localStorage. We just need to
    // listen for the auth state change.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session?.user?.email);
      
      if (event === "SIGNED_IN" && session) {
        router.push("/members/dashboard");
      } else if (event === "TOKEN_REFRESHED" && session) {
        router.push("/members/dashboard");
      }
    });

    // Also check if session already exists (in case the exchange already happened)
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Session already exists:", session.user?.email);
        router.push("/members/dashboard");
      }
    };

    // Small delay to let Supabase process the URL
    setTimeout(checkExistingSession, 500);

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <p className="text-white text-lg">{status}</p>
    </div>
  );
}
