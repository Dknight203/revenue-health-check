import { APP_CONFIG } from "@/config/appConfig";

interface HeaderProps {
  hideFooter?: boolean;
}

export function Header({ hideFooter }: HeaderProps) {
  return (
    <header className="w-full py-6 px-4 border-b border-border bg-background">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{APP_CONFIG.siteName}</h1>
        {!hideFooter && (
          <a
            href={APP_CONFIG.scheduleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Schedule here
          </a>
        )}
      </div>
    </header>
  );
}
