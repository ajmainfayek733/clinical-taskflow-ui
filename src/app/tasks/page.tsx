"use client";

import { DateSelector } from "@/components/tasks/DateSelector";
import { Board } from "@/components/tasks/Board";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAccessToken } from "@/lib/Auth";
import { useDateStore } from "@/store/useDateStore";

export default function TasksPage() {
  const { selectedDate } = useDateStore();
  const token = useAccessToken();

  return (
    <AuthGuard>
      <main>
        <PageHeader
          title="Daily Clinical Work Board"
          description="Track and prioritize tasks by date across To Do, In Progress, and Done."
        />
        <DateSelector />
        <Board date={selectedDate} token={token} />
      </main>
    </AuthGuard>
  );
}
