import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface GameUrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function GameUrlInput({ onSubmit, isLoading }: GameUrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a game URL");
      return;
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid URL (e.g., https://store.steampowered.com/app/...)");
      return;
    }

    onSubmit(url);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          Find the Hidden Revenue in Your Game
        </h1>
        <p className="text-xl text-muted-foreground">
          Get a free 60-second analysis of your game's revenue opportunities
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your game's URL (Steam, App Store, Google Play, itch.io, or website)"
            className="h-14 text-lg"
            disabled={isLoading}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-14 text-lg"
          disabled={isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze My Game"}
        </Button>
      </form>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-medium">Example URLs:</p>
        <ul className="space-y-1 pl-4">
          <li>• https://store.steampowered.com/app/...</li>
          <li>• https://apps.apple.com/app/...</li>
          <li>• https://play.google.com/store/apps/...</li>
          <li>• https://yourgame.com</li>
        </ul>
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>✓ No download required</span>
        <span>•</span>
        <span>✓ Results in 60 seconds</span>
      </div>
    </div>
  );
}
