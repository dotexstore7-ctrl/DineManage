# Overview

RestaurantPro is a comprehensive restaurant management system built with a full-stack TypeScript architecture. The application provides role-based access control for different restaurant staff members including administrators, cashiers, store keepers, authorising officers, and barmen. The system manages kitchen orders (K.O.Ts), inventory, menu items, billing, and provides comprehensive reporting capabilities across both restaurant and bar operations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modern React patterns with custom hooks and reusable UI components

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with role-based middleware for authorization
- **File Structure**: Clean separation between server, client, and shared code

## Authentication & Authorization
- **Provider**: Replit OAuth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL session store
- **Role-Based Access Control**: Five distinct roles with specific permissions:
  - Admin: Full system access
  - Restaurant Cashier: Order creation and billing
  - Store Keeper: Inventory and stock management
  - Authorising Officer: Approval workflows
  - Barman: Bar-specific operations

## Database Design
- **Database**: PostgreSQL with connection pooling via Neon serverless
- **Schema Management**: Drizzle migrations with type-safe schema definitions
- **Key Entities**: Users, Menu Items, Ingredients, K.O.Ts, Stock Management, Bills
- **Relationships**: Proper foreign key relationships between menu items and ingredients
- **Session Storage**: Dedicated sessions table for authentication persistence

## Development Environment
- **Build System**: Vite for fast development and optimized production builds
- **Development Server**: Hot module replacement with Vite middleware integration
- **Error Handling**: Runtime error overlay for development debugging
- **Code Quality**: TypeScript strict mode with comprehensive type checking

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form, TanStack Query
- **UI Components**: Radix UI primitives, Lucide React icons, Font Awesome
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer, class-variance-authority
- **Validation**: Zod for schema validation, hookform/resolvers for form integration

## Backend Infrastructure
- **Database**: Neon PostgreSQL serverless, Drizzle ORM, connect-pg-simple
- **Authentication**: OpenID Client, Passport.js, Express sessions
- **Server**: Express.js, WebSocket support via ws package
- **Utilities**: Memoizee for caching, date-fns for date manipulation

## Development Tools
- **Build Tools**: Vite, ESBuild, TypeScript compiler
- **Replit Integration**: Vite plugins for Replit development environment
- **Development Utilities**: Runtime error modal, cartographer for debugging

## Database Configuration
- **Connection**: Neon serverless PostgreSQL with WebSocket constructor
- **ORM**: Drizzle with push-based migrations
- **Environment**: DATABASE_URL required for connection string