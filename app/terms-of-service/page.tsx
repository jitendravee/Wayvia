import Link from "next/link";
import { Ban, CheckCircle2, CreditCard, Scale, ShieldCheck, Users, XCircle } from "lucide-react";
import LegalPageLayout from "../components/legal/LegalPageLayout";
import { LegalFooterNote } from "../components/legal/LegalFooterNote";
import type { LegalSectionData } from "../components/legal/LegalSection";

export const metadata = {
  title: "Terms of Service — Wayvia",
  description: "The terms that govern your use of Wayvia.",
};

const sections: LegalSectionData[] = [
  {
    icon: CheckCircle2,
    title: "1. Acceptance of Terms",
    description: "By accessing or using Wayvia, you agree to these Terms of Service and our policies.",
  },
  {
    icon: Users,
    title: "2. Use of Our Services",
    description:
      "You agree to use Wayvia only for lawful purposes and in accordance with these terms. You must not misuse or attempt to disrupt our platform.",
  },
  {
    icon: CreditCard,
    title: "3. Bookings and Payments",
    description: "All bookings are subject to availability. Prices are subject to change. Payment must be completed to confirm a booking.",
  },
  {
    icon: XCircle,
    title: "4. Cancellations and Refunds",
    description: (
      <>
        Cancellations and refund eligibility are subject to our{" "}
        <Link href="/refund-policy" className="font-semibold text-violet underline underline-offset-2 transition hover:text-violet-dark">
          Refund Policy
        </Link>
        . Please review it before making any booking.
      </>
    ),
  },
  {
    icon: ShieldCheck,
    title: "5. User Responsibilities",
    description: "You are responsible for the accuracy of the information you provide. You must keep your account credentials confidential.",
  },
  {
    icon: Ban,
    title: "6. Limitation of Liability",
    description:
      "Wayvia is not liable for delays, cancellations, or changes caused by third-party service providers (e.g., airlines, railways, bus operators).",
  },
  {
    icon: Scale,
    title: "7. Changes to Terms",
    description: "We may modify these terms at any time. Continued use of Wayvia after changes means you accept the new terms.",
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="May 20, 2025"
      intro="Please read these Terms of Service carefully before using Wayvia. By accessing or using our platform, you agree to be bound by these terms."
      variant="terms"
      sections={sections}
      footerNote={
        <LegalFooterNote icon={CheckCircle2}>
          By using Wayvia, you agree to these Terms of Service and our{" "}
          <Link
            href="/privacy-policy"
            className="font-semibold text-violet underline underline-offset-2 transition hover:text-violet-dark"
          >
            Privacy Policy
          </Link>
          .
        </LegalFooterNote>
      }
    />
  );
}