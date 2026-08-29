import Link from "next/link";
import { FileText, Settings, Share2, ShieldCheck, User, UserPlus } from "lucide-react";
import LegalPageLayout from "../components/legal/LegalPageLayout";
import { LegalFooterNote } from "../components/legal/LegalFooterNote";
import type { LegalSectionData } from "../components/legal/LegalSection";

export const metadata = {
  title: "Privacy Policy — Wayvia",
  description: "How Wayvia collects, uses, and protects your information.",
};

const sections: LegalSectionData[] = [
  {
    icon: User,
    title: "1. Information We Collect",
    description: "We collect information to provide and improve our services to you.",
    items: [
      { label: "Personal Information", text: "Name, email, phone number, payment details (when you book)." },
      { label: "Usage Information", text: "Search queries, route preferences, device information, IP address." },
      { label: "Location Information", text: "Used only to show relevant routes and nearby options." },
    ],
  },
  {
    icon: Settings,
    title: "2. How We Use Your Information",
    description: "We use the information we collect to:",
    items: [
      { text: "Provide, operate, and maintain our services" },
      { text: "Improve, personalize, and expand our platform" },
      { text: "Communicate with you about your bookings and updates" },
      { text: "Ensure safety, prevent fraud, and resolve disputes" },
    ],
  },
  {
    icon: Share2,
    title: "3. How We Share Your Information",
    description: "We do not sell your personal data. We may share your information with:",
    items: [
      { label: "Service Providers", text: "Trusted partners who help us operate our platform" },
      { label: "Legal Requirements", text: "When required by law or to protect our rights" },
      { label: "Business Transfers", text: "In case of merger, acquisition, or asset sale" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "4. Data Security",
    description: "We implement industry-standard security measures to protect your data. However, no system is 100% secure.",
  },
  {
    icon: UserPlus,
    title: "5. Your Choices",
    description: "You can access, update, or delete your information anytime from your account settings.",
  },
  {
    icon: FileText,
    title: "6. Changes to This Policy",
    description: "We may update this policy from time to time. We'll notify you of significant changes.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="May 20, 2025"
      intro="At Wayvia, your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform."
      variant="privacy"
      sections={sections}
      footerNote={
        <LegalFooterNote icon={ShieldCheck}>
          By using Wayvia, you agree to this Privacy Policy and our{" "}
          <Link
            href="/terms-of-service"
            className="font-semibold text-violet underline underline-offset-2 transition hover:text-violet-dark"
          >
            Terms of Service
          </Link>
          .
        </LegalFooterNote>
      }
    />
  );
}