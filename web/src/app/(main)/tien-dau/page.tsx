import { redirect } from "next/navigation";

export default async function TienDauRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams({ g: "fuel" });
  if (sp.m) params.set("m", sp.m);
  redirect(`/tong-chi-phi?${params.toString()}`);
}
