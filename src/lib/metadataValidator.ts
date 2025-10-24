import { GameMetadata } from "@/types/analyzer";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateGameMetadata(metadata: GameMetadata): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate title
  if (!metadata.title || metadata.title === "Unknown Game") {
    errors.push("Game title could not be extracted");
  } else if (metadata.title.length < 2) {
    errors.push("Game title is too short");
  } else if (metadata.title.length > 200) {
    errors.push("Game title is unusually long");
  }

  // Validate platform
  const validPlatforms = ['steam', 'mobile', 'console', 'web', 'indie'];
  if (!validPlatforms.includes(metadata.platform)) {
    errors.push("Invalid platform detected");
  }

  // Validate price
  if (metadata.price !== "free" && typeof metadata.price !== "number") {
    errors.push("Price format is invalid");
  } else if (typeof metadata.price === "number" && (metadata.price < 0 || metadata.price > 1000)) {
    warnings.push("Unusual price detected");
  }

  // Validate archetype
  const validArchetypes = ['premium_singleplayer', 'f2p_mobile', 'live_service', 'early_stage', 'aa_premium'];
  if (!validArchetypes.includes(metadata.archetype)) {
    errors.push("Invalid game archetype");
  }

  // Validate release state
  const validReleaseStates = ['upcoming', 'early_access', 'live'];
  if (!validReleaseStates.includes(metadata.releaseState)) {
    warnings.push("Unusual release state detected");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
