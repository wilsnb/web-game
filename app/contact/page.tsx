import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ContactTabs } from "@/components/ContactTabs";

export const metadata: Metadata = {
  title: "Contact & feedback",
  description: "Get in touch with the Qwardoo team or share your feedback.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/contact");

  // Prefill name from the chosen username / Google name; email from account.
  const profile = await getProfile();
  const meta = user.user_metadata ?? {};
  const defaultName =
    profile?.username ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    user.email?.split("@")[0] ||
    "";
  const defaultEmail = user.email ?? "";

  const initialTab = type === "feedback" ? "feedback" : "contact";

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-[560px] px-md py-section sm:px-lg">
        <ContactTabs
          initialTab={initialTab}
          defaultName={defaultName}
          defaultEmail={defaultEmail}
        />
      </section>

      <SiteFooter />
    </div>
  );
}
