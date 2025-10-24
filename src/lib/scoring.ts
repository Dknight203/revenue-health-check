import { Answer, CategoryScore, AnalysisResult } from "@/types/analyzer";
import { categories } from "@/data/categories";
import { recommendations } from "@/data/recommendations";

export function calculateScores(answers: Answer[]): AnalysisResult {
  const categoryScores: CategoryScore[] = categories.map(category => {
    const categoryAnswers = answers.filter(a => a.categoryId === category.id);
    const rawTotal = categoryAnswers.reduce((sum, a) => sum + a.value, 0);
    const maxPossible = category.questions.length * 3;
    const score = Math.round((rawTotal / maxPossible) * 100);

    return {
      categoryId: category.id,
      categoryName: category.name,
      score,
      rawTotal,
      maxPossible
    };
  });

  const overallScore = Math.round(
    categoryScores.reduce((sum, cs) => sum + cs.score, 0) / categoryScores.length
  );

  const lowestCategories = [...categoryScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  return {
    overallScore,
    categoryScores,
    lowestCategories,
    answers,
    timestamp: new Date().toISOString()
  };
}

export function getRecommendation(categoryId: string) {
  return recommendations[categoryId] || {
    diagnosis: "This area needs attention.",
    actions: ["Review current practices", "Establish regular review cadence"]
  };
}

export function formatScoreForDisplay(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Developing";
  return "Needs focus";
}

export function generateTextSummary(result: AnalysisResult): string {
  const { overallScore, lowestCategories } = result;
  const lowest1 = lowestCategories[0];
  const lowest2 = lowestCategories[1];
  
  return `Evergreen Readiness: ${overallScore}/100
Focus areas: ${lowest1.categoryName} (${lowest1.score}/100) and ${lowest2.categoryName} (${lowest2.score}/100)
Next: Review recommendations for ${lowest1.categoryName} and ${lowest2.categoryName}`;
}
