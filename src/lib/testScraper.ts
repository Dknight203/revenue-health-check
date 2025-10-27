import { scrapeGameUrl } from "./gameScraper";

export async function testGameScraper(url: string) {
  console.log(`\n🧪 Testing scraper with URL: ${url}`);
  console.log("━".repeat(60));
  
  try {
    const metadata = await scrapeGameUrl(url);
    
    console.log("✅ Scraping successful!");
    console.log("\n📊 Extracted Metadata:");
    console.log("━".repeat(60));
    console.log(`Title:          ${metadata.title}`);
    console.log(`Platform:       ${metadata.platform}`);
    console.log(`Price:          ${typeof metadata.price === 'number' ? `$${metadata.price}` : metadata.price}`);
    console.log(`Genre:          ${metadata.genre.join(", ") || "N/A"}`);
    console.log(`Release State:  ${metadata.releaseState}`);
    console.log(`Multiplayer:    ${metadata.isMultiplayer ? "Yes" : "No"}`);
    console.log(`Review Score:   ${metadata.reviewScore || "N/A"}`);
    console.log(`Release Date:   ${metadata.lastUpdateDate || "N/A"}`);
    console.log(`Archetype:      ${metadata.archetype}`);
    console.log("━".repeat(60));
    
    return metadata;
  } catch (error) {
    console.error("❌ Scraping failed:", error);
    throw error;
  }
}
