# AI Chatbot - MERN Stack Application

A simple, user-friendly chatbot powered by Groq API (Llama models) built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

- 🤖 **AI-Powered Conversations**: Chat with Llama 3 8B model through Groq
- 💬 **Chat History Management**: View and manage previous chat sessions
- 🎨 **Modern UI**: Beautiful, responsive design with smooth animations
- 📱 **Mobile Responsive**: Works perfectly on desktop and mobile devices
- 🔄 **Real-time Chat**: Instant message sending and receiving
- 🗑️ **Session Management**: Create new chats and delete old ones
- 💾 **Persistent Storage**: Chat history saved in MongoDB database

## Tech Stack

- **Frontend**: React.js with modern CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Groq API (Llama 3 8B)
- **Styling**: Custom CSS with responsive design
- **Icons**: React Icons (Feather icons)

## Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (local installation) or MongoDB Atlas account
- [Groq API Key](https://console.groq.com/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd chatbot-app
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chatbot

# Server Configuration
PORT=5000
```

### 4. Get Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in to your account
3. Go to API Keys section
4. Create a new API key
5. Copy the generated key and paste it in your `.env` file

**Important**: Keep your API key secure and never commit it to version control.

### 5. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB Community Server
2. Start MongoDB service
3. The application will automatically create the database

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace the `MONGODB_URI` in your `.env` file with your Atlas connection string

## Running the Application

### Development Mode

```bash
# Run both frontend and backend concurrently
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Production Mode

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

## Usage Guide

### Starting a New Chat

1. Click the "New Chat" button in the header
2. A new chat session will be created
3. Start typing your message in the input field
4. Press Enter or click the send button to send your message

### Managing Chat History

- **View Previous Chats**: All your previous chat sessions appear in the sidebar
- **Switch Between Chats**: Click on any chat session in the sidebar to load it
- **Delete Chats**: Click the trash icon next to any chat session to delete it

### Chat Features

- **Real-time Responses**: The AI responds immediately to your messages
- **Typing Indicators**: See when the AI is processing your message
- **Message Timestamps**: Each message shows when it was sent
- **Error Handling**: Clear error messages if something goes wrong

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/chats` - Get all chat sessions
- `GET /api/chats/:sessionId` - Get specific chat session
- `POST /api/chats` - Create new chat session
- `POST /api/chats/:sessionId/message` - Send message to AI
- `DELETE /api/chats/:sessionId` - Delete chat session
- `GET /api/health` - Health check endpoint
- `GET /api/test-groq` - Test Groq API endpoint

## Project Structure

```
chatbot-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   └── index.js       # React entry point
│   └── package.json
├── server.js              # Express.js backend
├── package.json           # Backend dependencies
├── .env                   # Environment variables
├── env.example           # Environment template
└── README.md             # This file
```

## Configuration Options

### Groq API Settings

You can modify the AI behavior by editing the Groq configuration in `server.js`:

```javascript
const completion = await groq.chat.completions.create({
  messages: groqMessages,
  model: "llama3-8b-8192", // Using Llama 3 8B model
  temperature: 0.7,         // Creativity level (0-1)
  max_tokens: 1024,        // Maximum response length
});
```

### Rate Limiting

The application includes rate limiting to prevent abuse:

- 100 requests per 15 minutes per IP address
- Can be adjusted in `server.js`

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running locally
   - Check your MongoDB connection string
   - Verify network connectivity for Atlas

2. **Groq API Errors**
   - Verify your API key is correct
   - Check your Groq account balance
   - Ensure you have access to Llama models

3. **Port Already in Use**
   - Change the PORT in your `.env` file
   - Kill processes using the default ports

4. **CORS Errors**
   - The backend is configured to allow requests from the frontend
   - Check that the proxy setting in `client/package.json` is correct

### Error Messages

- **"Invalid Groq API key"**: Check your API key in the `.env` file
- **"Failed to connect to MongoDB"**: Check your database connection

## Security Considerations

- Never commit your `.env` file to version control
- Use environment variables for sensitive data
- Implement proper authentication for production use
- Consider rate limiting for API endpoints
- Validate and sanitize user inputs

## Deployment

### Heroku Deployment

1. Create a Heroku account
2. Install Heroku CLI
3. Create a new Heroku app
4. Set environment variables in Heroku dashboard
5. Deploy using Git

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the error logs in the console
3. Ensure all dependencies are properly installed
4. Verify your environment configuration

## Future Enhancements

- User authentication and accounts
- File upload capabilities
- Voice message support
- Multiple AI model options
- Chat export functionality
- Advanced conversation analytics 
