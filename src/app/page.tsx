import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/primeiro-acesso");
  redirect(user.role === "ADMIN" ? "/admin" : "/dashboard");
}
