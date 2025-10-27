import { GameMetadata } from "@/types/analyzer";
import { validateGameMetadata } from "./metadataValidator";
import { retryWithBackoff } from "./retryUtils";
import { searchGameData } from "./webSearchService";

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
  console.log("Starting game data collection for URL:", url);
  
  try {
    // Step 1: Fetch basic HTML to get game title and initial data
    const htmlMetadata = await retryWithBackoff(
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

    console.log("HTML metadata:", htmlMetadata);

    // Step 2: Enrich with web search data
    const gameTitle = htmlMetadata.title;
    console.log(`Enriching data for: ${gameTitle}`);
    
    const searchData = await searchGameData(gameTitle, url);
    console.log("Web search data:", searchData);

    // Step 3: Merge HTML scraping with web search (web search takes priority)
    const mergedMetadata: GameMetadata = {
      ...htmlMetadata,
      // Web search price overrides HTML scraping (fixes "Free" for paid games)
      price: searchData.price !== undefined ? searchData.price : htmlMetadata.price,
      developer: searchData.developer || htmlMetadata.developer,
      publisher: searchData.publisher || htmlMetadata.publisher,
      // Web search platforms override HTML platform (fixes "steam" only)
      platforms: (searchData.platforms && searchData.platforms.length > 0)
        ? searchData.platforms
        : (htmlMetadata.platform ? [htmlMetadata.platform] : []),
      reviewCount: searchData.reviewCount || htmlMetadata.reviewCount,
      reviewScore: searchData.reviewScore !== undefined ? searchData.reviewScore : htmlMetadata.reviewScore,
      peakPlayers: searchData.peakPlayers || htmlMetadata.peakPlayers,
      copiesSold: searchData.copiesSold || htmlMetadata.copiesSold,
    };

    console.log("Merged metadata before validation:", mergedMetadata);

    // Step 4: Validate the metadata
    const validation = validateGameMetadata(mergedMetadata);
    if (!validation.isValid) {
      console.error("Metadata validation failed:", validation.errors);
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    if (validation.warnings.length > 0) {
      console.warn("Metadata warnings:", validation.warnings);
    }
    
    console.log("Final validated metadata:", mergedMetadata);
    
    return mergedMetadata;
  } catch (error) {
    console.error("Error collecting game data:", error);
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
  console.log("🔍 Attempting to extract Steam price...");
  
  // Check for free to play
  const freeMatch = html.match(/Free[\s\S]*?to[\s\S]*?Play/i);
  if (freeMatch) {
    console.log("✅ Found free to play");
    return "free";
  }

  // Look for data-price-final attribute (in cents)
  const dataPriceMatch = html.match(/data-price-final="(\d+)"/);
  if (dataPriceMatch) {
    const cents = parseInt(dataPriceMatch[1]);
    console.log(`✅ Found price via data-price-final: $${(cents / 100).toFixed(2)}`);
    return (cents / 100).toFixed(2);
  }

  // Look for game_purchase_price div with flexible whitespace
  const purchasePriceMatch = html.match(/<div[^>]*class="game_purchase_price[^"]*"[^>]*>[\s\S]*?\$(\d+\.?\d*)[\s\S]*?<\/div>/);
  if (purchasePriceMatch) {
    console.log(`✅ Found price via game_purchase_price: $${purchasePriceMatch[1]}`);
    return purchasePriceMatch[1];
  }

  // Look for discount_final_price with flexible whitespace
  const discountPriceMatch = html.match(/<div[^>]*class="discount_final_price"[^>]*>[\s\S]*?\$(\d+\.?\d*)[\s\S]*?<\/div>/);
  if (discountPriceMatch) {
    console.log(`✅ Found price via discount_final_price: $${discountPriceMatch[1]}`);
    return discountPriceMatch[1];
  }

  // Last resort: any dollar amount in game area
  const anyPriceMatch = html.match(/game_area_purchase[\s\S]{0,500}?\$(\d+\.?\d*)/);
  if (anyPriceMatch) {
    console.log(`⚠️ Found price via fallback pattern: $${anyPriceMatch[1]}`);
    return anyPriceMatch[1];
  }

  console.error("❌ Could not extract Steam price from HTML");
  console.log("HTML sample:", html.substring(0, 1000));
  return "unknown";
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
  console.log("🔍 Attempting to extract Steam release date...");
  
  // Format 1: <div class="date">Oct 15, 2025</div> inside release_date div
  const releaseDateDivMatch = html.match(/<div[^>]*class="release_date"[^>]*>[\s\S]*?<div[^>]*class="date"[^>]*>([^<]+)<\/div>/i);
  if (releaseDateDivMatch) {
    console.log(`✅ Found release date via date div: ${releaseDateDivMatch[1].trim()}`);
    return releaseDateDivMatch[1].trim();
  }
  
  // Format 2: "Release Date: Aug 28, 2024" with flexible whitespace
  const releaseDateMatch = html.match(/Release[\s\S]*?Date[\s\S]*?:?[\s\S]*?([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (releaseDateMatch) {
    console.log(`✅ Found release date via text pattern: ${releaseDateMatch[1].trim()}`);
    return releaseDateMatch[1].trim();
  }
  
  // Format 3: Meta tag datePublished
  const metaDateMatch = html.match(/<meta[^>]*itemprop="datePublished"[^>]*content="([^"]+)"/i);
  if (metaDateMatch) {
    console.log(`✅ Found release date via meta tag: ${metaDateMatch[1]}`);
    return metaDateMatch[1];
  }
  
  // Format 4: JSON-LD structured data
  const jsonLdMatch = html.match(/"datePublished"[\s\S]*?:[\s\S]*?"([^"]+)"/);
  if (jsonLdMatch) {
    console.log(`✅ Found release date via JSON-LD: ${jsonLdMatch[1]}`);
    return jsonLdMatch[1];
  }
  
  console.error("❌ Could not extract Steam release date from HTML");
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
    platforms: [platform],
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
