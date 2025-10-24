import { useState } from "react";
import { CategorySection } from "@/components/CategorySection";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { ReportCard } from "@/components/ReportCard";
import { categories } from "@/data/categories";
import { Answer, AnswerValue, LeadData } from "@/types/analyzer";
import { calculateScores } from "@/lib/scoring";
import { saveResultToLocal } from "@/lib/storage";
import { sendToWebhook } from "@/lib/webhook";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { APP_CONFIG } from "@/config/appConfig";

type ViewState = "form" | "lead" | "report";

const Embed = () => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [viewState, setViewState] = useState<ViewState>("form");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnswerChange = (categoryId: string, questionId: string, value: AnswerValue) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.categoryId === categoryId && a.questionId === questionId);
      if (existing) {
        return prev.map(a =>
          a.categoryId === categoryId && a.questionId === questionId
            ? { ...a, value }
            : a
        );
      }
      return [...prev, { categoryId, questionId, value }];
    });
  };

  const isFormComplete = () => {
    const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
    return answers.length === totalQuestions;
  };

  const handleSubmitForm = () => {
    if (!isFormComplete()) {
      toast.error("Please answer all questions before submitting");
      return;
    }
    setViewState("lead");
  };

  const handleLeadSubmit = async (lead: LeadData) => {
    const result = calculateScores(answers);
    setAnalysisResult(result);
    
    saveResultToLocal(result, lead);
    
    if (APP_CONFIG.webhookUrl && (lead.name || lead.email)) {
      const success = await sendToWebhook(result, lead);
      if (success) {
        toast.success("Report sent successfully");
      }
    }
    
    setViewState("report");
  };

  const handleSkipLead = () => {
    const result = calculateScores(answers);
    setAnalysisResult(result);
    saveResultToLocal(result);
    setViewState("report");
  };

  const handleStartNew = () => {
    setAnswers([]);
    setAnalysisResult(null);
    setViewState("form");
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <main>
        {viewState === "form" && (
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Evergreen Readiness Analyzer
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Score the health of your revenue system. Answer 25 questions across 5 categories to identify your strongest opportunities.
              </p>
            </div>

            {categories.map((category) => (
              <CategorySection
                key={category.id}
                category={category}
                answers={answers}
                onAnswerChange={handleAnswerChange}
              />
            ))}

            <div className="flex justify-center pt-8">
              <Button
                onClick={handleSubmitForm}
                disabled={!isFormComplete()}
                size="lg"
                className="px-12"
              >
                Submit for Analysis
              </Button>
            </div>
          </div>
        )}

        {viewState === "lead" && (
          <LeadCaptureForm onSubmit={handleLeadSubmit} onSkip={handleSkipLead} />
        )}

        {viewState === "report" && analysisResult && (
          <ReportCard result={analysisResult} onStartNew={handleStartNew} />
        )}
      </main>
    </div>
  );
};

export default Embed;
