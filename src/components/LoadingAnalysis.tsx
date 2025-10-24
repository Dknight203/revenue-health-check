import { useEffect, useState } from "react";
import { Progress } from "./ui/progress";

const LOADING_MESSAGES = [
  "Scanning your game page...",
  "Analyzing revenue signals...",
  "Identifying opportunities...",
  "Generating your report..."
];

export function LoadingAnalysis() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const duration = 15000; // 15 seconds
    const interval = 100;
    const increment = 100 / (duration / interval);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        return next >= 100 ? 100 : next;
      });
    }, interval);

    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, duration / LOADING_MESSAGES.length);

    return () => {
      clearInterval(progressTimer);
      clearInterval(messageTimer);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Analyzing Your Game
          </h2>
          <p className="text-lg text-muted-foreground animate-pulse">
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
      </div>
    </div>
  );
}
