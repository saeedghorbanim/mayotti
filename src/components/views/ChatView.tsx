import { useState, useRef, useEffect } from "react";
import { Send, Camera, Mic, MicOff, Loader2, X, Image, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { BudgetTracker } from "@/components/budget/BudgetTracker";
import { BudgetLimit, Expense } from "@/hooks/useLocalStorage";
import { usePromptLimit, MONTHLY_PROMPT_LIMIT } from "@/hooks/usePromptLimit";
import { Progress } from "@/components/ui/progress";
import { AiRequestError, aiRequestHeaders, functionUrl, toAiRequestError } from "@/lib/aiRequest";

interface ChatViewProps {
  budget: BudgetLimit | null;
  onAddExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  onSetBudgetLimit: (limitAmount: number) => void;
  onShowPaywall: () => void;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  image?: string;
}

// Only the most recent turns are sent to the AI, which keeps requests within the
// chat function's message cap and bounds per-request cost.
const MAX_HISTORY_MESSAGES = 20;

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hi! I'm Mayotti, your friendly budget buddy! 💰 Just tell me what you spent and I'll help you track it. You can type, use voice 🎤, or snap a photo of your receipt 📸!",
    role: "assistant",
    timestamp: new Date(),
  },
];

// Parse all expenses from AI response
function parseExpensesFromResponse(text: string): Array<{ amount: number; description: string; category: string }> {
  const regex = /\[EXPENSE:([\d.]+):([^:]+):([^\]]+)\]/g;
  const results: Array<{ amount: number; description: string; category: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    results.push({
      amount: parseFloat(match[1]),
      description: match[2].trim(),
      category: match[3].trim(),
    });
  }
  return results;
}

// Parse budget command from AI response
function parseBudgetFromResponse(text: string): { action: 'set' | 'add'; amount: number } | null {
  const regex = /\[BUDGET:(set|add):([\d.]+)\]/;
  const match = text.match(regex);
  
  if (match) {
    return {
      action: match[1] as 'set' | 'add',
      amount: parseFloat(match[2]),
    };
  }
  return null;
}

