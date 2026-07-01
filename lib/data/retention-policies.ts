import { prisma } from "@/lib/core/db";

const DEFAULT_ACTION_LOG_RETENTION_DAYS = 90;

function resolveRetentionDays(days?: number) {
  if (typeof days === "number" && Number.isFinite(days) && days > 0) {
    return Math.floor(days);
  }

  const configured = Number(process.env.ACTION_LOG_RETENTION_DAYS);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }

  return DEFAULT_ACTION_LOG_RETENTION_DAYS;
}

export async function runRetentionPolicies(options: { actionLogRetentionDays?: number } = {}) {
  const actionLogRetentionDays = resolveRetentionDays(options.actionLogRetentionDays);
  const actionLogCutoff = new Date(Date.now() - actionLogRetentionDays * 24 * 60 * 60 * 1000);

  const actionLogs = await prisma.actionLog.deleteMany({
    where: {
      createdAt: {
        lt: actionLogCutoff
      }
    }
  });

  return {
    actionLogRetentionDays,
    actionLogCutoff,
    deleted: {
      actionLogs: actionLogs.count
    }
  };
}
