import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { GameUrlInput } from "@/components/GameUrlInput";
import { LoadingAnalysis } from "@/components/LoadingAnalysis";
import { EmailGate } from "@/components/EmailGate";
import { GameReportCard } from "@/components/GameReportCard";
import { ManualGameForm } from "@/components/ManualGameForm";
import { AIAnalysisResult, LeadData, GameMetadata } from "@/types/analyzer";
import { scrapeGameUrl } from "@/lib/gameScraper";
import { analyzeGame } from "@/lib/ruleBasedAnalysis";
import { sendToWebhook } from "@/lib/webhook";
import { saveResultToLocal } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { APP_CONFIG } from "@/config/appConfig";
import { getWebhookQueue, removeFromWebhookQueue, incrementQueueAttempts } from "@/lib/webhookQueue";
import { classifyGame } from "@/lib/contextClassifier";
import { testGameScraper } from "@/lib/testScraper";

type ViewState = "input" | "loading" | "manual" | "email" | "report";

const Index = () => {
  const [viewState, setViewState] = useState<ViewState>("input");
  const [gameUrl, setGameUrl] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [failedUrl, setFailedUrl] = useState<string>("");
  const { toast } = useToast();

  // Process queued webhooks on mount
  useEffect(() => {
    processWebhookQueue();
  }, []);

  const processWebhookQueue = async () => {
    const queue = getWebhookQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} queued webhooks...`);
    
    for (const item of queue) {
      if (item.attempts >= 5) {
        console.log(`Skipping webhook ${item.id} - max attempts reached`);
        continue;
      }

      try {
        incrementQueueAttempts(item.id);
        const success = await sendToWebhook(item.result, item.lead);
        
        if (success) {
          removeFromWebhookQueue(item.id);
          console.log(`Successfully sent queued webhook ${item.id}`);
        }
      } catch (error) {
        console.error(`Failed to process webhook ${item.id}:`, error);
      }
    }
  };

  const handleUrlSubmit = async (url: string) => {
    setGameUrl(url);
    setFailedUrl("");
    setViewState("loading");

    try {
      // Test the scraper first
      await testGameScraper(url);
      
      const metadata = await scrapeGameUrl(url);
      const result = analyzeGame(metadata, url);
      setAnalysisResult(result);
      await new Promise(resolve => setTimeout(resolve, 15000));
      setViewState("email");
    } catch (error) {
      console.error("Analysis error:", error);
      setFailedUrl(url);
      toast({
        title: "Automatic analysis failed",
        description: "Please enter game details manually to continue.",
        variant: "destructive"
      });
      setViewState("manual");
    }
  };

  const handleManualSubmit = (metadata: GameMetadata) => {
    setViewState("loading");
    
    try {
      // Classify the game properly
      const archetype = classifyGame(metadata);
      const classifiedMetadata = { ...metadata, archetype };
      
      const result = analyzeGame(classifiedMetadata, gameUrl || "manual-entry");
      setAnalysisResult(result);
      
      setTimeout(() => {
        setViewState("email");
      }, 3000);
    } catch (error) {
      console.error("Manual analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Please try again.",
        variant: "destructive"
      });
      setViewState("manual");
    }
  };

  const handleCancelManual = () => {
    setViewState("input");
    setFailedUrl("");
  };

  const handleEmailSubmit = async (lead: LeadData) => {
    if (!analysisResult) return;
    saveResultToLocal(analysisResult, lead);
    
    const webhookSent = await sendToWebhook(analysisResult, lead);
    
    if (!webhookSent) {
      toast({
        title: "Report saved locally",
        description: "We'll sync your data when connection is restored.",
        variant: "default"
      });
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
        {viewState === "manual" && (
          <ManualGameForm 
            onSubmit={handleManualSubmit} 
            onCancel={handleCancelManual}
            initialUrl={failedUrl}
          />
        )}
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
