import { GameMetadata } from "@/types/analyzer";

export async function searchGameData(
  gameTitle: string,
  storeUrl: string
): Promise<Partial<GameMetadata>> {
  console.log(`[WebSearch] Calling Gemini API for: ${gameTitle}`);
  
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error("[WebSearch] VITE_SUPABASE_URL not configured");
      return {};
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/gemini`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: gameTitle,
        storeUrl,
        testMode: false,
      }),
    });

    if (!response.ok) {
      console.error(`[WebSearch] API error: ${response.status}`);
      return {};
    }

    const data = await response.json();
    console.log(`[WebSearch] Received metadata:`, {
      developer: data.developer,
      publisher: data.publisher,
      platforms: data.platforms,
      priceUSD: data.priceUSD,
      salesCopies: data.salesCopies,
      reviewScore: data.reviewScore,
      grounded: data.debug?.grounded,
    });

    // Map API response to GameMetadata format
    const metadata: Partial<GameMetadata> = {
      developer: data.developer,
      publisher: data.publisher,
      platforms: data.platforms,
      price: data.priceUSD !== null ? data.priceUSD : (data.priceLabel?.toLowerCase() === "free" ? "free" : undefined),
      reviewCount: data.reviewCount,
      reviewScore: data.reviewScore,
      copiesSold: data.salesCopies,
      peakPlayers: data.playerPeak,
    };

    return metadata;
  } catch (error) {
    console.error("[WebSearch] Error calling Gemini API:", error);
    return {};
  }
}
