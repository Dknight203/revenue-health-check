import { GameMetadata, GameArchetype } from "@/types/analyzer";

export function classifyGame(metadata: GameMetadata): GameArchetype {
  const { platform, price, isMultiplayer, releaseState } = metadata;

  // Early stage games (not yet released or early access)
  if (releaseState === "upcoming" || releaseState === "early_access") {
    return "early_stage";
  }

  // Mobile games - typically F2P with IAP
  if (platform === "mobile") {
    return "f2p_mobile";
  }

  // Free games with multiplayer - likely live service
  if (price === "free" && isMultiplayer) {
    return "live_service";
  }

  // Free games without multiplayer - could be F2P indie or live service
  if (price === "free") {
    return isMultiplayer ? "live_service" : "f2p_mobile";
  }

  // Premium multiplayer - live service or AA/AAA
  if (isMultiplayer && typeof price === "number") {
    return price >= 30 ? "aa_premium" : "live_service";
  }

  // Premium single-player
  if (typeof price === "number") {
    return price >= 40 ? "aa_premium" : "premium_singleplayer";
  }

  // Default to premium single-player for indie/web games
  return "premium_singleplayer";
}

export function getArchetypeLabel(archetype: GameArchetype): string {
  const labels: Record<GameArchetype, string> = {
    premium_singleplayer: "Premium Single-Player",
    f2p_mobile: "Free-to-Play Mobile",
    live_service: "Live-Service Game",
    early_stage: "Early Stage / Pre-Launch",
    aa_premium: "Premium AA/AAA"
  };

  return labels[archetype];
}

export function getScoreInterpretation(score: number, archetype: GameArchetype): string {
  const thresholds = {
    premium_singleplayer: { strong: 70, moderate: 50 },
    f2p_mobile: { strong: 75, moderate: 55 },
    live_service: { strong: 75, moderate: 55 },
    early_stage: { strong: 70, moderate: 50 },
    aa_premium: { strong: 80, moderate: 60 }
  };

  const { strong, moderate } = thresholds[archetype];

  if (score >= strong) return "Strong foundation";
  if (score >= moderate) return "Solid base with optimization opportunities";
  return "Significant revenue optimization opportunities";
}
