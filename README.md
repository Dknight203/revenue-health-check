# Evergreen Readiness Analyzer

A single page tool for studios and publishers to score the health of a revenue system. Built for The Aesop Agency.

## Features

- 25 question assessment across 5 categories
- Normalized scoring (0 to 100 per category)
- Actionable recommendations for lowest scoring areas
- PDF export of full report
- Copy summary to clipboard
- Optional lead capture with webhook integration
- Embeddable iframe version at /embed
- No database required (uses localStorage by default)

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Configuration

### Webhook Setup (Optional)

To enable lead capture with webhook integration:

1. Create a `.env` file in the project root
2. Add your webhook URL:

```
VITE_WEBHOOK_URL=https://your-webhook-endpoint.com/api/lead
```

If no webhook URL is set, the app will:
- Still collect optional lead information
- Store all data in localStorage only
- Display the full report
- Allow PDF download

### Webhook Payload Format

When a webhook URL is configured, the following JSON payload is sent:

```json
{
  "lead": {
    "name": "string",
    "email": "string",
    "company": "string"
  },
  "analysis": {
    "overallScore": 75,
    "categoryScores": [
      {
        "categoryId": "retention",
        "categoryName": "Retention rhythm",
        "score": 80,
        "rawTotal": 12,
        "maxPossible": 15
      }
    ],
    "lowestCategories": ["Community and channels", "Post launch optimization habits"],
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

## Embedding in WordPress

1. Copy the embed code from the "How to embed" section on the home page
2. In WordPress, add an HTML block to your page
3. Paste the embed code:

```html
<iframe src="YOUR_SITE_URL/embed" width="100%" height="900" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
```

## Testing

### Manual Test with Fake Answers

To quickly preview the report, open the browser console on the home page and run:

```javascript
// Fill all answers with value 2 (repeatable)
const categories = ["retention", "monetization", "reengagement", "community", "optimization"];
categories.forEach(cat => {
  for (let i = 1; i <= 5; i++) {
    const questionId = `${cat}_${i}`;
    document.querySelector(`input[value="2"][id*="${questionId}"]`)?.click();
  }
});

// Click submit
document.querySelector('button:has-text("Submit for Analysis")').click();
```

## Project Structure

```
src/
├── components/        # React components
├── config/            # App configuration
├── data/              # Questions and recommendations
├── lib/               # Utilities (scoring, PDF, storage, webhook)
├── pages/             # Route pages (Index, Embed)
├── types/             # TypeScript definitions
└── index.css          # Design system and styles
```

## Scoring Model

- 5 categories with 5 questions each
- Each question scored 0 to 3
- Category score: (sum of answers / 15) × 100
- Overall score: average of 5 category scores
- Recommendations provided for 2 lowest scoring categories

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Requires JavaScript enabled

## License

Proprietary. Built for The Aesop Agency.
