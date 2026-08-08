import { useNavigate } from "react-router-dom";
import { ArrowLeft, ListChecks } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useActivityHistory } from "@/hooks/useActivityHistory";
import { timeAgo } from "@/lib/timeAgo";
import type { ActivityLogEntry } from "@/hooks/useActivityLog";

interface DayGroup {
  key: string;
  label: string;
  items: ActivityLogEntry[];
}

interface MonthGroup {
  key: string;
  label: string;
  days: DayGroup[];
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function buildGroups(entries: ActivityLogEntry[]): MonthGroup[] {
  const months: MonthGroup[] = [];

  for (const entry of entries) {
    const date = new Date(entry.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const dayKey = `${monthKey}-${date.getDate()}`;

    let month = months[months.length - 1]?.key === monthKey ? months[months.length - 1] : undefined;
    if (!month) {
      month = { key: monthKey, label: monthLabel(date), days: [] };
      months.push(month);
    }

    let day = month.days[month.days.length - 1]?.key === dayKey ? month.days[month.days.length - 1] : undefined;
    if (!day) {
      day = { key: dayKey, label: dayLabel(entry.created_at), items: [] };
      month.days.push(day);
    }

    day.items.push(entry);
  }

  return months;
}

export default function ActivityHistory() {
  const navigate = useNavigate();
  const { entries, loading } = useActivityHistory();
  const groups = buildGroups(entries);

  const allMonthKeys = groups.map((m) => m.key);
  const allDayKeys = groups.flatMap((m) => m.days.map((d) => d.key));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          FULL ACTIVITY HISTORY
        </h2>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading history...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No activity recorded yet</p>
      ) : (
        <Accordion type="multiple" defaultValue={allMonthKeys}>
          {groups.map((month) => (
            <AccordionItem key={month.key} value={month.key} className="border-none">
              <AccordionTrigger className="hover:no-underline">
                <span className="text-base font-heading font-semibold">{month.label}</span>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" defaultValue={allDayKeys} className="pl-2 space-y-1">
                  {month.days.map((day) => (
                    <AccordionItem key={day.key} value={day.key} className="border-none">
                      <AccordionTrigger className="hover:no-underline py-2">
                        <span className="text-sm font-semibold text-muted-foreground">{day.label}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-2">
                          {day.items.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
                              <span className="mt-1 h-2 w-2 rounded-full shrink-0 bg-white/30" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">
                                  <span className="font-semibold">{item.actor_name}</span>{" "}
                                  <span className="text-muted-foreground">{item.action}</span>
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground font-mono shrink-0">{timeAgo(item.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}