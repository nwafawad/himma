import { Request, Response, NextFunction } from 'express';
import * as importService from '../services/import.service.js';

export const uploadHistoryFile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Bad Request', message: 'No browser history export file uploaded.' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const candidates = await importService.parseAndStageBrowserHistory(userId, fileContent);

    return res.status(202).json({
      message: 'Browser history file uploaded and candidates staged for review.',
      stagedCount: candidates.length,
      data: candidates,
    });
  } catch (error: any) {
    if (error.message && error.message.startsWith('INVALID_')) {
      return res.status(422).json({ error: 'Unprocessable Entity', message: error.message });
    }
    next(error);
  }
};

export const importPastedUrls = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { urls } = req.body;
  try {
    const candidates = await importService.parseAndStagePastedUrls(userId, urls);

    return res.status(202).json({
      message: 'Pasted URLs staged for review.',
      stagedCount: candidates.length,
      data: candidates,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingCandidates = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const candidates = await importService.getPendingCandidates(userId);
    return res.json({ data: candidates });
  } catch (error) {
    next(error);
  }
};

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
