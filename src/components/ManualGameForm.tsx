import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { GameMetadata } from "@/types/analyzer";
import { AlertCircle } from "lucide-react";

interface ManualGameFormProps {
  onSubmit: (metadata: GameMetadata) => void;
  onCancel?: () => void;
  initialUrl?: string;
}

export function ManualGameForm({ onSubmit, onCancel, initialUrl }: ManualGameFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    platform: "web" as GameMetadata["platform"],
    priceType: "free" as "free" | "paid",
    priceAmount: "",
    genre: "",
    isMultiplayer: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const metadata: GameMetadata = {
      title: formData.title || "Untitled Game",
      platforms: [formData.platform],
      platform: formData.platform,
      price: formData.priceType === "free" ? "free" : parseFloat(formData.priceAmount) || 0,
      genre: formData.genre ? [formData.genre] : [],
      releaseState: "live",
      isMultiplayer: formData.isMultiplayer,
      archetype: "premium_singleplayer" // Will be classified properly
    };

    onSubmit(metadata);
  };

  return (
    <Card className="max-w-2xl mx-auto p-8">
      <div className="flex items-start gap-3 mb-6">
        <AlertCircle className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
        <div>
          <h2 className="text-2xl font-bold mb-2">Manual Game Entry</h2>
          <p className="text-muted-foreground">
            We couldn't automatically analyze the game URL. Please enter the details manually to continue.
          </p>
          {initialUrl && (
            <p className="text-sm text-muted-foreground mt-2">
              Failed URL: <span className="font-mono text-xs">{initialUrl}</span>
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">Game Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter game name"
            required
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="platform">Platform *</Label>
          <Select
            value={formData.platform}
            onValueChange={(value) => setFormData({ ...formData, platform: value as GameMetadata["platform"] })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="steam">Steam / PC</SelectItem>
              <SelectItem value="mobile">Mobile (iOS/Android)</SelectItem>
              <SelectItem value="console">Console</SelectItem>
              <SelectItem value="web">Web Browser</SelectItem>
              <SelectItem value="indie">Indie Platform (itch.io)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priceType">Price Model *</Label>
          <Select
            value={formData.priceType}
            onValueChange={(value) => setFormData({ ...formData, priceType: value as "free" | "paid" })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free (F2P)</SelectItem>
              <SelectItem value="paid">Paid / Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.priceType === "paid" && (
          <div>
            <Label htmlFor="priceAmount">Price (USD)</Label>
            <Input
              id="priceAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.priceAmount}
              onChange={(e) => setFormData({ ...formData, priceAmount: e.target.value })}
              placeholder="9.99"
              className="mt-1.5"
            />
          </div>
        )}

        <div>
          <Label htmlFor="genre">Genre (Optional)</Label>
          <Input
            id="genre"
            value={formData.genre}
            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
            placeholder="e.g., RPG, Strategy, Shooter"
            className="mt-1.5"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="multiplayer"
            checked={formData.isMultiplayer}
            onChange={(e) => setFormData({ ...formData, isMultiplayer: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="multiplayer" className="cursor-pointer">
            This is a multiplayer game
          </Label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            Continue to Analysis
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
