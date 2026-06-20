type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  write("info", message, context);
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  write("warn", message, context);
}

export function logError(message: string, context?: Record<string, unknown>) {
  write("error", message, context);
}
