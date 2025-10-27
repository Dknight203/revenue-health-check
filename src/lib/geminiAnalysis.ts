import { GoogleGenerativeAI } from "@google/generative-ai";
import { GameMetadata, AIAnalysisResult, Opportunity } from "@/types/analyzer";
import { analyzeGame as fallbackAnalyze } from "./ruleBasedAnalysis";

const GEMINI_API_KEY = "AIzaSyDIiYmV7KipsHjXu7au3jxVTaJLZ0GWm2A";

export async function analyzeGameWithGemini(
  metadata: GameMetadata,
  gameUrl: string
): Promise<AIAnalysisResult> {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = buildPrompt(metadata, gameUrl);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const aiResponse = JSON.parse(text);
    
    return {
      gameContext: metadata,
      overallScore: aiResponse.overallScore || 50,
      opportunities: aiResponse.opportunities || [],
      gameUrl,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    // Fallback to rule-based analysis if AI fails
    return fallbackAnalyze(metadata, gameUrl);
  }
}

function buildPrompt(metadata: GameMetadata, gameUrl: string): string {
  const price = metadata.price === "free" ? "Free to Play" : `$${metadata.price}`;
  
  return `You are an expert game revenue consultant analyzing games to provide actionable revenue optimization opportunities.

Analyze this game and provide specific, context-aware revenue opportunities:

**Game Details:**
- Title: ${metadata.title}
- Platform: ${metadata.platform}
- Price: ${price}
- Genre: ${metadata.genre.join(", ")}
- Release State: ${metadata.releaseState}
- Multiplayer: ${metadata.isMultiplayer ? "Yes" : "No"}
${metadata.reviewScore ? `- Review Score: ${metadata.reviewScore}%` : ""}
${metadata.lastUpdateDate ? `- Last Update: ${metadata.lastUpdateDate}` : ""}
- Game URL: ${gameUrl}

**Analysis Instructions:**

Consider the full context:
- Is this a solo developer, small team, or publisher-backed game?
- What does the price point tell you about the target market and monetization strategy?
- How does the platform (Steam, mobile, console) affect monetization opportunities?
- What does the release state (early access, live, upcoming) mean for priorities?
- Genre conventions and player expectations matter for monetization
- Review scores indicate quality and player satisfaction levels

Generate exactly 3 high-impact revenue opportunities. Each should be:
1. **Specific to this game** - not generic advice
2. **Contextual** - considering developer resources, platform, genre, price
3. **Actionable** - with concrete next steps
4. **Prioritized** - marked as critical, high, or medium relevance

**Output Format (JSON):**
{
  "overallScore": <number 0-100, where 100 is perfect revenue health>,
  "opportunities": [
    {
      "category": "<concise 2-4 word label>",
      "diagnosis": "<1-2 sentence explanation of the opportunity or problem>",
      "actions": [
        "<specific actionable step 1>",
        "<specific actionable step 2>"
      ],
      "relevance": "<critical|high|medium>"
    }
  ]
}

Focus on opportunities like:
- Pricing optimization (launch discounts, regional pricing, bundles)
- Platform expansion (if single-platform, which platforms to target)
- Monetization models (DLC, cosmetics, season passes, expansions)
- Player retention and engagement (live ops, updates, community)
- Marketing and visibility (content creators, events, featured placement)
- Post-launch optimization (based on review feedback and player behavior)

Remember: Advice should differ based on context. A solo dev with no publisher needs different strategies than a publisher-backed team. A $5 mobile game needs different advice than a $30 premium PC game.`;
}
