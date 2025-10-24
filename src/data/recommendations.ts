export interface Recommendation {
  diagnosis: string;
  actions: string[];
}

export const recommendations: Record<string, Recommendation> = {
  retention: {
    diagnosis: "Event rhythm needs structure to maintain consistent player engagement.",
    actions: [
      "Publish a six week event calendar and pin it in game and on your home channel",
      "Add a small weekly event and a medium biweekly event to create reliable touch points"
    ]
  },
  monetization: {
    diagnosis: "Pricing and offer structure lacks clarity or consistent value signals.",
    actions: [
      "Add a value anchor that is clearly higher than your core offer to set context",
      "Map one pack to a weekly rhythm and one pack to a monthly rhythm and label them"
    ]
  },
  reengagement: {
    diagnosis: "Comeback and win back systems are missing or underdeveloped.",
    actions: [
      "Capture opt in for email or push inside the game and welcome new signups within one day",
      "Add a returner path with a simple three step checklist and a small reward"
    ]
  },
  community: {
    diagnosis: "Community presence and creator support need more consistent execution.",
    actions: [
      "Publish a creator kit with logo files simple usage notes and an example post",
      "Post a single clip that previews a real moment that a player gains next week"
    ]
  },
  optimization: {
    diagnosis: "Regular testing and learning habits are not yet established.",
    actions: [
      "Pick one weekly metric for the current focus retention or conversion and track it public to the team",
      "Run one change per week with a short hypothesis and a rollback note"
    ]
  }
};
