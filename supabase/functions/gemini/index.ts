import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, DynamicRetrievalMode } from "npm:@google/generative-ai@^0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  title: string;
  storeUrl?: string;
  testMode?: boolean;
}

interface GroundedResult {
  data: any;
  citations: string[];
  grounded: boolean;
}

async function performGroundedJSON(
  genAI: GoogleGenerativeAI,
  prompt: string,
  schema: any,
  testMode: boolean = false
): Promise<GroundedResult> {
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

  const fullPrompt = `${prompt}

Return ONLY valid JSON matching this exact schema:
${JSON.stringify(schema, null, 2)}

Rules:
- Return ONLY JSON, no prose or explanations
- Use null for missing data
- Normalize platform names to: Windows, Mac, Linux, PlayStation 5, Xbox Series X/S, Nintendo Switch, Steam Deck
- Extract exact prices in USD (e.g., 14.99 or null)
- Include source URLs in the "sources" array
- For free games, set priceUSD to 0 and currency to "free"`;

  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  let text = response.text();

  // Strip code fences
  text = text.replace(/```json|```/g, "").trim();

  // Parse JSON
  const data = JSON.parse(text);

  // Extract grounding metadata
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const grounded = groundingChunks.length > 0;
  const citations = groundingChunks
    .map((chunk: any) => chunk.web?.uri)
    .filter(Boolean);

  if (testMode) {
    console.log(`[Gemini] Query: ${prompt}`);
    console.log(`[Gemini] Response (first 500 chars): ${text.substring(0, 500)}`);
    console.log(`[Gemini] Citations: ${citations.join(", ")}`);
  }

  return { data, citations, grounded };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SearchRequest = await req.json();
    const { title, storeUrl = "", testMode = false } = body;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Determine site scope based on store URL
    const siteScope = storeUrl.includes('steam') ? 'site:steampowered.com OR site:wikipedia.org' :
      storeUrl.includes('playstation') ? 'site:playstation.com OR site:wikipedia.org' :
      storeUrl.includes('xbox') ? 'site:xbox.com OR site:wikipedia.org' :
      storeUrl.includes('nintendo') ? 'site:nintendo.com OR site:wikipedia.org' :
      storeUrl.includes('epic') ? 'site:epicgames.com OR site:wikipedia.org' :
      storeUrl.includes('gog') ? 'site:gog.com OR site:wikipedia.org' :
      storeUrl.includes('itch') ? 'site:itch.io OR site:wikipedia.org' :
      'site:wikipedia.org';

    // A) Identity: Developer & Publisher
    const identityResult = await performGroundedJSON(
      genAI,
      `Search Google for: "${title}" developer publisher ${siteScope}`,
      {
        developer: "string or null",
        publisher: "string or null",
        sources: [{ title: "string", url: "string" }]
      },
      testMode
    );

    // B) Platforms
    const platformsResult = await performGroundedJSON(
      genAI,
      `Search Google for: "${title}" platforms Windows Mac Linux PlayStation Xbox Nintendo Switch Steam Deck`,
      {
        platforms: ["array of strings"],
        sources: [{ title: "string", url: "string" }]
      },
      testMode
    );

    // C) Price
    const priceResult = await performGroundedJSON(
      genAI,
      `Search Google for: "${title}" price USD ${siteScope}`,
      {
        priceUSD: "number or null",
        currency: "string or null",
        sources: [{ title: "string", url: "string" }]
      },
      testMode
    );

    // D) Reviews
    const reviewsResult = await performGroundedJSON(
      genAI,
      `Search Google for: "${title}" reviews rating score site:steampowered.com OR site:metacritic.com`,
      {
        reviewCount: "number or null",
        reviewScore: "number or null",
        sources: [{ title: "string", url: "string" }]
      },
      testMode
    );

    // E) Players & Sales
    const playersResult = await performGroundedJSON(
      genAI,
      `Search Google for: "${title}" "copies sold" OR "players peak" site:steamdb.info OR ${siteScope}`,
      {
        salesCopies: "number or null",
        playerPeak: "number or null",
        sources: [{ title: "string", url: "string" }]
      },
      testMode
    );

    // Combine results
    const allCitations = [
      ...identityResult.citations,
      ...platformsResult.citations,
      ...priceResult.citations,
      ...reviewsResult.citations,
      ...playersResult.citations,
    ];
    const uniqueCitations = [...new Set(allCitations)];

    const grounded = identityResult.grounded || platformsResult.grounded || 
                     priceResult.grounded || reviewsResult.grounded || playersResult.grounded;

    // Build price label
    let priceLabel = null;
    if (priceResult.data.priceUSD !== null && priceResult.data.priceUSD !== undefined) {
      if (priceResult.data.priceUSD === 0 || priceResult.data.currency?.toLowerCase() === "free") {
        priceLabel = "Free";
      } else {
        priceLabel = `$${priceResult.data.priceUSD} ${priceResult.data.currency || "USD"}`.trim();
      }
    }

    const payload = {
      title,
      developer: identityResult.data.developer || null,
      publisher: identityResult.data.publisher || null,
      platforms: platformsResult.data.platforms || [],
      priceLabel,
      priceUSD: priceResult.data.priceUSD,
      currency: priceResult.data.currency,
      reviewCount: reviewsResult.data.reviewCount,
      reviewScore: reviewsResult.data.reviewScore,
      salesCopies: playersResult.data.salesCopies,
      playerPeak: playersResult.data.playerPeak,
      citations: uniqueCitations,
      debug: {
        grounded,
        perCall: {
          identity: { grounded: identityResult.grounded, sourceCount: identityResult.citations.length },
          platforms: { grounded: platformsResult.grounded, sourceCount: platformsResult.citations.length },
          price: { grounded: priceResult.grounded, sourceCount: priceResult.citations.length },
          reviews: { grounded: reviewsResult.grounded, sourceCount: reviewsResult.citations.length },
          players: { grounded: playersResult.grounded, sourceCount: playersResult.citations.length },
        },
        ...(testMode && {
          queries: {
            identity: `"${title}" developer publisher ${siteScope}`,
            platforms: `"${title}" platforms Windows Mac Linux PlayStation Xbox Nintendo Switch Steam Deck`,
            price: `"${title}" price USD ${siteScope}`,
            reviews: `"${title}" reviews rating score site:steampowered.com OR site:metacritic.com`,
            players: `"${title}" "copies sold" OR "players peak" site:steamdb.info OR ${siteScope}`,
          }
        })
      }
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Gemini] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
