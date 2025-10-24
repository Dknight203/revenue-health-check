import { GameMetadata, AIAnalysisResult, Opportunity, GameArchetype } from "@/types/analyzer";
import { classifyGame } from "./contextClassifier";

export function analyzeGame(metadata: GameMetadata, gameUrl: string): AIAnalysisResult {
  const archetype = classifyGame(metadata);
  metadata.archetype = archetype;

  const opportunities = detectOpportunities(metadata, archetype);
  const overallScore = calculateScore(opportunities, archetype);

  return {
    gameContext: metadata,
    overallScore,
    opportunities: opportunities.slice(0, 3), // Top 3 only
    gameUrl,
    timestamp: new Date().toISOString()
  };
}

function detectOpportunities(metadata: GameMetadata, archetype: GameArchetype): Opportunity[] {
  const opportunities: Opportunity[] = [];

  switch (archetype) {
    case "premium_singleplayer":
      opportunities.push(...detectPremiumSinglePlayerOpportunities(metadata));
      break;
    case "f2p_mobile":
      opportunities.push(...detectF2PMobileOpportunities(metadata));
      break;
    case "live_service":
      opportunities.push(...detectLiveServiceOpportunities(metadata));
      break;
    case "early_stage":
      opportunities.push(...detectEarlyStageOpportunities(metadata));
      break;
    case "aa_premium":
      opportunities.push(...detectAAPremiumOpportunities(metadata));
      break;
  }

  return opportunities.sort((a, b) => {
    const relevanceOrder = { critical: 0, high: 1, medium: 2 };
    return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
  });
}

function detectPremiumSinglePlayerOpportunities(metadata: GameMetadata): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Check for pricing optimization
  if (typeof metadata.price === "number" && metadata.price < 10) {
    opportunities.push({
      category: "Pricing Strategy",
      diagnosis: "Price point may be undervaluing your game compared to market expectations",
      actions: [
        "Research comparable titles in your genre to establish market-rate pricing",
        "Test a launch discount strategy (15-20% off) to build early momentum while targeting higher base price"
      ],
      relevance: "high"
    });
  }

  // Check for review optimization
  if (metadata.reviewScore && metadata.reviewScore < 75) {
    opportunities.push({
      category: "User Experience",
      diagnosis: "Review score indicates friction in core experience or expectations mismatch",
      actions: [
        "Analyze negative reviews to identify top 3 recurring complaints",
        "Add optional tutorial or difficulty settings to reduce early-game frustration"
      ],
      relevance: "critical"
    });
  }

  // Generic opportunity for premium games
  opportunities.push({
    category: "Launch Optimization",
    diagnosis: "Premium single-player games benefit from strong launch momentum and word-of-mouth",
    actions: [
      "Add a free demo to improve wishlist-to-purchase conversion by 20-30%",
      "Prepare 3-5 key creator outreach messages with game keys for launch week"
    ],
    relevance: "high"
  });

  return opportunities;
}

function detectF2PMobileOpportunities(metadata: GameMetadata): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // IAP structure opportunities
  opportunities.push({
    category: "Monetization Structure",
    diagnosis: "F2P mobile games need clear IAP value hierarchy to maximize conversion",
    actions: [
      "Add a 'Best Value' visual badge to your mid-tier IAP pack to anchor player perception",
      "Test a $0.99 starter pack within first 3 minutes of gameplay to convert early engagement"
    ],
    relevance: "critical"
  });

  // Retention mechanics
  opportunities.push({
    category: "Retention Systems",
    diagnosis: "Mobile games live or die on daily active user retention and habit formation",
    actions: [
      "Implement a 7-day login calendar with escalating rewards to build daily habit",
      "Add a comeback reward triggered 24 hours after last session to recover lapsed players"
    ],
    relevance: "critical"
  });

  // Subscription opportunity
  opportunities.push({
    category: "Recurring Revenue",
    diagnosis: "Subscription models increase lifetime value 3-5x for engaged mobile players",
    actions: [
      "Design a VIP subscription ($4.99-$9.99/month) with exclusive cosmetics and convenience bonuses",
      "Offer first-time subscribers a 3-day free trial to reduce friction"
    ],
    relevance: "high"
  });

  return opportunities;
}

