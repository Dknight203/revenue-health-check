import { AnalysisResult } from "@/types/analyzer";
import { getRecommendation } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { exportToPDF } from "@/lib/pdfExport";
import { generateTextSummary } from "@/lib/scoring";
import { toast } from "sonner";
import { Download, Copy } from "lucide-react";

interface ReportCardProps {
  result: AnalysisResult;
  onStartNew: () => void;
}

export function ReportCard({ result, onStartNew }: ReportCardProps) {
  const { overallScore, categoryScores, lowestCategories } = result;

  const handleDownloadPDF = async () => {
    try {
      await exportToPDF("report-card", "evergreen-readiness-report.pdf");
      toast.success("Report downloaded");
    } catch (error) {
      toast.error("Failed to download report");
    }
  };

  const handleCopySummary = () => {
    const summary = generateTextSummary(result);
    navigator.clipboard.writeText(summary);
    toast.success("Summary copied to clipboard");
  };

  return (
    <div className="space-y-8">
      <div id="report-card" className="max-w-3xl mx-auto space-y-8 p-8 bg-background">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Evergreen Readiness Report</h2>
          <p className="text-muted-foreground">
            Generated {new Date(result.timestamp).toLocaleDateString()}
          </p>
        </div>

        <div className="text-center py-8 space-y-2">
          <div className="text-6xl font-bold text-primary">{overallScore}</div>
          <div className="text-lg text-muted-foreground">Overall Score</div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Category Scores</h3>
          {categoryScores.map((cs) => (
            <div key={cs.categoryId} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">{cs.categoryName}</span>
                <span className="text-sm font-semibold text-primary">{cs.score}/100</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${cs.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 pt-6 border-t border-border">
          <h3 className="text-xl font-semibold text-foreground">Recommended Focus Areas</h3>
          {lowestCategories.map((category) => {
            const rec = getRecommendation(category.categoryId);
            return (
              <div key={category.categoryId} className="space-y-3 p-6 bg-secondary/50 rounded-lg">
                <h4 className="font-semibold text-foreground">{category.categoryName}</h4>
                <p className="text-sm text-foreground/80">{rec.diagnosis}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Next actions:</p>
                  <ul className="space-y-1.5">
                    {rec.actions.map((action, idx) => (
                      <li key={idx} className="text-sm text-foreground/80 pl-4 relative before:content-['•'] before:absolute before:left-0">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto flex gap-4 justify-center flex-wrap">
        <Button onClick={handleDownloadPDF} variant="default" className="gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
        <Button onClick={handleCopySummary} variant="outline" className="gap-2">
          <Copy className="w-4 h-4" />
          Copy Summary
        </Button>
        <Button onClick={onStartNew} variant="outline">
          Start New Analysis
        </Button>
      </div>
    </div>
  );
}
