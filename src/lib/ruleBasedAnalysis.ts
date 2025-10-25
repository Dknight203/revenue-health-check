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

  // Only suggest pricing changes for upcoming/early access games
  if (typeof metadata.price === "number" && metadata.price < 10 && 
      (metadata.releaseState === "upcoming" || metadata.releaseState === "early_access")) {
    opportunities.push({
      category: "Pricing Strategy",
      diagnosis: "Price point may be undervaluing your game compared to market expectations",
      actions: [
        "Research comparable titles in your genre to establish market-rate pricing",
        "Consider a $14.99-$19.99 base price with a 15% launch discount to build early momentum"
      ],
      relevance: "high"
    });
  }

  // Review optimization - only for launched games with review data
  if (metadata.releaseState === "live" && metadata.reviewScore && metadata.reviewScore < 75) {
    opportunities.push({
      category: "User Experience",
      diagnosis: "Review score indicates friction in core experience or expectations mismatch",
      actions: [
        "Analyze the top 50 negative reviews to identify the most common criticisms",
        "Prioritize fixing the top 2-3 recurring complaints before investing in marketing"
      ],
      relevance: "critical"
    });
  }

  // Context-aware launch/post-launch recommendations
  if (metadata.platform === "steam" || metadata.platform === "indie") {
    if (metadata.releaseState === "upcoming" || metadata.releaseState === "early_access") {
      opportunities.push({
        category: "Launch Optimization",
        diagnosis: "Early visibility and conversion patterns set long term trajectory.",
        actions: [
          "Add a demo or wishlist landing seven days before launch to start building momentum",
          "Secure three creator partnerships and prepare launch day coverage to maximize day one reach"
        ],
        relevance: "high"
      });
    } else if (metadata.releaseState === "live") {
      // Only show quality issues if reviews are poor
      if (metadata.reviewScore && metadata.reviewScore < 70) {
        opportunities.push({
          category: "Product Quality",
          diagnosis: "Below-average reviews are limiting word-of-mouth growth and conversion rates.",
          actions: [
            "Analyze the top 50 negative reviews to identify the most common criticisms",
            "Address the top 2-3 recurring issues in a focused patch before marketing spend"
          ],
          relevance: "critical"
        });
      }
      // Otherwise, focus on visibility
      else {
        opportunities.push({
          category: "Post-Launch Visibility",
          diagnosis: "Sustained visibility requires ongoing marketing touchpoints beyond launch week.",
          actions: [
            "Identify 3-5 content creators whose audience matches your game and offer review keys",
            "Plan seasonal discount participation (Steam sales, holiday events) to capture new audience waves"
          ],
          relevance: "high"
        });
      }
    }
  }

  return opportunities;
}

function detectF2PMobileOpportunities(metadata: GameMetadata): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Only suggest mobile-specific advice if actually on mobile platforms
  if (metadata.platform !== "mobile") {
    // If classified as F2P mobile but not on mobile stores, provide web-specific advice
    opportunities.push({
      category: "Platform Strategy",
      diagnosis: "F2P games benefit from mobile app store distribution and discoverability",
      actions: [
        "Consider developing iOS/Android versions to access mobile app store audiences",
        "If staying web-based, focus on browser-based distribution (Kongregate, Newgrounds, etc.)"
      ],
      relevance: "high"
    });
    return opportunities;
  }

  // For actual mobile games, provide conditional advice
  
  // Always relevant: Monetization structure
  opportunities.push({
    category: "Monetization Clarity",
    diagnosis: "Mobile players need clear value signals to convert from free to paying",
    actions: [
      "Add visual hierarchy to IAP offerings with a 'Best Value' badge on mid-tier packs",
      "Test a low-friction starter pack ($0.99-$1.99) within first 5 minutes of gameplay"
    ],
    relevance: "high"
  });

  // Always relevant: Retention
  opportunities.push({
    category: "Retention Systems",
    diagnosis: "Daily active user retention drives mobile game success and monetization potential",
    actions: [
      "Implement a 7-day login calendar with escalating rewards to build daily habit",
      "Add a comeback reward triggered 24-48 hours after last session to recover lapsed players"
    ],
    relevance: "high"
  });

  return opportunities;
}

