import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatBotProps {
  className?: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! 👋 I'm CampBot, your camping assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "What campsites do you have?",
    "How do I make a booking?",
    "What equipment can I rent?",
    "What activities are available?",
    "What are your prices?",
    "How do I cancel a booking?"
  ];

  const botResponses: Record<string, string> = {
    "what campsites do you have": "🏕️ We have three amazing campsites:\n• Mountain View Camp - $45/night (4.8⭐)\n• Lakeside Retreat - $35/night (4.6⭐)\n• Forest Haven - $40/night (4.7⭐)\n\nEach offers unique experiences and amenities!",
    
    "how do i make a booking": "📅 Making a booking is easy!\n1. Use our calendar booking widget on the homepage\n2. Select your check-in and check-out dates\n3. Choose number of guests\n4. Pick your preferred campsite\n5. Click 'Book Now'\n\nYou can also browse all campsites for more details!",
    
    "what equipment can i rent": "🎒 We offer premium camping equipment:\n• Tents (2-6 person) - $25/day\n• Sleeping bags (winter rated) - $15/day\n• Portable gas stoves - $12/day\n• Hiking gear and more!\n\nAll equipment is professionally maintained and cleaned.",
    
    "what activities are available": "🎯 Exciting outdoor activities await:\n• Mountain Hiking - $25 (Intermediate)\n• Lake Fishing - $20 (Easy)\n• Kayaking Adventures - $30 (Beginner)\n• Stargazing tours and more!\n\nAll activities include professional guides and equipment.",
    
    "what are your prices": "💰 Our pricing:\n• Campsites: $35-45/night\n• Activities: $20-30/person\n• Equipment: $12-25/day\n\nGroup discounts and package deals available!",
    
    "how do i cancel a booking": "❌ To cancel a booking:\n1. Log into your account\n2. Go to 'My Bookings' in your profile\n3. Find your booking and click 'Cancel'\n4. Confirm cancellation\n\nCancellations 48+ hours in advance get full refunds!",
    
    "hello": "Hello! 😊 Welcome to CampSpot! I'm here to help you plan the perfect camping adventure. What would you like to know?",
    
    "hi": "Hi there! 🌲 Ready to explore the great outdoors? I can help you with bookings, equipment, activities, and more!",
    
    "help": "🆘 I can assist you with:\n• Campsite information and booking\n• Equipment rental details\n• Available activities\n• Pricing and policies\n• Booking management\n\nJust ask me anything about camping with us!",
    
    "default": "🤔 I'm not sure about that specific question, but I can help you with:\n• Campsite bookings and information\n• Equipment rentals\n• Outdoor activities\n• Pricing details\n• Booking policies\n\nTry asking about one of these topics!"
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for keywords in the message
    for (const [key, response] of Object.entries(botResponses)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return botResponses.default;
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Generate bot response after a short delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputText),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
    handleSendMessage();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 transition-colors animate-bounce"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl w-80 h-96 flex flex-col">
          {/* Header */}
          <div className="bg-teal-600 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center">
              <Bot size={20} className="mr-2" />
              <div>
                <h4 className="font-semibold">CampBot</h4>
                <p className="text-xs opacity-90">Online now</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start">
                    {message.sender === 'bot' && (
                      <Bot size={16} className="text-teal-600 mr-2 mt-1 flex-shrink-0" />
                    )}
                    {message.sender === 'user' && (
                      <User size={16} className="text-white mr-2 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-teal-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
