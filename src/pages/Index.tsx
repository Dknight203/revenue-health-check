import { useState } from "react";
import { Header } from "@/components/Header";
import { GameUrlInput } from "@/components/GameUrlInput";
import { LoadingAnalysis } from "@/components/LoadingAnalysis";
import { EmailGate } from "@/components/EmailGate";
import { GameReportCard } from "@/components/GameReportCard";
import { AIAnalysisResult, LeadData } from "@/types/analyzer";
import { scrapeGameUrl } from "@/lib/gameScraper";
import { analyzeGame } from "@/lib/ruleBasedAnalysis";
import { sendToWebhook } from "@/lib/webhook";
import { saveResultToLocal } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { APP_CONFIG } from "@/config/appConfig";

type ViewState = "input" | "loading" | "email" | "report";

const Index = () => {
  const [viewState, setViewState] = useState<ViewState>("input");
  const [gameUrl, setGameUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const { toast } = useToast();

  const handleUrlSubmit = async (url: string) => {
    setGameUrl(url);
    setViewState("loading");

    try {
      const metadata = await scrapeGameUrl(url);
      const result = analyzeGame(metadata, url);
      setAnalysisResult(result);
      await new Promise(resolve => setTimeout(resolve, 15000));
      setViewState("email");
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "We couldn't analyze that URL automatically. Please try a different URL.",
        variant: "destructive"
      });
      setViewState("input");
    }
  };

  const handleEmailSubmit = async (lead: LeadData) => {
    if (!analysisResult) return;
    saveResultToLocal(analysisResult, lead);
    try {
      await sendToWebhook(analysisResult, lead);
    } catch (error) {
      console.error("Webhook error:", error);
    }
    setViewState("report");
  };

  const handleStartNew = () => {
    setViewState("input");
    setGameUrl("");
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-12 px-4">
        {viewState === "input" && <GameUrlInput onSubmit={handleUrlSubmit} isLoading={false} />}
        {viewState === "loading" && <LoadingAnalysis />}
        {viewState === "email" && <EmailGate onSubmit={handleEmailSubmit} />}
        {viewState === "report" && analysisResult && <GameReportCard result={analysisResult} onStartNew={handleStartNew} />}
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Powered by <a href={APP_CONFIG.brandSourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{APP_CONFIG.siteName}</a></p>
      </footer>
    </div>
  );
};

export default Index;
