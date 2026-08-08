/**
 * @file import.controller.ts
 * @description HTTP route handlers for browser history uploads, pasted URLs staging, and candidate confirmation.
 */

import { Request, Response, NextFunction } from 'express';
import * as importService from '../services/import.service.js';

/**
 * Handles POST `/api/import/file` request to upload a browser history JSON export file and stage candidates for user review.
 *
 * @param req - Express Request object containing authenticated `req.user` and uploaded `req.file`.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const uploadHistoryFile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Bad Request', message: 'No browser history export file uploaded.' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const result = await importService.parseAndStageBrowserHistory(userId, fileContent);

    return res.status(202).json({
      message: 'Browser history file uploaded and candidates staged for review.',
      stagedCount: result.candidates.length,
      data: result.candidates,
      stats: result.stats,
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('INVALID_')) {
      return res.status(422).json({ error: 'Unprocessable Entity', message: error.message });
    }
    next(error);
  }
};

/**
 * Handles POST `/api/import/urls` request to stage a list of manually pasted URLs for user review.
 *
 * @param req - Express Request object containing authenticated `req.user` and array of `urls` in request body.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const importPastedUrls = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { urls } = req.body;
  try {
    const result = await importService.parseAndStagePastedUrls(userId, urls);

    return res.status(202).json({
      message: 'Pasted URLs staged for review.',
      stagedCount: result.candidates.length,
      data: result.candidates,
      stats: result.stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET `/api/import/candidates` request to retrieve all pending import candidate entries for the authenticated user.
 *
 * @param req - Express Request object containing authenticated `req.user`.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const getPendingCandidates = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const candidates = await importService.getPendingCandidates(userId);
    return res.json({ data: candidates });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST `/api/import/confirm` request to confirm approved import candidates, creating `ActivityEntry` records
 * and marking excluded candidates as rejected.
 *
 * @param req - Express Request object containing authenticated `req.user`, `approvedCandidateIds`, and optional `excludedCandidateIds`.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const confirmCandidates = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { approvedCandidateIds, excludedCandidateIds } = req.body;
  try {
    const savedActivities = await importService.confirmImportCandidates(
      userId,
      approvedCandidateIds,
      excludedCandidateIds || []
    );

    return res.status(201).json({
      message: 'Import candidates confirmed and persisted to ActivityEntry records.',
      persistedCount: savedActivities.length,
      data: savedActivities,
    });
  } catch (error) {
    next(error);
  }
};

