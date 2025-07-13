import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSend, FiPlus, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import './App.css';

function App() {
  const [currentSession, setCurrentSession] = useState(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Countdown timer for rate limits
  useEffect(() => {
    let interval;
    if (rateLimitCountdown > 0) {
      interval = setInterval(() => {
        setRateLimitCountdown(prev => {
          if (prev <= 1) {
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [rateLimitCountdown]);

  // Fetch chat sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch chat history when session changes
  useEffect(() => {
    if (currentSession) {
      fetchChatHistory(currentSession);
    }
  }, [currentSession]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chats`);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load chat sessions');
    }
  };

  const fetchChatHistory = async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chats/${sessionId}`);
      setChatHistory(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError('Failed to load chat history');
    }
  };

  const createNewChat = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/chats`);
      const newSession = response.data.sessionId;
      setCurrentSession(newSession);
      setChatHistory([]);
      setMessage('');
      setError('');
      await fetchSessions();
    } catch (error) {
      console.error('Error creating new chat:', error);
      setError('Failed to create new chat session');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentSession) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_BASE_URL}/chats/${currentSession}/message`, {
        message: message.trim()
      });

      // Add user message and bot response to chat history
      const newMessages = [
        ...chatHistory,
        { role: 'user', content: message.trim(), timestamp: new Date() },
        { role: 'assistant', content: response.data.response, timestamp: new Date() }
      ];
      
      setChatHistory(newMessages);
      setMessage('');
      await fetchSessions(); // Refresh sessions list
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        if (errorMessage.includes('Rate limit exceeded') && errorMessage.includes('s')) {
          // Extract seconds from error message
          const secondsMatch = errorMessage.match(/(\d+)s/);
          if (secondsMatch) {
            const seconds = parseInt(secondsMatch[1]);
            setRateLimitCountdown(seconds);
            setError(`Rate limit exceeded. Please wait ${seconds}s before trying again.`);
          } else {
            setError(errorMessage);
          }
        } else {
          setError(errorMessage);
        }
      } else if (error.response?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment before trying again.');
      } else if (error.response?.status === 401) {
        setError('API key error. Please check your configuration.');
      } else {
        setError('Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`${API_BASE_URL}/chats/${sessionId}`);
      if (currentSession === sessionId) {
        setCurrentSession(null);
        setChatHistory([]);
      }
      await fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete chat session');
    }
  };

  const selectSession = (sessionId) => {
    setCurrentSession(sessionId);
    setError('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1><FiMessageSquare /> AI Chatbot</h1>
        <button 
          className="new-chat-btn" 
          onClick={createNewChat}
          disabled={loading}
        >
          <FiPlus /> New Chat
        </button>
      </header>

      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3>Chat History</h3>
          <div className="sessions-list">
            {sessions.map((session) => (
              <div 
                key={session.sessionId} 
                className={`session-item ${currentSession === session.sessionId ? 'active' : ''}`}
              >
                <button 
                  className="session-btn"
                  onClick={() => selectSession(session.sessionId)}
                >
                  <FiMessageSquare />
                  <span>Chat {formatDate(session.createdAt).split(',')[0]}</span>
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteSession(session.sessionId)}
                  title="Delete chat"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="no-sessions">No chat sessions yet</p>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-area">
          {error && (
            <div className="error-message">
              {rateLimitCountdown > 0 ? (
                <span>Rate limit exceeded. Please wait {rateLimitCountdown}s before trying again.</span>
              ) : (
                <span>{error}</span>
              )}
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          {!currentSession ? (
            <div className="welcome-screen">
              <h2>Welcome to AI Chatbot!</h2>
              <p>Start a new conversation to begin chatting with the AI.</p>
              <button 
                className="start-chat-btn"
                onClick={createNewChat}
                disabled={loading}
              >
                <FiPlus /> Start New Chat
              </button>
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className="messages-container">
                {chatHistory.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}
                  >
                    <div className="message-content">
                      {msg.content}
                    </div>
                    <div className="message-time">
                      {formatDate(msg.timestamp)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="message bot-message">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form className="message-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  disabled={loading || rateLimitCountdown > 0}
                  className="message-input"
                />
                <button 
                  type="submit" 
                  disabled={!message.trim() || loading || rateLimitCountdown > 0}
                  className="send-btn"
                >
                  <FiSend />
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App; 