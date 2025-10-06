import { useMemo } from "react";

interface AttestationRequest {
  id: string;
  status: string;
  created_at: string;
  student_group: string;
  student_id?: string;
}

export const useRequestStatistics = (requests: AttestationRequest[]) => {
  return useMemo(() => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter((r) => r.status === "pending").length;
    const approvedRequests = requests.filter((r) => r.status === "approved").length;
    const rejectedRequests = requests.filter((r) => r.status === "rejected").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRequests = requests.filter((req) => {
      const requestDate = new Date(req.created_at);
      requestDate.setHours(0, 0, 0, 0);
      return requestDate.getTime() === today.getTime();
    }).length;

    const thisWeekRequests = requests.filter((req) => {
      const requestDate = new Date(req.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return requestDate >= weekAgo;
    }).length;

    const thisMonthRequests = requests.filter((req) => {
      const requestDate = new Date(req.created_at);
      return (
        requestDate.getMonth() === today.getMonth() &&
        requestDate.getFullYear() === today.getFullYear()
      );
    }).length;

    const avgProcessingTime = approvedRequests > 0
      ? requests
          .filter((r) => r.status === "approved")
          .reduce((acc, req) => {
            const createdAt = new Date(req.created_at);
            const now = new Date();
            const diff = now.getTime() - createdAt.getTime();
            return acc + diff / (1000 * 60 * 60 * 24);
          }, 0) / approvedRequests
      : 0;

    const requestsByGroup = requests.reduce((acc, req) => {
      acc[req.student_group] = (acc[req.student_group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      todayRequests,
      thisWeekRequests,
      thisMonthRequests,
      avgProcessingTime,
      requestsByGroup,
    };
  }, [requests]);
};
