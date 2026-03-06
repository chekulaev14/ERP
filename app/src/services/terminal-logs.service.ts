import { prisma } from "@/lib/prisma";

interface LogEntry {
  id: string;
  workerName: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  createdAt: Date;
}

interface WorkerSummary {
  workerId: string;
  name: string;
  count: number;
  total: number;
}

export async function getProductionLogs(params: {
  days: number;
  workerId?: string;
}): Promise<{ logs: LogEntry[]; summary: WorkerSummary[] }> {
  const since = new Date();
  since.setDate(since.getDate() - params.days);

  const where: Record<string, unknown> = {
    createdAt: { gte: since },
  };
  if (params.workerId) where.workerId = params.workerId;

  const logs = await prisma.productionLog.findMany({
    where,
    include: { worker: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const summaryMap: Record<string, { name: string; count: number; total: number }> = {};
  for (const log of logs) {
    if (!summaryMap[log.workerId]) {
      summaryMap[log.workerId] = { name: log.worker.name, count: 0, total: 0 };
    }
    summaryMap[log.workerId].count += log.quantity;
    summaryMap[log.workerId].total += Number(log.total);
  }

  return {
    logs: logs.map((l) => ({
      id: l.id,
      workerName: l.worker.name,
      itemName: l.itemName,
      quantity: l.quantity,
      pricePerUnit: Number(l.pricePerUnit),
      total: Number(l.total),
      createdAt: l.createdAt,
    })),
    summary: Object.entries(summaryMap).map(([id, s]) => ({
      workerId: id,
      ...s,
    })),
  };
}
