import { GameMetadata } from "@/types/analyzer";
import { GoogleGenerativeAI, DynamicRetrievalMode } from "@google/generative-ai";

export async function searchGameData(
  gameTitle: string,
  storeUrl: string
): Promise<Partial<GameMetadata>> {
  console.log(`[WebSearch] Searching for game: ${gameTitle}`);
  
  const metadata: Partial<GameMetadata> = {};

  try {
    // Search 1: Developer & Publisher
    const devPubSchema = {
      developer: "string or null",
      publisher: "string or null",
      sources: [{ title: "string", url: "string" }]
    };
    
    const siteScope = storeUrl.includes('steam') ? 'site:steampowered.com OR site:wikipedia.org' :
      storeUrl.includes('playstation') ? 'site:playstation.com OR site:wikipedia.org' :
      storeUrl.includes('xbox') ? 'site:xbox.com OR site:wikipedia.org' :
      storeUrl.includes('nintendo') ? 'site:nintendo.com OR site:wikipedia.org' :
      storeUrl.includes('epic') ? 'site:epicgames.com OR site:wikipedia.org' :
      storeUrl.includes('gog') ? 'site:gog.com OR site:wikipedia.org' :
      storeUrl.includes('itch') ? 'site:itch.io OR site:wikipedia.org' :
      'site:wikipedia.org';
    
    const devPubResult = await performWebSearch(
      `"${gameTitle}" developer publisher ${siteScope}`,
      devPubSchema,
      3
    );
    metadata.developer = devPubResult.data.developer;
    metadata.publisher = devPubResult.data.publisher;

    // Search 2: Platforms
    const platformsSchema = {
      platforms: ["array of strings"],
      sources: [{ title: "string", url: "string" }]
    };
    
    const platformsResult = await performWebSearch(
      `"${gameTitle}" platforms Windows Mac Linux PlayStation Xbox Nintendo Switch Steam Deck`,
      platformsSchema,
      3
    );
    metadata.platforms = platformsResult.data.platforms || [];

    // Search 3: Price (NEW!)
    const priceSchema = {
      priceUSD: "number or null",
      currency: "string or null",
      sources: [{ title: "string", url: "string" }]
    };

    const priceQuery = `"${gameTitle}" price USD ${siteScope}`;
    const priceResult = await performWebSearch(priceQuery, priceSchema, 2);
    
    if (priceResult.data.priceUSD !== null && priceResult.data.priceUSD !== undefined) {
      metadata.price = priceResult.data.priceUSD;
    } else if (priceResult.data.currency?.toLowerCase() === "free" || 
               String(priceResult.data.priceUSD).toLowerCase() === "free") {
      metadata.price = "free";
    }

    // Search 4: Sales data
    const salesSchema = {
      salesCopies: "number or null",
      salesMilestone: "string or null",
      estimatedOwners: "string or null",
      estimatedRevenue: "string or null",
      sources: [{ title: "string", url: "string" }]
    };

    const salesResult = await performWebSearch(
      `"${gameTitle}" copies sold units sold revenue site:steamdb.info OR site:gamalytic.com OR site:steamspy.com`,
      salesSchema,
      3
    );
    metadata.copiesSold = salesResult.data.salesCopies;
    metadata.salesMilestone = salesResult.data.salesMilestone;
    metadata.estimatedOwners = salesResult.data.estimatedOwners;
    metadata.estimatedRevenue = salesResult.data.estimatedRevenue;

    // Search 5: Player metrics (Steam only)
    if (storeUrl.includes('steam')) {
      const playersSchema = {
        currentPlayers: "number or null",
        peakPlayers: "number or null",
        sources: [{ title: "string", url: "string" }]
      };

      const playersResult = await performWebSearch(
        `"${gameTitle}" site:steamdb.info players peak current`,
        playersSchema,
        2
      );
      metadata.currentPlayers = playersResult.data.currentPlayers;
      metadata.peakPlayers = playersResult.data.peakPlayers;
    }

    // Search 6: Review data
    const reviewsSchema = {
      reviewCount: "number or null",
      reviewScore: "number or null",
      sources: [{ title: "string", url: "string" }]
    };

    const reviewsResult = await performWebSearch(
      `"${gameTitle}" reviews rating score site:steampowered.com OR site:metacritic.com`,
      reviewsSchema,
      3
    );
    metadata.reviewCount = reviewsResult.data.reviewCount;
    metadata.reviewScore = reviewsResult.data.reviewScore;

    console.log(`[WebSearch] Final enriched metadata:`, {
      developer: metadata.developer,
      publisher: metadata.publisher,
      platforms: metadata.platforms,
      price: metadata.price,
      copiesSold: metadata.copiesSold,
      reviewCount: metadata.reviewCount,
      reviewScore: metadata.reviewScore,
      peakPlayers: metadata.peakPlayers,
    });

    return metadata;
  } catch (error) {
    console.error("[WebSearch] Error during web search:", error);
    return metadata;
  }
}

async function performWebSearch(
  query: string, 
  schema: any,
  numResults: number = 5
): Promise<{ data: any; grounded: boolean; sources: string[] }> {
  console.log(`[WebSearch] Gemini search: ${query}`);
  
  try {
    const genAI = new GoogleGenerativeAI("AIzaSyDIiYmV7KipsHjXu7au3jxVTaJLZ0GWm2A");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{ 
        googleSearchRetrieval: { 
          dynamicRetrievalConfig: { 
            mode: DynamicRetrievalMode.MODE_DYNAMIC,
            dynamicThreshold: 0.3
          } 
        } 
      }],
      generationConfig: {
        temperature: 0.2,
      }
    });

    const prompt = `Search Google for: ${query}

Return ONLY valid JSON matching this exact schema:
${JSON.stringify(schema, null, 2)}

Rules:
- Return ONLY JSON, no prose or explanations
- Use null for missing data
- Normalize platform names to: Windows, Mac, Linux, PlayStation 5, Xbox Series X/S, Nintendo Switch, Steam Deck
- Extract exact prices in USD (e.g., 14.99 or null)
- Include source URLs in the "sources" array
- For free games, set priceUSD to 0 and currency to "free"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Strip code fences if present
    text = text.replace(/```json|```/g, "").trim();
    
    // Parse JSON
    const data = JSON.parse(text);
    
    // Extract grounding metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const grounded = groundingChunks.length > 0;
    const sources = groundingChunks
      .map((chunk: any) => chunk.web?.uri)
      .filter(Boolean);
    
    console.log(`[WebSearch] Found ${sources.length} grounded sources:`, sources);
    
    if (text.length < 20) {
      console.warn(`[WebSearch] Suspiciously short response for query: ${query}`);
    }
    
    return { data, grounded, sources };
  } catch (error) {
    console.error('[WebSearch] Gemini search error:', error);
    throw error;
  }
}
