# Assessment Manager

A professional assessment and task management platform built with Next.js 15, TypeScript, and Tailwind CSS v4. This application embodies **Professional Elegance** with a focus on clarity, discipline, and effortless simplicity.

✨ **Features secure authentication with Clerk and database storage with Supabase**

## ✨ Features

### 🎯 Assessment Management
- **Comprehensive Overview**: View all assessments in an organized, scannable grid layout
- **Smart Filtering**: Filter assessments by status (All, Upcoming, Completed)
- **Search Functionality**: Quick search across assessment titles and subjects
- **Priority Indicators**: Visual alerts for assessments due within 3 days

### 📋 Task Breakdown
- **Card-Based Tasks**: Each assessment breaks down into manageable task cards
- **Progress Tracking**: Real-time progress indicators for each assessment
- **Task Completion**: Interactive checkboxes with smooth animations
- **Inline Task Creation**: Add tasks directly within each assessment workspace

### 🎨 Professional Design
- **Clean Interface**: Notion-like focus on scannability and composure
- **Smooth Animations**: Gentle transitions and micro-interactions using Framer Motion
- **Dark Mode Support**: Full dark/light theme compatibility
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG AA compliant with proper focus states and keyboard navigation

### 🛠 Technical Stack
- **Framework**: Next.js 15.5.6 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS v4 with custom theme
- **Components**: shadcn/ui component library
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React icon set
- **Authentication**: Clerk for secure user management
- **Database**: Supabase with Row Level Security (RLS)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- Clerk account (for authentication)
- Supabase account (for database)

### Quick Setup

For detailed setup instructions, see **[SETUP.md](./SETUP.md)**

1. Clone the repository:
```bash
git clone <repository-url>
cd assessment-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure Clerk and Supabase (see SETUP.md)

5. Set up database schema:
   - In Supabase Dashboard → SQL Editor
   - Run the contents of `database/schema.sql`

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## 📱 Application Structure

### Pages
- **Home (`/`)**: Welcoming dashboard with feature overview
- **Assessments (`/assessments`)**: Main workspace for managing assessments and tasks
- **Planner (`/planner`)**: Study planning and scheduling (planned)
- **Progress (`/progress`)**: Analytics and progress tracking (planned)

### Key Components
- **Assessment Cards**: Overview cards with progress indicators and status badges
- **Task Management**: Interactive task lists with completion tracking
- **Search & Filter**: Header controls for assessment discovery
- **Modal Forms**: Clean form interfaces for creating new assessments

## 🎯 Design Philosophy

### Professional Elegance
The interface embodies calm confidence through:
- **Whitespace**: Generous spacing for visual breathing room
- **Typography**: Clear hierarchy with Geist font family
- **Color Palette**: Professional neutral tones with subtle accents
- **Interactions**: Smooth, predictable transitions that feel natural

### User Experience
- **Don't Make Me Think**: Every interaction is obvious and predictable
- **Visual Hierarchy**: Clear information structure that guides the eye
- **Responsive Feedback**: Immediate visual confirmation for all actions
- **Effortless Navigation**: Seamless transitions between overview and detail views

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure
```
assessment-manager/
├── app/                    # Next.js app directory
│   ├── assessments/       # Assessment management pages
│   ├── globals.css        # Global styles and theme
│   ├── layout.tsx         # Root layout with navigation
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── motion/           # Animation wrappers
└── lib/                  # Utility functions
```

## 🌟 Features Demonstrated

This implementation showcases:
- **Modern React Patterns**: Hooks, TypeScript, component composition
- **State Management**: Local state with useState for demo purposes
- **Responsive Design**: Mobile-first approach with Tailwind utilities
- **Animation**: Smooth page transitions and micro-interactions
- **Accessibility**: Proper ARIA labels, focus management, and keyboard navigation
- **Performance**: Optimized images, lazy loading, and efficient re-renders

## 🚀 Deploy

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).