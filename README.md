# AI Image Generator

A modern web application for generating high-quality images using AI, built with Next.js 14, Supabase, and Google's Gemini API.

## Features

- **AI Image Generation**: Generate images from text prompts using Gemini 2.0 Flash
- **User Authentication**: Secure signup/login with Supabase Auth
- **Rate Limiting**: Different limits for guests (3/day) and registered users (50/day)
- **Image Management**: Save, favorite, and download generated images
- **Content Filtering**: Built-in safety filters for inappropriate content
- **Responsive Design**: Works perfectly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL + Auth)
- **AI Model**: Google Gemini 2.0 Flash Image Preview
- **Image Storage**: Cloudinary (configurable)
- **Deployment**: Vercel

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Supabase account
- Google AI API key (for Gemini)
- Cloudinary account (optional, for image storage)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-image-generator
npm install
```

### 2. Environment Variables

Copy the `.env.local` file and fill in your values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Gemini AI Configuration
GOOGLE_AI_API_KEY=your_gemini_api_key

# Cloudinary Configuration (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) policies

### 4. Google AI API

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create an API key for Gemini
3. Add it to your `.env.local` file

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## API Endpoints

### `POST /api/generate`
Generate images from text prompts.

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x1024",
  "style": "natural",
  "quality": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "images": [{
      "id": "unique_id",
      "url": "image_url",
      "thumbnail": "thumbnail_url",
      "size": "1024x1024",
      "created_at": "timestamp"
    }],
    "usage": {
      "tokens": 1290,
      "cost": 0.039
    }
  }
}
```

### `GET /api/history`
Get user's generation history (requires authentication).

### `GET /api/credits`
Get user's remaining credits (requires authentication).

## Project Structure

```
ai-image-generator/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   ├── lib/              # Configuration files
│   ├── types/            # TypeScript definitions
│   └── utils/            # Helper functions
├── public/               # Static assets
├── supabase-schema.sql   # Database schema
└── package.json
```

## Usage Limits

- **Guest Users**: 3 generations per day, 2 per hour
- **Registered Users**: 50 generations per day, 10 per hour

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all the environment variables in your Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_AI_API_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, please create an issue in the GitHub repository.