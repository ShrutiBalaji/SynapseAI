# Synapse - AI-Powered Problem Solving Platform

Synapse is an intelligent problem-solving platform that helps users organize, analyze, and solve complex issues through AI-powered conversations, knowledge graphs, and structured problem management.

## 🚀 Features

- **AI Chat Interface**: Interactive conversations with AI to explore and solve problems
- **Problem Management**: Create, organize, and track problems with status and priority levels
- **Knowledge Graph**: Visualize connections between problems, conjectures, criticisms, and artifacts
- **File Attachments**: Upload and analyze documents, images, and other files
- **Conversation History**: Maintain context across multiple chat sessions
- **Artifact Management**: Store and organize files related to specific problems
- **Conjectures & Criticisms**: Document hypotheses and critical analysis
- **Real-time Collaboration**: Share and collaborate on problem-solving efforts

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter API (Grok-4)
- **File Storage**: Local file system
- **Graph Visualization**: D3.js

## 📋 Prerequisites

Before running the application, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- An OpenRouter API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd synapse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Set up the database**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Run the `supabase.sql` file to create the database schema
   - Run the `FINAL-SETUP.sql` file to configure the application

## 🗄️ Database Setup

### Step 1: Create Database Schema
Run the `supabase.sql` file in your Supabase SQL Editor. This creates:
- Tables for problems, conversations, messages, conjectures, criticisms, artifacts
- User profiles and authentication
- Row Level Security policies

### Step 2: Configure Application
Run the `FINAL-SETUP.sql` file in your Supabase SQL Editor. This:
- Creates a default user profile
- Disables Row Level Security (for demo purposes)
- Adds the "urgent" status option
- Configures the application for immediate use

## 🚀 Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Usage Guide

### Getting Started
1. **Create a Problem**: Click "New Problem" to start a new problem-solving session
2. **Chat with AI**: Use the chat interface to explore and analyze problems
3. **Attach Files**: Upload documents, images, or other files for AI analysis
4. **View Knowledge Graph**: Navigate to the Graph page to see problem connections
5. **Manage Problems**: Use the Problems page to organize and track your work

### Key Features

#### Problem Management
- **Status Options**: Open, In Progress, Resolved, Urgent
- **Priority Levels**: Low, Medium, High
- **Problem Linking**: Automatically connect related problems

#### AI Chat
- **Context Awareness**: AI remembers previous conversations
- **File Analysis**: Upload and analyze documents
- **Problem Generation**: AI can create new problems from conversations

#### Knowledge Graph
- **Visual Connections**: See relationships between problems and concepts
- **Interactive Navigation**: Click nodes to explore details
- **Zoom and Pan**: Navigate large graphs easily

#### File Attachments
- **Supported Formats**: PDF, TXT, MD, JSON, CSV, and more
- **Automatic Processing**: Files are analyzed and linked to problems
- **Artifact Storage**: Files are saved as artifacts for future reference

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI | Yes |

### API Configuration

The application uses OpenRouter for AI capabilities. To get an API key:
1. Visit [OpenRouter](https://openrouter.ai/)
2. Create an account
3. Generate an API key
4. Add it to your `.env.local` file

## 📁 Project Structure

```
synapse/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── graph/         # Knowledge graph page
│   │   ├── problems/      # Problem management pages
│   │   └── page.tsx       # Main chat interface
│   └── lib/
│       └── supabase/      # Supabase client configuration
├── public/
│   └── uploads/           # File upload storage
├── supabase.sql           # Database schema
├── FINAL-SETUP.sql        # Application configuration
└── README.md              # This file
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify your Supabase credentials in `.env.local`
   - Ensure the database schema is properly set up
   - Check that `FINAL-SETUP.sql` has been run

2. **AI Not Responding**
   - Verify your OpenRouter API key
   - Check the browser console for API errors
   - Ensure you have sufficient API credits

3. **File Upload Issues**
   - Check that the `public/uploads` directory exists
   - Verify file permissions
   - Ensure file size is within limits

4. **Chat History Not Loading**
   - Run the `FINAL-SETUP.sql` script to disable RLS
   - Check browser console for database errors
   - Verify conversation data exists in the database

### Debug Mode

Enable debug logging by checking the browser console. The application provides detailed logging for:
- API requests and responses
- File upload progress
- Database operations
- AI interactions

## 🔒 Security Notes

- The application is configured for development/demo use
- Row Level Security is disabled for simplicity
- For production use, implement proper authentication and security measures
- File uploads are stored locally - consider cloud storage for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Verify all environment variables are set correctly
4. Ensure the database setup is complete

## 🎯 Roadmap

- [ ] User authentication and authorization
- [ ] Cloud file storage integration
- [ ] Real-time collaboration features
- [ ] Advanced AI model selection
- [ ] Export and import functionality
- [ ] Mobile application
- [ ] API documentation
- [ ] Performance optimizations

---

**Happy Problem Solving with Synapse! 🧠✨**
