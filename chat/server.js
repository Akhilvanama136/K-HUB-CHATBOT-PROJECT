const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Groq Configuration
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Chat Schema
const chatSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', chatSchema);

// Routes

// Get all chat sessions
app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Chat.find({}, { sessionId: 1, createdAt: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Get specific chat session
app.get('/api/chats/:sessionId', async (req, res) => {
  try {
    const chat = await Chat.findOne({ sessionId: req.params.sessionId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat session' });
  }
});

// Create new chat session
app.post('/api/chats', async (req, res) => {
  try {
    const sessionId = Date.now().toString();
    const newChat = new Chat({
      sessionId,
      messages: []
    });
    await newChat.save();
    res.json({ sessionId, message: 'New chat session created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// Send message to Groq and save to database
app.post('/api/chats/:sessionId/message', async (req, res) => {
  try {
    const { message } = req.body;
    const { sessionId } = req.params;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    // Find or create chat session
    let chat = await Chat.findOne({ sessionId });
    if (!chat) {
      chat = new Chat({ sessionId, messages: [] });
    }

    // Add user message to chat
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // For debugging: Log the request
    console.log('Sending request to Groq with message:', message.substring(0, 50) + '...');

    // Prepare messages for Groq (convert to Groq format)
    const groqMessages = chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Get response from Groq using Llama model
    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama3-8b-8192", // Using Llama 3 8B model through Groq
      temperature: 0.7,
      max_tokens: 1024,
    });

    const assistantResponse = completion.choices[0]?.message?.content || 'No response generated';

    console.log('Received response from Groq:', assistantResponse.substring(0, 50) + '...');

    // Add assistant response to chat
    chat.messages.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date()
    });

    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      sessionId,
      response: assistantResponse,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error details:', {
      status: error.status,
      statusText: error.statusText,
      message: error.message
    });
    
    // Handle different types of errors
    if (error.status === 429) {
      // Rate limit exceeded
      res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment before trying again.' });
    } else if (error.message && error.message.includes('API key')) {
      res.status(401).json({ error: 'Invalid Groq API key' });
    } else if (error.status === 404) {
      res.status(404).json({ error: 'AI model not found. Please check your API configuration.' });
    } else {
      res.status(500).json({ error: 'Failed to process message. Please try again later.' });
    }
  }
});

// Delete chat session
app.delete('/api/chats/:sessionId', async (req, res) => {
  try {
    const result = await Chat.deleteOne({ sessionId: req.params.sessionId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chatbot API is running' });
});

// Test Groq API endpoint
app.get('/api/test-groq', async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: "Hello, this is a test message." }],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content || 'No response';

    res.json({ 
      status: 'success', 
      message: 'Groq API is working!',
      response: response.substring(0, 100) + '...'
    });
  } catch (error) {
    console.error('Groq API test error:', error);
    res.status(500).json({ 
      error: 'Groq API test failed',
      details: error.message,
      status: error.status
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 