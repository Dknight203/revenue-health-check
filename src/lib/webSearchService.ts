import { GameMetadata } from "@/types/analyzer";

export async function searchGameData(
  gameTitle: string,
  storeUrl: string
): Promise<Partial<GameMetadata>> {
  console.log(`[WebSearch] Searching for game: ${gameTitle}`);
  
  const metadata: Partial<GameMetadata> = {
    platforms: [],
  };

  try {
    // Search 1: Basic info - developer, publisher, platforms
    const basicInfoResults = await performWebSearch(
      `"${gameTitle}" developer publisher platforms site:steampowered.com OR site:wikipedia.org OR site:ign.com`,
      3
    );
    
    // Parse developer and publisher
    const devPubData = extractDeveloperPublisher(basicInfoResults, gameTitle);
    metadata.developer = devPubData.developer;
    metadata.publisher = devPubData.publisher;
    
    // Parse platforms
    const platformData = extractPlatforms(basicInfoResults);
    metadata.platforms = platformData;

    // Search 2: Sales data from multiple sources
    const salesResults = await performWebSearch(
      `"${gameTitle}" sales "copies sold" OR "units sold" OR "million copies" OR site:steamspy.com OR site:gamalytic.com`,
      5
    );
    
    const salesData = extractSalesData(salesResults, gameTitle);
    metadata.copiesSold = salesData.copiesSold;
    metadata.salesMilestone = salesData.salesMilestone;
    metadata.estimatedOwners = salesData.estimatedOwners;
    metadata.estimatedRevenue = salesData.estimatedRevenue;

    // Search 3: Player metrics from SteamDB
    if (storeUrl.includes('steam')) {
      const playerResults = await performWebSearch(
        `"${gameTitle}" site:steamdb.info players peak`,
        2
      );
      
      const playerData = extractPlayerMetrics(playerResults);
      metadata.currentPlayers = playerData.currentPlayers;
      metadata.peakPlayers = playerData.peakPlayers;
    }

    // Search 4: Review data
    const reviewResults = await performWebSearch(
      `"${gameTitle}" reviews "user reviews" rating site:steampowered.com OR site:metacritic.com`,
      3
    );
    
    const reviewData = extractReviewData(reviewResults);
    metadata.reviewCount = reviewData.reviewCount;
    if (!metadata.reviewScore) {
      metadata.reviewScore = reviewData.reviewScore;
    }

    console.log(`[WebSearch] Enriched metadata:`, metadata);
    return metadata;
  } catch (error) {
    console.error("[WebSearch] Error during web search:", error);
    return metadata;
  }
}

async function performWebSearch(query: string, numResults: number = 5): Promise<string> {
  console.log(`[WebSearch] Searching: ${query}`);
  
  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${numResults}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.warn(`[WebSearch] Search failed: ${response.status}`);
      return "";
    }

    const data = await response.json();
    const results = data.web?.results || [];
    
    // Combine all result text content
    const combinedText = results.map((r: any) => {
      return `${r.title || ''}\n${r.description || ''}\n${r.extra_snippets?.join('\n') || ''}`;
    }).join('\n\n');
    
    console.log(`[WebSearch] Found ${results.length} results`);
    return combinedText;
  } catch (error) {
    console.error('[WebSearch] Error:', error);
    return "";
  }
}

function extractDeveloperPublisher(searchText: string, gameTitle: string): {
  developer?: string;
  publisher?: string;
} {
  const result: { developer?: string; publisher?: string } = {};
  
  // Look for developer patterns
  const devPatterns = [
    /Developer[:\s]+([^,\n]+)/i,
    /Developed by[:\s]+([^,\n]+)/i,
    /Created by[:\s]+([^,\n]+)/i,
  ];
  
  for (const pattern of devPatterns) {
    const match = searchText.match(pattern);
    if (match && match[1]) {
      result.developer = match[1].trim();
      break;
    }
  }
  
  // Look for publisher patterns
  const pubPatterns = [
    /Publisher[:\s]+([^,\n]+)/i,
    /Published by[:\s]+([^,\n]+)/i,
  ];
  
  for (const pattern of pubPatterns) {
    const match = searchText.match(pattern);
    if (match && match[1]) {
      result.publisher = match[1].trim();
      break;
    }
  }
  
  return result;
}

