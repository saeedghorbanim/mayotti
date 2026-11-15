import { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { ChatView } from "@/components/views/ChatView";
import { StatsView } from "@/components/views/StatsView";
import { RecurringView } from "@/components/views/RecurringView";
import { HistoryView } from "@/components/views/HistoryView";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAppUsage } from "@/hooks/useAppUsage";
import { usePaywall } from "@/hooks/usePaywall";
import { useOnboarding } from "@/hooks/useOnboarding";
import { checkBalanceAlert, initReminders } from "@/lib/reminders";

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const { expenses, budget, deleteExpense, addExpense, updateExpense, setBudgetLimit } = useLocalStorage();
  const { setSubscriptionActive } = useAppUsage();
  const { presentPaywall } = usePaywall(setSubscriptionActive);
  const { answers } = useOnboarding();

  // Reminders: ask for notification permission once and keep the nudge in
  // sync with the user's setting.
  useEffect(() => {
    initReminders(answers?.notificationPreference);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Low-balance alerts (always on): checked whenever the budget changes.
  useEffect(() => {
    if (budget) checkBalanceAlert(budget.limit_amount, budget.current_spent);
  }, [budget?.limit_amount, budget?.current_spent]);

  // Voluntary paywall trigger: Settings' "View Plans" and the monthly
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

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "chat" && (
          <ChatView
            budget={budget}
            onAddExpense={addExpense}
            onUpdateExpense={updateExpense}
            onSetBudgetLimit={setBudgetLimit}
            onShowPaywall={handleShowPaywall}
            onOpenTab={setActiveTab}
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
