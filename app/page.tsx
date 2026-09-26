import Desktop from "@/components/desktop/Desktop";
import { EDUCATION, PROFILE, SITE_URL, SKILLS } from "@/data/profile";

/** Structured data so search engines understand who the site is about */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PROFILE.name,
  jobTitle: PROFILE.role,
  description: PROFILE.summary,
  url: SITE_URL,
  email: `mailto:${PROFILE.email}`,
  address: { "@type": "PostalAddress", addressLocality: PROFILE.city, addressCountry: PROFILE.countryCode },
  sameAs: [PROFILE.links.github, PROFILE.links.linkedin],
  knowsAbout: [...SKILLS.strong, ...SKILLS.ai],
  alumniOf: EDUCATION.map((e) => ({ "@type": "EducationalOrganization", name: e.school })),
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }} />
      {/* Keyboard and screen reader users can skip the desktop entirely */}
      <a
        href="/simple"
        className="sr-only z-[10000] focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:bg-white focus:px-3 focus:py-2 focus:text-[13px] focus:text-black focus:outline focus:outline-2 focus:outline-[#316ac5]"
      >
        Skip to the plain text version of this portfolio
      </a>
      <noscript>
        <p style={{ color: "#fff", padding: 16, fontFamily: "Tahoma, sans-serif" }}>
          This portfolio is an interactive Windows XP desktop and needs JavaScript. Read the <a href="/simple" style={{ color: "#9cf" }}>plain text version</a> instead.
        </p>
      </noscript>
      <Desktop />
    </>
  );
}
