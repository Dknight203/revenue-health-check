import { useState } from "react";
import { LeadData } from "@/types/analyzer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LeadCaptureFormProps {
  onSubmit: (lead: LeadData) => void;
  onSkip: () => void;
}

export function LeadCaptureForm({ onSubmit, onSkip }: LeadCaptureFormProps) {
  const [lead, setLead] = useState<LeadData>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(lead);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 p-8 border border-border rounded-lg bg-card">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Optional: Get your report link</h3>
        <p className="text-sm text-muted-foreground">
          Optional. We use this only to send your report link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={lead.name || ""}
            onChange={(e) => setLead({ ...lead, name: e.target.value })}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={lead.email || ""}
            onChange={(e) => setLead({ ...lead, email: e.target.value })}
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={lead.company || ""}
            onChange={(e) => setLead({ ...lead, company: e.target.value })}
            placeholder="Your studio or publisher"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1">
            Continue to report
          </Button>
          <Button type="button" variant="outline" onClick={onSkip}>
            Skip
          </Button>
        </div>
      </form>
    </div>
  );
}
