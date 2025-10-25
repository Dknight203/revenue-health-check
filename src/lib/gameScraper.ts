import { GameMetadata } from "@/types/analyzer";
import { retryWithBackoff } from "./retryUtils";
import { validateGameMetadata } from "./metadataValidator";

interface ScrapedData {
  title?: string;
  description?: string;
  price?: string;
  platform?: string;
  genre?: string[];
  releaseState?: string;
  isMultiplayer?: boolean;
  reviewScore?: number;
  lastUpdate?: string;
  imageUrl?: string;
}

export async function scrapeGameUrl(url: string): Promise<GameMetadata> {
  try {
    const metadata = await retryWithBackoff(
      () => fetchAndParseGamePage(url),
      {
        maxAttempts: 3,
        delayMs: 1000,
        timeoutMs: 15000,
        onRetry: (attempt, error) => {
          console.log(`Scraping attempt ${attempt} failed:`, error.message);
        }
      }
    );

    // Validate scraped metadata
    const validation = validateGameMetadata(metadata);
    if (!validation.isValid) {
      console.error("Metadata validation failed:", validation.errors);
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    if (validation.warnings.length > 0) {
      console.warn("Metadata warnings:", validation.warnings);
    }

    return metadata;
  } catch (error) {
    console.error("Scraping error:", error);
    throw new Error("Could not analyze game URL automatically");
  }
}

async function fetchAndParseGamePage(url: string): Promise<GameMetadata> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch game page: ${response.status}`);
  }

  const html = await response.text();
  const data = extractMetadata(html, url);

  return buildGameMetadata(data, url);
}

function extractMetadata(html: string, url: string): ScrapedData {
  const data: ScrapedData = {};

  // Extract Open Graph tags
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
  const ogDescription = html.match(/<meta property="og:description" content="([^"]+)"/i);
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i);
  
  data.title = ogTitle ? ogTitle[1] : extractTitle(html);
  data.description = ogDescription ? ogDescription[1] : "";
  data.imageUrl = ogImage ? ogImage[1] : undefined;

  // Platform detection
  if (url.includes("steampowered.com")) {
    data.platform = "steam";
    data.price = extractSteamPrice(html);
    data.genre = extractSteamGenre(html);
    data.reviewScore = extractSteamReviews(html);
    data.isMultiplayer = html.toLowerCase().includes("multiplayer") || html.toLowerCase().includes("multi-player");
    data.releaseState = extractSteamReleaseState(html);
    data.lastUpdate = extractSteamReleaseDate(html);
  } else if (url.includes("apps.apple.com") || url.includes("play.google.com")) {
    data.platform = "mobile";
    data.price = extractMobilePrice(html);
    data.genre = extractMobileGenre(html);
    data.isMultiplayer = html.toLowerCase().includes("multiplayer");
    data.releaseState = "live";
    data.lastUpdate = extractMobileReleaseDate(html, url);
  } else if (url.includes("itch.io")) {
    data.platform = "indie";
    data.price = extractItchPrice(html);
    data.isMultiplayer = html.toLowerCase().includes("multiplayer");
    data.releaseState = "live";
    data.lastUpdate = extractItchReleaseDate(html);
  } else {
    data.platform = "web";
    data.price = "free";
    data.isMultiplayer = false;
    data.releaseState = "live";
  }

  return data;
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "Unknown Game";
}

function extractSteamPrice(html: string): string {
  const freeMatch = html.match(/Free to Play|Free To Play/i);
  if (freeMatch) return "free";

  const priceMatch = html.match(/\$(\d+\.?\d*)/);
  return priceMatch ? priceMatch[1] : "unknown";
}

function extractSteamGenre(html: string): string[] {
  const genres: string[] = [];
  const genreMatches = html.matchAll(/<a[^>]*href="[^"]*tags[^"]*"[^>]*>([^<]+)<\/a>/gi);
  
  for (const match of genreMatches) {
    genres.push(match[1].trim());
  }

  return genres.slice(0, 3);
}

function extractSteamReviews(html: string): number | undefined {
  const positiveMatch = html.match(/(\d+)% of [^<]* positive/i);
  return positiveMatch ? parseInt(positiveMatch[1]) : undefined;
}

function extractSteamReleaseState(html: string): 'upcoming' | 'early_access' | 'live' {
  if (html.includes("Early Access")) return "early_access";
  if (html.includes("Coming Soon") || html.includes("Upcoming")) return "upcoming";
  return "live";
}

function extractMobilePrice(html: string): string {
  const freeMatch = html.match(/Free|FREE/);
  if (freeMatch) return "free";

  const priceMatch = html.match(/\$(\d+\.?\d*)/);
  return priceMatch ? priceMatch[1] : "unknown";
}

function extractMobileGenre(html: string): string[] {
  // Mobile stores have different genre structures
  const genreMatch = html.match(/genre[^>]*>([^<]+)</i);
  return genreMatch ? [genreMatch[1].trim()] : [];
}

function extractItchPrice(html: string): string {
  const freeMatch = html.match(/Free|FREE/);
  if (freeMatch) return "free";

  const priceMatch = html.match(/\$(\d+\.?\d*)/);
  return priceMatch ? priceMatch[1] : "free";
}

function extractSteamReleaseDate(html: string): string | undefined {
  // Steam shows release date in multiple formats and locations
  
  // Format 1: "Release Date: Aug 28, 2024"
  const releaseDateMatch = html.match(/Release Date[:\s]*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (releaseDateMatch) return releaseDateMatch[1];
  
  // Format 2: In the game_area_purchase_date div
  const purchaseDateMatch = html.match(/<div class="release_date">.*?<div class="date">([^<]+)<\/div>/is);
  if (purchaseDateMatch) return purchaseDateMatch[1].trim();
  
  // Format 3: Meta tag datePublished
  const metaDateMatch = html.match(/<meta itemprop="datePublished" content="([^"]+)"/i);
  if (metaDateMatch) return metaDateMatch[1];
  
  // Format 4: JSON-LD structured data
  const jsonLdMatch = html.match(/"datePublished":\s*"([^"]+)"/);
  if (jsonLdMatch) return jsonLdMatch[1];
  
  return undefined;
}

function extractMobileReleaseDate(html: string, url: string): string | undefined {
  if (url.includes('apps.apple.com')) {
    // iOS: "Released Mar 15, 2024" or similar
    const iosMatch = html.match(/Released[:\s]+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
                     html.match(/"datePublished":\s*"([^"]+)"/i) ||
                     html.match(/Release Date[:\s]*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
    if (iosMatch) return iosMatch[1];
  }
  
  if (url.includes('play.google.com')) {
    // Android: "Released on Mar 15, 2024"
    const androidMatch = html.match(/Released on\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i) ||
                         html.match(/"datePublished":\s*"([^"]+)"/i);
    if (androidMatch) return androidMatch[1];
  }
  
  return undefined;
}

function extractItchReleaseDate(html: string): string | undefined {
  // itch.io: "Published Mar 15, 2024" or relative time
  const publishedMatch = html.match(/Published[:\s]+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (publishedMatch) return publishedMatch[1];
  
  // Sometimes in an abbr tag with full date
  const abbrMatch = html.match(/<abbr[^>]*title="([^"]+)"[^>]*>\d+\s+(?:days?|months?|years?)\s+ago<\/abbr>/i);
  if (abbrMatch) return abbrMatch[1];
  
  return undefined;
}

function buildGameMetadata(data: ScrapedData, url: string): GameMetadata {
  const price = data.price === "free" || data.price === "unknown" 
    ? "free" 
    : parseFloat(data.price || "0");

  const platform = (data.platform || "web") as GameMetadata["platform"];
  const releaseState = (data.releaseState || "live") as GameMetadata["releaseState"];

  return {
    title: data.title || "Unknown Game",
    platform,
    price,
    genre: data.genre || [],
    releaseState,
    isMultiplayer: data.isMultiplayer || false,
    reviewScore: data.reviewScore,
    lastUpdateDate: data.lastUpdate,
    imageUrl: data.imageUrl,
    archetype: "premium_singleplayer" // Will be set by classifier
  };
}
