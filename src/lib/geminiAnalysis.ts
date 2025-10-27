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
  const platforms = metadata.platforms && metadata.platforms.length > 0 
    ? metadata.platforms.join(", ") 
    : metadata.platform;
  
  return `You are an expert game revenue consultant analyzing games to provide actionable revenue optimization opportunities.

Analyze this game and provide specific, context-aware revenue opportunities:

**Game Details:**
- Title: ${metadata.title}
${metadata.developer ? `- Developer: ${metadata.developer}` : ""}
${metadata.publisher ? `- Publisher: ${metadata.publisher}` : ""}
- Platforms: ${platforms}
- Price: ${price}
- Genre: ${metadata.genre.join(", ")}
- Release State: ${metadata.releaseState}
- Multiplayer: ${metadata.isMultiplayer ? "Yes" : "No"}
${metadata.reviewScore ? `- Review Score: ${metadata.reviewScore}%` : ""}
${metadata.reviewCount ? `- Total Reviews: ${metadata.reviewCount.toLocaleString()}` : ""}
${metadata.copiesSold ? `- Confirmed Sales: ${metadata.copiesSold.toLocaleString()} copies` : ""}
${metadata.salesMilestone ? `- Sales Milestone: ${metadata.salesMilestone}` : ""}
${metadata.estimatedOwners ? `- Estimated Owners: ${metadata.estimatedOwners}` : ""}
${metadata.estimatedRevenue ? `- Estimated Revenue: ${metadata.estimatedRevenue}` : ""}
${metadata.earningsRank ? `- Revenue Rank: #${metadata.earningsRank} on Steam` : ""}
${metadata.currentPlayers ? `- Current Players: ${metadata.currentPlayers.toLocaleString()}` : ""}
${metadata.peakPlayers ? `- All-Time Peak Players: ${metadata.peakPlayers.toLocaleString()}` : ""}
${metadata.lastUpdateDate ? `- Last Update: ${metadata.lastUpdateDate}` : ""}
- Game URL: ${gameUrl}

**Analysis Instructions:**

Consider the full context:
- **Developer Resources**: Is this a solo developer, small team, or publisher-backed studio?
  * Solo dev: Focus on sustainable, low-maintenance monetization
  * Team with publisher: Can handle more complex live ops and multi-platform expansion
- **Platform Strategy**: Single platform or multi-platform launch?
  * Multi-platform: Analyze performance across platforms, platform-specific optimization
  * Single platform: Consider expansion opportunities to other platforms
- **Sales Performance**: Use sales data to inform recommendations:
  * High Sales (500K+ copies): Focus on retention, LTV optimization, franchise expansion
  * Moderate Sales (50K-500K): Balance acquisition and monetization improvements
  * Low Sales (<50K): Prioritize visibility, marketing, and conversion optimization
  * Strong Week 1/Launch Sales: Indicates good marketing/IP, focus on sustaining momentum
  * Revenue vs Price: High owners + low revenue suggests pricing opportunity
- **Player Engagement**: Review counts and player metrics indicate market traction
  * High engagement: Focus on retention and lifetime value
  * Low engagement: Focus on visibility and acquisition
- **Price Point & Monetization Model**: Premium, F2P, or hybrid affects opportunities
- **Release State**: Early access, live, or upcoming determines priorities
- **Genre Conventions**: Player expectations matter for monetization strategy
- **Review Scores**: Quality and player satisfaction levels

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
