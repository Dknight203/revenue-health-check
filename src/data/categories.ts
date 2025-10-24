import { Category } from "@/types/analyzer";

export const categories: Category[] = [
  {
    id: "retention",
    name: "Retention rhythm",
    questions: [
      {
        id: "retention_1",
        text: "Live cadence exists and is documented",
        descriptions: {
          0: "No live cadence or documentation exists",
          1: "Informal cadence exists but not documented",
          2: "Cadence is documented and followed consistently",
          3: "Cadence is documented, measured, and optimized based on data"
        }
      },
      {
        id: "retention_2",
        text: "Event calendar covers at least six weeks",
        descriptions: {
          0: "No event calendar exists",
          1: "Events planned on ad hoc basis, less than two weeks ahead",
          2: "Calendar exists with at least six weeks of planned events",
          3: "Six week calendar exists and is visible to players"
        }
      },
      {
        id: "retention_3",
        text: "Event types vary by effort and impact",
        descriptions: {
          0: "No events or all events are the same type",
          1: "One or two event types used inconsistently",
          2: "Three or more event types with different resource requirements",
          3: "Event mix is planned and measured for engagement impact"
        }
      },
      {
        id: "retention_4",
        text: "Rewards or meta loop ties to events",
        descriptions: {
          0: "Events have no connection to progression systems",
          1: "Some events offer rewards but not tied to meta progression",
          2: "Event rewards connect to at least one meta progression system",
          3: "Event rewards drive measurable engagement in meta systems"
        }
      },
      {
        id: "retention_5",
        text: "In game messaging explains what is new",
        descriptions: {
          0: "No in game messaging about updates or events",
          1: "Updates mentioned in general announcements only",
          2: "Dedicated messaging shows what is new when players log in",
          3: "Messaging is targeted based on player state and behavior"
        }
      }
    ]
  },
  {
    id: "monetization",
    name: "Monetization structure",
    questions: [
      {
        id: "monetization_1",
        text: "Pricing ladder is clear with an anchor",
        descriptions: {
          0: "No clear pricing structure or single price point only",
          1: "Multiple prices exist but no clear value differentiation",
          2: "Pricing ladder with at least three tiers and value anchor",
          3: "Anchor drives measurable uplift in mid tier conversion"
        }
      },
      {
        id: "monetization_2",
        text: "Purchases map to common use rhythms daily weekly monthly",
        descriptions: {
          0: "No time based purchase structure",
          1: "One or two offers but not aligned to usage patterns",
          2: "Offers exist for daily, weekly, or monthly purchase rhythms",
          3: "Offer timing is tested and optimized for each rhythm"
        }
      },
      {
        id: "monetization_3",
        text: "Value clarity exists at point of sale",
        descriptions: {
          0: "Purchase UI shows price only with no value context",
          1: "Some value indicators but not consistent across offers",
          2: "All offers show clear value relative to base currency rate",
          3: "Value messaging tested and refined based on conversion data"
        }
      },
      {
        id: "monetization_4",
        text: "Progression avoids hard stalls without purchase",
        descriptions: {
          0: "Players hit hard gates that require purchase to continue",
          1: "Progression slows significantly but has some free path",
          2: "Free players can progress at reasonable pace through content",
          3: "Progression pacing is measured and balanced for retention"
        }
      },
      {
        id: "monetization_5",
        text: "Limited time offers avoid fatigue with spacing",
        descriptions: {
          0: "No limited offers or constant limited offers without breaks",
          1: "Limited offers used occasionally but no clear pattern",
          2: "Limited offers follow spacing rules to prevent fatigue",
          3: "Offer frequency and spacing tested for revenue and retention"
        }
      }
    ]
  },
  {
    id: "reengagement",
    name: "Re engagement and comeback paths",
    questions: [
      {
        id: "reengagement_1",
        text: "Owned audience list exists email or push or in game inbox",
        descriptions: {
          0: "No owned audience channel exists",
          1: "Channel exists but opt in rate is below ten percent",
          2: "Channel exists with opt in rate above ten percent",
          3: "Multiple channels exist with high opt in and engagement rates"
        }
      },
      {
        id: "reengagement_2",
        text: "Triggered messages respond to player behavior",
        descriptions: {
          0: "No triggered or behavior based messaging",
          1: "One or two generic messages sent on fixed schedule",
          2: "Messages trigger based on at least three player behaviors",
          3: "Triggered messages are tested and optimized for re engagement"
        }
      },
      {
        id: "reengagement_3",
        text: "Returners receive a welcome back path",
        descriptions: {
          0: "No special treatment for returning players",
          1: "Generic message or reward for all returners",
          2: "Structured path with clear steps and reward for comeback",
          3: "Path varies by lapse duration and is measured for effectiveness"
        }
      },
      {
        id: "reengagement_4",
        text: "Content vault allows rotation without new dev work",
        descriptions: {
          0: "All content is permanent or requires dev work to rotate",
          1: "Some content can be toggled but not systematically managed",
          2: "System exists to rotate content from vault without engineering",
          3: "Vault content is planned and measured for re engagement impact"
        }
      },
      {
        id: "reengagement_5",
        text: "Win back offers are time bound and measured",
        descriptions: {
          0: "No win back offers exist",
          1: "Occasional offers sent to lapsed users without structure",
          2: "Win back offers trigger after specific lapse periods",
          3: "Offers are tested and measured for conversion and return rate"
        }
      }
    ]
  },
  {
    id: "community",
    name: "Community and channels",
    questions: [
      {
        id: "community_1",
        text: "Known home base exists discord or site or forum",
        descriptions: {
          0: "No official community space exists",
          1: "Space exists but is not actively managed or promoted",
          2: "Active home base with regular posts and moderation",
          3: "Home base drives measurable word of mouth and retention"
        }
      },
      {
        id: "community_2",
        text: "Announcements reach existing players and new prospects",
        descriptions: {
          0: "No regular announcement cadence or channel",
          1: "Announcements posted but reach is minimal",
          2: "Announcements reach both existing players and public channels",
          3: "Announcement reach and engagement are tracked and optimized"
        }
      },
      {
        id: "community_3",
        text: "Creator kit exists with simple usage rights",
        descriptions: {
          0: "No assets or guidelines for creators",
          1: "Some assets exist but no clear usage terms",
          2: "Creator kit with logos, screenshots, and simple usage notes",
          3: "Kit is used by creators and usage is tracked"
        }
      },
      {
        id: "community_4",
        text: "Social posts preview real value not features only",
        descriptions: {
          0: "No social presence or posts are feature lists only",
          1: "Posts describe features without showing player value",
          2: "Posts show specific player moments or outcomes from features",
          3: "Post format is tested and optimized for engagement and install"
        }
      },
      {
        id: "community_5",
        text: "Community feedback appears in a visible change log",
        descriptions: {
          0: "No change log or feedback acknowledgment",
          1: "Updates mentioned but not tied to player feedback",
          2: "Change log exists and credits player suggestions",
          3: "Feedback loop is tracked and used to prioritize changes"
        }
      }
    ]
  },
  {
    id: "optimization",
    name: "Post launch optimization habits",
    questions: [
      {
        id: "optimization_1",
        text: "A single owner reviews telemetry weekly",
        descriptions: {
          0: "No regular telemetry review or owner",
          1: "Data reviewed occasionally by multiple people",
          2: "One person owns weekly review with consistent format",
          3: "Review drives documented decisions and action items"
        }
      },
      {
        id: "optimization_2",
        text: "A weekly test and learn cycle exists with a small backlog",
        descriptions: {
          0: "No test cadence or backlog",
          1: "Tests run occasionally but not on regular cycle",
          2: "Weekly test cycle exists with backlog of small experiments",
          3: "Test results inform next tests and are documented"
        }
      },
      {
        id: "optimization_3",
        text: "Each change has a target metric",
        descriptions: {
          0: "Changes made without defined success criteria",
          1: "Some changes have goals but not consistently tracked",
          2: "All changes define target metric before implementation",
          3: "Metrics are reviewed post launch and inform future tests"
        }
      },
      {
        id: "optimization_4",
        text: "A rollback plan is documented",
        descriptions: {
          0: "No rollback capability or plan",
          1: "Rollback possible but not documented or tested",
          2: "Rollback plan documented for all risky changes",
          3: "Rollback has been executed successfully at least once"
        }
      },
      {
        id: "optimization_5",
        text: "A monthly retro captures wins and misses",
        descriptions: {
          0: "No regular retrospective or review",
          1: "Occasional reviews but not structured or documented",
          2: "Monthly retro with documented wins and lessons",
          3: "Retro insights drive changes to process and prioritization"
        }
      }
    ]
  }
];
