import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function EmbedInstructions() {
  const embedCode = `<iframe src="${window.location.origin}/embed" width="100%" height="900" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 border border-border rounded-lg bg-card space-y-4">
      <h3 className="text-lg font-semibold text-foreground">How to embed</h3>
      <p className="text-sm text-muted-foreground">
        Copy the code below and paste it into a WordPress HTML block or any web page
      </p>
      <div className="relative">
        <pre className="p-4 bg-secondary rounded-lg text-sm overflow-x-auto">
          <code className="text-foreground/90">{embedCode}</code>
        </pre>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 gap-2"
        >
          <Copy className="w-3 h-3" />
          Copy
        </Button>
      </div>
    </div>
  );
}
