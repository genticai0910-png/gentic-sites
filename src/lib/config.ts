export const siteConfig = {
  name: "Gentic AI",
  tagline: "AI Automation Systems",
  domain: "genticai.pro",

  hero: {
    headline: "$57K MRR. 500+ Automations.\nZero Guesswork.",
    subheadline:
      "I architect AI systems for businesses that want to scale. Voice agents, lead scoring, and full pipelines that run while you sleep.",
    cta: "Book a Free Audit",
    ctaLink: "#contact",
    videoSrc: "/hero-video.mp4",
    posterSrc: "/hero-poster.jpg",
  },

  logos: [
    { name: "n8n", icon: "n8n" },
    { name: "HubSpot", icon: "hubspot" },
    { name: "Twilio", icon: "twilio" },
    { name: "Bland AI", icon: "bland" },
    { name: "Supabase", icon: "supabase" },
    { name: "OpenAI", icon: "openai" },
  ],

  problem: {
    headline: "Sound Familiar?",
    pain: "10 tools. Zero integration. Your team spends more time switching tabs than closing deals.",
    solution:
      "One AI system. Everything connected. Leads flow in, get scored, get called. Automatically.",
    painTitle: "The Chaos",
    solutionTitle: "The Clarity",
  },

  services: [
    {
      icon: "voice",
      title: "AI Voice Agents",
      description:
        "24/7 AI callers that qualify leads, book appointments, and follow up. Powered by Bland AI and Twilio with natural conversation flow.",
    },
    {
      icon: "score",
      title: "iRELOP Lead Scoring",
      description:
        "100-point proprietary scoring system that ranks every lead by Motivation, Opportunity, and Profile. You only chase deals worth closing.",
    },
    {
      icon: "pipeline",
      title: "Full Pipeline Automation",
      description:
        "From first touch to closed deal. Automated workflows that route, nurture, and convert without manual intervention.",
    },
  ],

  howItWorks: [
    {
      step: 1,
      title: "Audit",
      description:
        "We map every revenue bottleneck in your operation. Where leads leak, where time burns, where money sleeps.",
    },
    {
      step: 2,
      title: "Build",
      description:
        "Custom AI systems deployed in under 2 weeks. Voice agents, scoring, pipelines. All wired into your existing stack.",
    },
    {
      step: 3,
      title: "Scale",
      description:
        "Ongoing optimization, monitoring, and expansion. Your AI systems compound. More data, better decisions, higher ROI.",
    },
  ],

  capabilities: [
    {
      title: "Inbound Lead Qualification",
      description: "AI answers, qualifies, and routes every inbound lead. Day or night.",
    },
    {
      title: "Outbound Voice Campaigns",
      description: "Automated calling sequences that sound human and convert.",
    },
    {
      title: "CRM Pipeline Automation",
      description: "Leads move through HubSpot/Salesforce stages without manual data entry.",
    },
    {
      title: "Smart Appointment Booking",
      description: "AI schedules meetings directly on your calendar with zero friction.",
    },
    {
      title: "Real-Time Lead Scoring",
      description: "Every lead scored instantly. Hot leads get calls, warm leads get nurture.",
    },
    {
      title: "Multi-Channel Follow-Up",
      description: "Voice, SMS, and email sequences triggered by lead behavior and score.",
    },
  ],

  finalCta: {
    headline: "Ready to Stop Guessing?",
    subheadline:
      "Book a free automation audit and see exactly where AI can 10x your pipeline.",
    cta: "Book a Free Audit",
    ctaLink: "#contact",
  },

  contact: {
    headline: "Let's Talk",
    subheadline: "Tell us about your business and we'll show you what we'd automate first.",
  },

  footer: {
    copyright: "© 2026 Gentic AI. All rights reserved.",
    links: [
      { label: "Services", href: "#services" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Contact", href: "#contact" },
    ],
  },

  analytics: {
    ga4Id: "", // GA-XXXXXXXXX
    metaPixelId: "", // Populate before ads
  },

  hubspot: {
    portalId: "244742237",
    formId: "", // Create form in HubSpot, paste ID here
  },

  webhooks: {
    telegramNotify: "", // n8n webhook URL for Telegram notifications
  },
} as const;
