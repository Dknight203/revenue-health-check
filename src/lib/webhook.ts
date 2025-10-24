import { AnalysisResult, LeadData } from "@/types/analyzer";
import { APP_CONFIG } from "@/config/appConfig";

export async function sendToWebhook(result: AnalysisResult, lead: LeadData): Promise<boolean> {
  if (!APP_CONFIG.webhookUrl) {
    return false;
  }

  try {
    const response = await fetch(APP_CONFIG.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lead,
        analysis: {
          overallScore: result.overallScore,
          categoryScores: result.categoryScores,
          lowestCategories: result.lowestCategories.map(c => c.categoryName),
          timestamp: result.timestamp
        }
      })
    });

    return response.ok;
  } catch (error) {
    console.error("Webhook error:", error);
    return false;
  }
}
