import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, X, HelpCircle, BookOpen, Users, CreditCard, Settings, MessageSquare, Search, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import PropTypes from 'prop-types';

const helpTopics = [
  {
    title: "Properties",
    icon: BookOpen,
    description: "Manage your library properties and locations",
    color: "blue",
    questions: [
      "How do I add a new property?",
      "How to manage property details?",
      "How to view property statistics?",
      "How to edit property settings?"
    ]
  },
  {
    title: "Students",
    icon: Users,
    description: "Handle student registrations and management",
    color: "green",
    questions: [
      "How to add a new student?",
      "How to manage student bookings?",
      "How to view student history?",
      "How to update student information?"
    ]
  },
  {
    title: "Payments",
    icon: CreditCard,
    description: "Process and track financial transactions",
    color: "purple",
    questions: [
      "How to process a payment?",
      "How to view payment history?",
      "How to generate payment reports?",
      "How to handle refunds?"
    ]
  },
  {
    title: "Settings",
    icon: Settings,
    description: "Configure system preferences and options",
    color: "amber",
    questions: [
      "How to update system settings?",
      "How to manage user roles?",
      "How to configure notifications?",
      "How to backup data?"
    ]
  }
];

const HelpChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelpTopics, setShowHelpTopics] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setShowHelpTopics(false);

    setTimeout(() => {
      const agentMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I understand your question. Let me help you with that...',
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };

  const handleQuestionClick = (question) => {
    setInputMessage(question);
    handleSendMessage();
  };

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.questions.some(q => q.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
      >
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full blur opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:duration-200"></div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-100 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            <HelpCircle className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors relative z-10" />
          </div>
        </div>
        {messages.length > 1 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600">
            {messages.length - 1}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 shadow-lg border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
            <CardTitle className="text-sm font-medium">Help Center</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {showHelpTopics ? (
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <HelpCircle className="h-4 w-4" />
                    <span>Common Topics</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setShowHelpTopics(false)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Start Chat</span>
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {filteredTopics.map((topic) => (
                      <div
                        key={topic.title}
                        className={cn(
                          "p-4 rounded-lg border transition-all duration-200",
                          "hover:shadow-md cursor-pointer",
                          topic.color === 'blue' ? 'border-blue-100 hover:border-blue-200' :
                          topic.color === 'green' ? 'border-green-100 hover:border-green-200' :
                          topic.color === 'purple' ? 'border-purple-100 hover:border-purple-200' :
                          'border-amber-100 hover:border-amber-200'
                        )}
                        onClick={() => setSelectedTopic(topic)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            topic.color === 'blue' ? 'bg-blue-100' :
                            topic.color === 'green' ? 'bg-green-100' :
                            topic.color === 'purple' ? 'bg-purple-100' :
                            'bg-amber-100'
                          )}>
                            <topic.icon className={cn(
                              "h-5 w-5",
                              topic.color === 'blue' ? 'text-blue-600' :
                              topic.color === 'green' ? 'text-green-600' :
                              topic.color === 'purple' ? 'text-purple-600' :
                              'text-amber-600'
                            )} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{topic.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                            <div className="mt-2 space-y-1">
                              {topic.questions.map((question) => (
                                <Button
                                  key={question}
                                  variant="ghost"
                                  className="w-full justify-start text-left text-xs h-auto py-1 px-2 hover:bg-muted"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuestionClick(question);
                                  }}
                                >
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  {question}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="p-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex flex-col space-y-2",
                          message.sender === 'user' ? 'items-end' : 'items-start'
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2 max-w-[80%]",
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-muted'
                          )}
                        >
                          {message.content}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4 flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setShowHelpTopics(true)}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Back to Help Topics
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HelpChat; 