export const ChatView = ({ budget, onAddExpense, onSetBudgetLimit, onShowPaywall }: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  // Local budget state so UI updates immediately without waiting for parent re-render
  const [localBudget, setLocalBudget] = useState<BudgetLimit | null>(budget);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    hasReachedLimit,
    getRemainingPrompts,
    getUsagePercentage,
    incrementPromptCount,
    getLimitReachedMessage,
    usageData
  } = usePromptLimit();

  // Sync local budget when parent's budget prop changes (e.g. on tab switch / remount)
  useEffect(() => {
    setLocalBudget(budget);
  }, [budget]);

  // Read latest budget from localStorage and update local state immediately
  const refreshLocalBudget = () => {
    try {
      const stored = localStorage.getItem('mayotti_budget');
      if (stored) setLocalBudget(JSON.parse(stored));
    } catch {}
  };

  // Wrapper that updates local state immediately, without waiting for parent re-render
  const handleSetBudgetLimit = (amount: number) => {
    onSetBudgetLimit(amount);
    refreshLocalBudget();
  };

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording({
    onTranscription: (text) => {
      setInput(text);
      toast({
        title: "Got it",
        description: "Your voice has been transcribed",
      });
    },
    onError: (error) => {
      toast({
        title: "Voice error",
        description: error,
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeReceipt = async (imageData: string) => {
    setIsAnalyzingImage(true);
    try {
      const response = await fetch(functionUrl("analyze-receipt"), {
        method: "POST",
        headers: await aiRequestHeaders(),
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        throw await toAiRequestError(response);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Receipt analysis error:", error);
      throw error;
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    // Check monthly prompt limit (the paywall already ensures only subscribers reach this screen)
    if (hasReachedLimit()) {
      onShowPaywall();
      return;
    }

    let messageContent = input;
    let receiptData = null;

    // If there's an image, analyze it first
    if (selectedImage) {
      try {
        receiptData = await analyzeReceipt(selectedImage);
        if (receiptData.total) {
          messageContent = `I just uploaded a receipt from ${receiptData.store || 'a store'}. Total: $${receiptData.total}${receiptData.category ? ` (${receiptData.category})` : ''}. ${input}`.trim();
          
          // Save the expense from receipt locally
          onAddExpense({
            description: receiptData.store || 'Receipt',
            amount: parseFloat(receiptData.total),
            category: receiptData.category || 'shopping',
            store: receiptData.store || null,
          });
        } else if (receiptData.raw) {
          messageContent = `I uploaded a receipt image. Here's what was found: ${receiptData.raw}. ${input}`.trim();
        }
      } catch {
        toast({
          title: "Couldn't read receipt",
          description: "I'll still try to help! Just tell me the details.",
          variant: "destructive",
        });
        messageContent = input || "I tried to upload a receipt but it couldn't be read.";
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: "user",
      timestamp: new Date(),
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    let assistantContent = "";
    let fullResponseForParsing = "";

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      fullResponseForParsing += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("stream-")) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: `stream-${Date.now()}`,
            content: assistantContent,
            role: "assistant" as const,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      const chatMessages = messages
        .slice(1)
        .concat(userMessage)
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      const resp = await fetch(functionUrl("chat"), {
        method: "POST",
        headers: await aiRequestHeaders(),
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!resp.ok) {
        throw await toAiRequestError(resp);
      }
      if (!resp.body) {
        throw new Error("Failed to start stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // After streaming, check for expense tags and save locally
      const expenses = parseExpensesFromResponse(fullResponseForParsing);
      if (expenses.length > 0 && !receiptData) {
        for (const expense of expenses) {
          onAddExpense({
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            store: null,
          });
        }
        if (expenses.length === 1) {
          toast({
            title: "Expense saved",
            description: `$${expenses[0].amount.toFixed(2)} for ${expenses[0].description}`,
          });
        } else {
          const total = expenses.reduce((sum, e) => sum + e.amount, 0);
          toast({
            title: `${expenses.length} expenses saved`,
            description: `Total: $${total.toFixed(2)}`,
          });
        }
      }

      // Check for budget commands and update locally
      const budgetCommand = parseBudgetFromResponse(fullResponseForParsing);
      if (budgetCommand) {
        if (budgetCommand.action === 'set') {
          onSetBudgetLimit(budgetCommand.amount);
          refreshLocalBudget();
          toast({
            title: "Budget set",
            description: `Your budget is now $${budgetCommand.amount.toFixed(2)}`,
          });
        } else if (budgetCommand.action === 'add') {
          const currentLimit = localBudget?.limit_amount || 0;
          onSetBudgetLimit(currentLimit + budgetCommand.amount);
          refreshLocalBudget();
          toast({
            title: "Budget updated",
            description: `Added $${budgetCommand.amount.toFixed(2)} to your budget`,
          });
        }
      }

      // Increment usage after successful message (counts toward the monthly prompt limit)
      incrementPromptCount();
      
    } catch (error) {
      console.error("Chat error:", error);
      // The server is the source of truth for subscription and quota
      if (error instanceof AiRequestError && (error.status === 401 || error.status === 403)) {
        onShowPaywall();
        return;
      }
      if (error instanceof AiRequestError && error.status === 429) {
        toast({ title: "Monthly limit reached", description: getLimitReachedMessage() });
        return;
      }
      toast({
        title: "Oops!",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Budget Tracker */}
      <div className="px-5 pt-1 pb-3">
        <BudgetTracker budget={localBudget} onSetBudget={handleSetBudgetLimit} />
      </div>

      {/* Monthly Prompt Usage */}
      <div className="px-5 pb-3">
        <div className="bg-card rounded-[18px] px-4 py-3 shadow-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>Monthly messages</span>
            </div>
            <span>{usageData.count}/{MONTHLY_PROMPT_LIMIT}</span>
          </div>
          <Progress 
            value={getUsagePercentage()} 
            className="h-1.5 bg-muted"
          />
          {getRemainingPrompts() <= 5 && getRemainingPrompts() > 0 && (
            <p className="text-xs font-semibold text-warning mt-1">
              Only {getRemainingPrompts()} messages left this month
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {messages.slice(1).map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "px-[15px] py-[11px]",
                message.role === "user"
                  ? "max-w-[78%] bg-primary text-primary-foreground rounded-[18px] rounded-br-md"
                  : "max-w-[80%] bg-card text-foreground rounded-[18px] rounded-bl-md shadow-card"
              )}
            >
              {message.image && (
                <img 
                  src={message.image} 
                  alt="Receipt" 
                  className="max-w-full h-auto rounded-lg mb-2 max-h-32 object-cover"
                />
              )}
              <p className="text-[15px] leading-[21px] font-medium whitespace-pre-wrap">
                {message.content
                  .replace(/\[EXPENSE:[\d.]+:[^:]+:[^\]]+\]/g, '')
                  .replace(/\[BUDGET:(set|add):[\d.]+\]/g, '')
                  .trim()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-card text-foreground rounded-[18px] rounded-bl-md px-4 py-3 shadow-card" aria-label="mayotti is typing">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="px-4 py-2">
          <div className="relative inline-block">
            <img 
              src={selectedImage} 
              alt="Selected receipt" 
              className="h-20 w-auto rounded-lg border border-border"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 pt-3 pb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isAnalyzingImage}
            aria-label="Scan a receipt"
            className={cn(
              "w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-colors",
              selectedImage
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-foreground"
            )}
          >
            {isAnalyzingImage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : selectedImage ? (
              <Image className="w-5 h-5" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 min-w-0 flex items-center bg-card rounded-full pl-4 pr-1.5 h-11 shadow-card">
            <Input
              aria-label="Message mayotti"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? "Listening…" : "Spent $12 on lunch…"}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-[15px] h-11"
              disabled={isLoading || isRecording}
            />
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading || isProcessing}
              aria-label={isRecording ? "Stop listening" : "Speak an expense"}
              className={cn(
                "w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-colors",
                isRecording
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : isProcessing
                    ? "text-muted-foreground"
                    : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          </div>

          <Button
            type="submit"
            size="icon"
            aria-label="Send"
            className="w-11 h-11 rounded-full shrink-0 hover:bg-primary-pressed"
            disabled={isLoading || isRecording || isProcessing}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
