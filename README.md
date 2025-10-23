# Assessment Manager

A modern, full-stack assessment management application built with Next.js, TypeScript, and Supabase. This application provides a comprehensive platform for managing assessments, tracking progress, and planning study schedules with a beautiful, responsive UI.

## 🚀 Features

- **Assessment Management**: Create, edit, and organize assessments with detailed tracking
- **Progress Tracking**: Visual progress indicators and analytics
- **Study Planner**: Intelligent planning system for assessment preparation
- **Authentication**: Secure user authentication with Supabase Auth
- **Responsive Design**: Modern UI that works on all devices
- **Real-time Updates**: Live data synchronization across sessions
- **Dark/Light Mode**: Automatic theme switching support

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI, Shadcn/ui
- **Backend**: Supabase (Database, Auth, Real-time)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel-ready configuration
- **Development**: ESLint, PostCSS, Modern tooling

## 📦 Project Structure

```
assessment-manager/
├── app/                    # Next.js App Router pages
│   ├── assessments/       # Assessment management pages
│   ├── auth/             # Authentication pages
│   ├── planner/          # Study planner pages
│   └── progress/         # Progress tracking pages
├── components/           # Reusable React components
│   ├── ui/              # Base UI components (Shadcn/ui)
│   ├── assessment/      # Assessment-specific components
│   ├── task/           # Task management components
│   └── layout/         # Layout components
├── contexts/           # React Context providers
├── database/          # Database schemas and migrations
├── lib/              # Utility functions and configurations
├── types/           # TypeScript type definitions
└── styles/         # Global styles and CSS
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd assessment-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Database Setup**
   
   Run the database schema in your Supabase SQL editor:
   ```bash
   # Use the schema file in database/schema-complete.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

The application uses a PostgreSQL database with the following main tables:

- **profiles**: User profile information
- **assessments**: Assessment data and metadata
- **tasks**: Individual tasks within assessments
- **progress**: Progress tracking and analytics

All tables include Row Level Security (RLS) policies for secure data access.

## 🔐 Authentication

The app uses Supabase Auth with:
- Email/password authentication
- Social login support (configurable)
- Secure session management
- Row Level Security integration

## 🎨 UI Components

Built with a modern design system using:
- **Shadcn/ui**: High-quality, accessible components
- **Radix UI**: Unstyled, accessible primitives
- **Tailwind CSS**: Utility-first styling
- **CSS Variables**: Consistent theming support

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm start
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits recommended

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the setup guides in `SETUP.md`

## 🔄 Recent Updates

- ✅ Supabase integration complete
- ✅ Authentication system implemented
- ✅ UI components styled and responsive
- ✅ Database schema with RLS policies
- ✅ Progress tracking functionality
- ✅ Assessment management system

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
- **Authentication**: Supabase Auth for secure user management
- **Database**: Supabase with Row Level Security (RLS)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun
- Supabase account (for authentication and database)

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