function extractPlatforms(searchText: string): string[] {
  const platforms: Set<string> = new Set();
  
  const platformKeywords = [
    { keyword: /Windows/i, platform: "Windows" },
    { keyword: /Mac\s?OS|macOS/i, platform: "Mac" },
    { keyword: /Linux/i, platform: "Linux" },
    { keyword: /Steam\s?Deck/i, platform: "Steam Deck" },
    { keyword: /PlayStation\s?5|PS5/i, platform: "PlayStation 5" },
    { keyword: /PlayStation\s?4|PS4/i, platform: "PlayStation 4" },
    { keyword: /Xbox\s?Series\s?X\/S|Xbox\s?Series/i, platform: "Xbox Series X/S" },
    { keyword: /Xbox\s?One/i, platform: "Xbox One" },
    { keyword: /Nintendo\s?Switch|Switch/i, platform: "Nintendo Switch" },
  ];
  
  for (const { keyword, platform } of platformKeywords) {
    if (keyword.test(searchText)) {
      platforms.add(platform);
    }
  }
  
  return Array.from(platforms);
}

function extractSalesData(searchText: string, gameTitle: string): {
  copiesSold?: number;
  salesMilestone?: string;
  estimatedOwners?: string;
  estimatedRevenue?: string;
} {
  const result: {
    copiesSold?: number;
    salesMilestone?: string;
    estimatedOwners?: string;
    estimatedRevenue?: string;
  } = {};
  
  // Look for exact sales numbers
  const salesPatterns = [
    /sold\s+over\s+([\d,]+)\s+(million|thousand|copies)/i,
    /([\d,]+)\s+(million|thousand)?\s+copies\s+sold/i,
    /([\d.]+)M?\s+units\s+sold/i,
  ];
  
  for (const pattern of salesPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      let number = parseFloat(match[1].replace(/,/g, ''));
      const unit = match[2]?.toLowerCase();
      
      if (unit === 'million' || match[0].includes('M')) {
        number *= 1000000;
      } else if (unit === 'thousand') {
        number *= 1000;
      }
      
      result.copiesSold = Math.floor(number);
      result.salesMilestone = match[0].trim();
      break;
    }
  }
  
  // Look for SteamSpy owner ranges
  const ownersPattern = /Owners[:\s]+([\d,]+)\s*[±-]\s*([\d,]+)/i;
  const ownersMatch = searchText.match(ownersPattern);
  if (ownersMatch) {
    const lower = parseInt(ownersMatch[1].replace(/,/g, ''));
    const upper = parseInt(ownersMatch[2].replace(/,/g, ''));
    result.estimatedOwners = `${lower.toLocaleString()} - ${upper.toLocaleString()}`;
  }
  
  // Look for revenue estimates
  const revenuePattern = /Revenue[:\s]+\$?([\d.]+)M?\s*-\s*\$?([\d.]+)M?/i;
  const revenueMatch = searchText.match(revenuePattern);
  if (revenueMatch) {
    result.estimatedRevenue = `$${revenueMatch[1]}M - $${revenueMatch[2]}M`;
  }
  
  return result;
}

function extractPlayerMetrics(searchText: string): {
  currentPlayers?: number;
  peakPlayers?: number;
} {
  const result: { currentPlayers?: number; peakPlayers?: number } = {};
  
  // Look for peak player counts
  const peakPatterns = [
    /peak[:\s]+([\d,]+)\s+players/i,
    /all-time\s+peak[:\s]+([\d,]+)/i,
  ];
  
  for (const pattern of peakPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      result.peakPlayers = parseInt(match[1].replace(/,/g, ''));
      break;
    }
  }
  
  // Look for current player counts
  const currentPattern = /current\s+players[:\s]+([\d,]+)/i;
  const currentMatch = searchText.match(currentPattern);
  if (currentMatch) {
    result.currentPlayers = parseInt(currentMatch[1].replace(/,/g, ''));
  }
  
  return result;
}

function extractReviewData(searchText: string): {
  reviewCount?: number;
  reviewScore?: number;
} {
  const result: { reviewCount?: number; reviewScore?: number } = {};
  
  // Look for review counts
  const countPatterns = [
    /([\d,]+)\s+user\s+reviews/i,
    /([\d,]+)\s+reviews/i,
  ];
  
  for (const pattern of countPatterns) {
    const match = searchText.match(pattern);
    if (match) {
      result.reviewCount = parseInt(match[1].replace(/,/g, ''));
      break;
    }
  }
  
  // Look for review scores
  const scorePatterns = [
    /([\d]+)%\s+(positive|recommended)/i,
    /score[:\s]+([\d]+)/i,
  ];
  
  for (const pattern of scorePatterns) {
    const match = searchText.match(pattern);
    if (match) {
      result.reviewScore = parseInt(match[1]);
      break;
    }
  }
  
  return result;
}
