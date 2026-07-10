"use client";

import { DateSelector } from "@/components/tasks/date-selector";
import { Board } from "@/components/tasks/board";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PageHeader } from "@/components/ui/page-header";
import { useAccessToken } from "@/lib/auth";
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
