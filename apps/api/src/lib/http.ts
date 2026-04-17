import type { Request, Response } from "express";

export function sendOk<T>(res: Response, data: T, message = "ok") {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
}

export function sendCreated<T>(res: Response, data: T, message = "created") {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    message,
    details: details ?? null,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}
