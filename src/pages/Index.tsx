import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { ChatView } from "@/components/views/ChatView";
import { StatsView } from "@/components/views/StatsView";
import { RecurringView } from "@/components/views/RecurringView";
import { HistoryView } from "@/components/views/HistoryView";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAppUsage } from "@/hooks/useAppUsage";
import { usePaywall } from "@/hooks/usePaywall";

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const { expenses, budget, deleteExpense, addExpense, setBudgetLimit } = useLocalStorage();
  const { setSubscriptionActive } = useAppUsage();
  const { presentPaywall } = usePaywall(setSubscriptionActive);

  // Voluntary paywall trigger: Settings' "Upgrade to Pro" and the monthly
  // AI-prompt cap in ChatView. The mandatory subscription gate itself lives
  // in App.tsx, before this page ever mounts.
  const handleShowPaywall = () => {
    presentPaywall();
  };

  // Calculate monthly total from current month's expenses
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTotal = expenses
    .filter((e) => {
      const date = new Date(e.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col">
      <AppHeader monthlyTotal={monthlyTotal} onShowPaywall={handleShowPaywall} />

      <div className="flex-1 min-h-0 overflow-hidden pb-20">
        {activeTab === "chat" && (
          <ChatView
            budget={budget}
            onAddExpense={addExpense}
            onSetBudgetLimit={setBudgetLimit}
            onShowPaywall={handleShowPaywall}
          />
        )}
        {activeTab === "stats" && <StatsView expenses={expenses} />}
        {activeTab === "recurring" && <RecurringView expenses={expenses} />}
        {activeTab === "history" && <HistoryView expenses={expenses} onDeleteExpense={deleteExpense} />}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