function detectLiveServiceOpportunities(metadata: GameMetadata): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Content cadence
  opportunities.push({
    category: "Content Rhythm",
    diagnosis: "Live service games require consistent content updates to maintain player engagement",
    actions: [
      "Publish a 6-week content roadmap visible in-game and on social channels",
      "Establish a weekly mini-event and bi-weekly major update schedule to create reliable touchpoints"
    ],
    relevance: "critical"
  });

  // Community hub
  opportunities.push({
    category: "Community Management",
    diagnosis: "Active communities drive word-of-mouth growth and improve retention by 25-40%",
    actions: [
      "Create a Discord server with auto-roles for verified players and clear channel structure",
      "Post one gameplay clip or community highlight per week to feed social channels"
    ],
    relevance: "high"
  });

  // Monetization for live service
  if (metadata.price === "free") {
    opportunities.push({
      category: "Battle Pass Design",
      diagnosis: "Free live-service games need battle pass or season systems for recurring revenue",
      actions: [
        "Design a 60-day battle pass with 50 tiers priced at $9.99 with cosmetic rewards",
        "Offer a free track with 20% of rewards to showcase value to non-payers"
      ],
      relevance: "high"
    });
  }

  return opportunities;
}

function detectEarlyStageOpportunities(metadata: GameMetadata): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Pre-launch audience building
  opportunities.push({
    category: "Audience Building",
    diagnosis: "Pre-launch games must build an email list and community before launch day",
    actions: [
      "Add email capture to your game's website with a launch-day notification promise",
      "Create a Discord server now and seed it with alpha/beta testers for day-one momentum"
    ],
    relevance: "critical"
  });

  // Demo / beta access
  if (metadata.releaseState === "early_access") {
    opportunities.push({
      category: "Early Access Strategy",
      diagnosis: "Early Access games need clear roadmap communication to set expectations",
      actions: [
        "Publish a public roadmap showing planned features and estimated timelines",
        "Establish a bi-weekly devlog cadence to build transparency and trust"
      ],
      relevance: "critical"
    });
  } else {
    opportunities.push({
      category: "Pre-Launch Demo",
      diagnosis: "Pre-launch demos increase wishlist conversion and provide valuable feedback",
      actions: [
        "Submit a polished 30-60 minute demo to Steam Next Fest or equivalent event",
        "Add clear 'Wishlist Now' CTAs at demo completion to capture engaged players"
      ],
      relevance: "high"
    });
  }

  // Launch timing
  opportunities.push({
    category: "Launch Timing",
    diagnosis: "Launch windows heavily impact first-week visibility and sales momentum",
    actions: [
      "Avoid major AAA releases and holidays - target January, March, or September windows",
      "Prepare 10+ game keys for creator outreach starting 2 weeks before launch"
    ],
    relevance: "medium"
  });

  return opportunities;
}

function detectAAPremiumOpportunities(metadata: GameMetadata): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // DLC / Season pass
  opportunities.push({
    category: "Post-Launch Revenue",
    diagnosis: "Premium AA/AAA titles benefit from planned DLC and season pass strategies",
    actions: [
      "Design a Year 1 content roadmap with 2-3 major DLC drops priced at $15-$25 each",
      "Offer a season pass pre-order at 15-20% discount to secure early commitment"
    ],
    relevance: "high"
  });

  // Community for AAA
  opportunities.push({
    category: "Community Engagement",
    diagnosis: "AAA games require active community management for sustained player base",
    actions: [
      "Establish official forums or Discord with dedicated community managers",
      "Run monthly community events or challenges with in-game rewards"
    ],
    relevance: "medium"
  });

  return opportunities;
}

function calculateScore(opportunities: Opportunity[], archetype: GameArchetype): number {
  const maxScore = 100;
  const criticalIssues = opportunities.filter(o => o.relevance === "critical").length;
  const highIssues = opportunities.filter(o => o.relevance === "high").length;
  const mediumIssues = opportunities.filter(o => o.relevance === "medium").length;

  // Different archetypes have different penalty weights
  const weights = {
    premium_singleplayer: { critical: 20, high: 12, medium: 8 },
    f2p_mobile: { critical: 25, high: 15, medium: 8 },
    live_service: { critical: 25, high: 15, medium: 10 },
    early_stage: { critical: 20, high: 12, medium: 8 },
    aa_premium: { critical: 18, high: 12, medium: 8 }
  };

  const archetypeWeights = weights[archetype];
  const penalty = 
    (criticalIssues * archetypeWeights.critical) +
    (highIssues * archetypeWeights.high) +
    (mediumIssues * archetypeWeights.medium);

  return Math.max(0, Math.min(100, maxScore - penalty));
}
