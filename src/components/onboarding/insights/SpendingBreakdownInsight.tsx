import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { OnboardingAnswers } from "@/hooks/useOnboarding";

interface SpendingBreakdownInsightProps {
  answers: OnboardingAnswers;
}

const CATEGORY_LABELS: Record<string, string> = {
  groceries: "Groceries",
  dining: "Dining & Takeout",
  transportation: "Transportation",
  shopping: "Shopping",
  entertainment: "Entertainment",
  bills_utilities: "Bills & Utilities",
  housing: "Housing & Rent",
  health_fitness: "Health & Fitness",
  travel: "Travel",
  subscriptions: "Subscriptions",
};

const COLORS = ["hsl(var(--primary))", "#0D9488", "#2563EB", "#8B5CF6", "#EC4899", "#0891B2"];

const DEFAULT_CATEGORIES = ["groceries", "dining", "transportation", "shopping", "entertainment"];

export const SpendingBreakdownInsight = ({ answers }: SpendingBreakdownInsightProps) => {
  const categories =
    answers.topSpendingCategories.length > 0 ? answers.topSpendingCategories.slice(0, 6) : DEFAULT_CATEGORIES;

  const share = Math.floor(100 / categories.length);
  const data = categories.map((key, i) => ({
    key,
    label: CATEGORY_LABELS[key] || key,
    value: i === categories.length - 1 ? 100 - share * (categories.length - 1) : share,
  }));

  const chartConfig = data.reduce((acc, d, i) => {
    acc[d.key] = { label: d.label, color: COLORS[i % COLORS.length] };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className="flex flex-col items-center gap-4">
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[220px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="key" innerRadius={55} outerRadius={90} paddingAngle={3}>
            {data.map((d, i) => (
              <Cell key={d.key} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full px-4">
        {data.map((d, i) => (
          <div key={d.key} className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-muted-foreground truncate">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
