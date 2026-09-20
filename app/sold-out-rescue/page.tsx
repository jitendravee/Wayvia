import { redirect } from "next/navigation";

export default function SoldOutRescueRedirectPage() {
  redirect("/emergency-travel");
}