function detectLiveServiceOpportunities(metadata: GameMetadata): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Check if multiplayer (most live service games are)
  if (!metadata.isMultiplayer) {
    opportunities.push({
      category: "Live Service Model Fit",
      diagnosis: "Single-player games struggle to sustain live service engagement patterns",
      actions: [
        "Consider episodic or seasonal content drops rather than ongoing live operations",
        "Evaluate if a traditional premium DLC model might better fit your game's structure"
      ],
      relevance: "high"
    });
    return opportunities;
  }

  // For multiplayer live service games
  
  // Community is critical for live service
  opportunities.push({
    category: "Community Infrastructure",
    diagnosis: "Live service success depends on active community engagement and communication",
    actions: [
      "Establish a central community hub (Discord, forums, or Reddit) if not already active",
      "Post weekly game updates or community highlights to maintain engagement between content drops"
    ],
    relevance: "critical"
  });

  // Content cadence (but more nuanced)
  if (metadata.releaseState === "live") {
    opportunities.push({
      category: "Content Rhythm",
      diagnosis: "Players disengage from live service games without visible upcoming content",
      actions: [
        "Share a high-level content roadmap (next 4-8 weeks) to set player expectations",
        "Establish a predictable event cadence (weekly/bi-weekly) so players know when to return"
      ],
      relevance: "high"
    });
  }

  return opportunities;
}

function detectEarlyStageOpportunities(metadata: GameMetadata): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Audience building is always critical pre-launch
  opportunities.push({
    category: "Audience Building",
    diagnosis: "Pre-launch visibility directly correlates with launch-week sales performance",
    actions: [
      "Add email capture to your game's landing page with launch-day notification promise",
      "Build a community space (Discord, Reddit, or forums) and seed it with early playtesters"
    ],
    relevance: "critical"
  });

  // Demo strategy - platform-specific
  if (metadata.platform === "steam") {
    opportunities.push({
      category: "Pre-Launch Demo",
      diagnosis: "Steam demos increase wishlist conversion rates by 20-40% on average",
      actions: [
        "Create a 30-60 minute demo showcasing your game's core loop and unique features",
        "Submit to Steam Next Fest or feature it on your store page with clear wishlist CTAs"
      ],
      relevance: "high"
    });
  } else if (metadata.platform === "mobile") {
    opportunities.push({
      category: "Soft Launch Testing",
      diagnosis: "Mobile games benefit from regional soft launches to test retention and monetization",
      actions: [
        "Soft launch in 1-2 smaller markets to gather retention and monetization data",
        "Use pre-registration campaigns on App Store/Google Play to build launch momentum"
      ],
      relevance: "high"
    });
  } else if (metadata.platform === "indie" || metadata.platform === "web") {
    opportunities.push({
      category: "Beta Access Strategy",
      diagnosis: "Indie games build community through early access to development process",
      actions: [
        "Offer playable beta access to email subscribers to gather feedback and build advocates",
        "Consider itch.io for early builds to reach indie game enthusiast audience"
      ],
      relevance: "high"
    });
  }

  // Early Access specific
  if (metadata.releaseState === "early_access") {
    opportunities.push({
      category: "Early Access Communication",
      diagnosis: "Early Access success requires clear roadmap communication and regular updates",
      actions: [
        "Publish a public roadmap showing planned features and realistic timelines",
        "Establish a bi-weekly devlog cadence to build transparency and trust with your community"
      ],
      relevance: "critical"
    });
  }

  return opportunities;
}

function detectAAPremiumOpportunities(metadata: GameMetadata): Opportunity[] {
  const opportunities: Opportunity[] = [];

  // Only suggest DLC for multiplayer or live service AAA games
  if (metadata.isMultiplayer) {
    opportunities.push({
      category: "Post-Launch Revenue",
      diagnosis: "Multiplayer AAA titles sustain revenue through seasonal content and cosmetics",
      actions: [
        "Design a Year 1 content plan with 2-3 major content drops (maps, modes, or story)",
        "Consider battle pass or season pass model to create recurring revenue from engaged players"
      ],
      relevance: "high"
    });
    
    opportunities.push({
      category: "Community Management",
      diagnosis: "Multiplayer games require active community management for sustained player base",
      actions: [
        "Establish official community channels with dedicated moderation and support",
        "Run monthly in-game events or challenges to maintain engagement between content drops"
      ],
      relevance: "high"
    });
  } else {
    // Single-player AAA games
    opportunities.push({
      category: "Post-Launch Visibility",
      diagnosis: "Premium single-player games benefit from sustained marketing beyond launch window",
      actions: [
        "Identify high-reach content creators for post-launch coverage and let's-play series",
        "Plan discount participation in major platform sales (Steam, console seasonal sales)"
      ],
      relevance: "high"
    });
    
    // Only suggest DLC if genre supports it (not story-focused games)
    if (!metadata.genre.some(g => ['narrative', 'visual novel', 'adventure'].includes(g.toLowerCase()))) {
      opportunities.push({
        category: "Content Extensions",
        diagnosis: "Premium games can extend lifetime value through meaningful content additions",
        actions: [
          "Consider post-launch content DLC if it fits your game's structure (new levels, modes, etc.)",
          "Focus on high-quality expansions that justify premium pricing rather than cosmetics"
        ],
        relevance: "medium"
      });
    }
  }

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
