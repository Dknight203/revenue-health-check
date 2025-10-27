import { AIAnalysisResult } from "@/types/analyzer";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { getArchetypeLabel, getScoreInterpretation } from "@/lib/contextClassifier";
import { Download, Calendar } from "lucide-react";
import { APP_CONFIG } from "@/config/appConfig";
import { exportAIReportToPDF } from "@/lib/pdfExport";
import { useToast } from "@/hooks/use-toast";

interface GameReportCardProps {
  result: AIAnalysisResult;
  onStartNew: () => void;
}

export function GameReportCard({ result, onStartNew }: GameReportCardProps) {
  const { toast } = useToast();
  const { gameContext, overallScore, opportunities } = result;

  const getScoreColor = (score: number): string => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const handleDownloadPDF = async () => {
    try {
      await exportAIReportToPDF(result);
      toast({
        title: "Report downloaded",
        description: "Your PDF report has been saved"
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not generate PDF report",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header with game info */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {gameContext.title}
        </h1>
        <p className="text-muted-foreground">
          {getArchetypeLabel(gameContext.archetype)}
        </p>
      </div>

      {/* Game Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Game Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-foreground">Platform:</span>
              <span className="ml-2 text-muted-foreground">{gameContext.platform}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">Price:</span>
              <span className="ml-2 text-muted-foreground">
                {gameContext.price === "free" ? "Free" : `$${gameContext.price}`}
              </span>
            </div>
            {gameContext.genre && gameContext.genre.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Genre:</span>
                <span className="ml-2 text-muted-foreground">{gameContext.genre.join(", ")}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Release State:</span>
              <span className="ml-2 text-muted-foreground capitalize">{gameContext.releaseState.replace("_", " ")}</span>
            </div>
            {gameContext.lastUpdateDate && (
              <div>
                <span className="font-medium text-foreground">Released:</span>
                <span className="ml-2 text-muted-foreground">{gameContext.lastUpdateDate}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Multiplayer:</span>
              <span className="ml-2 text-muted-foreground">{gameContext.isMultiplayer ? "Yes" : "No"}</span>
            </div>
            {gameContext.reviewScore && (
              <div>
                <span className="font-medium text-foreground">Review Score:</span>
                <span className="ml-2 text-muted-foreground">{gameContext.reviewScore}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Health Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <span className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="text-3xl text-muted-foreground">/100</span>
          </div>
          <p className="text-center text-lg text-muted-foreground">
            {getScoreInterpretation(overallScore, gameContext.archetype)}
          </p>
        </CardContent>
      </Card>

      {/* Top Opportunities */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Top Revenue Opportunities
        </h2>
        
        {opportunities.map((opportunity, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{opportunity.category}</CardTitle>
                <span className={`text-xs px-2 py-1 rounded ${
                  opportunity.relevance === "critical" 
                    ? "bg-red-100 text-red-800" 
                    : opportunity.relevance === "high"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {opportunity.relevance.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">{opportunity.diagnosis}</p>
              <div className="space-y-2">
                <p className="font-medium text-sm">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {opportunity.actions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary CTA */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="py-8 space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">
              Ready to Unlock These Opportunities?
            </h3>
            <p className="text-primary-foreground/90">
              Book a free 30-minute strategy call to discuss how to implement these recommendations
            </p>
          </div>
          <Button 
            size="lg" 
            variant="secondary"
            className="w-full text-lg h-14"
            asChild
          >
            <a 
              href={APP_CONFIG.scheduleUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Book a Free Strategy Call
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleDownloadPDF}
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF Report
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onStartNew}
        >
          Analyze Another Game
        </Button>
      </div>
    </div>
  );
}
