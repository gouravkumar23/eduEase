import { AppError } from '../../../core/errors';
import { ErrorCodes } from '../../../core/errors';
import { logger } from '../../../core/logging';

/**
 * ExamService - The single public entry point for all exam operations.
 *
 * Future code should only call methods on ExamService.
 * The service will later hide:
 * - Question generation (AI or manual)
 * - Exam distribution and allocation
 * - Result calculation and grading
 * - Proctoring integration
 * - Analytics aggregation
 */

export interface ExamConfig {
  title: string;
  duration: number;
  questionCount: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  scoring: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface GeneratedExam {
  id: string;
  title: string;
  questions: unknown[];
  totalScore: number;
  config: ExamConfig;
}

export class ExamService {
  private static instance: ExamService;

  static getInstance(): ExamService {
    if (!ExamService.instance) {
      ExamService.instance = new ExamService();
    }
    return ExamService.instance;
  }

  /**
   * Generate a new exam with AI or manual questions.
   * This is the primary method for exam creation.
   */
  async generateExam(_config: ExamConfig, _options?: { useAI?: boolean; topic?: string }): Promise<GeneratedExam> {
    logger.info('Exam generation request');
    throw new AppError(
      'Exam generation not yet implemented',
      ErrorCodes.NOT_IMPLEMENTED
    );
  }

  /**
   * Distribute questions to students for an exam.
   */
  async distributeQuestions(_examId: string, _studentIds: string[]): Promise<void> {
    logger.info('Question distribution request');
    throw new AppError(
      'Question distribution not yet implemented',
      ErrorCodes.NOT_IMPLEMENTED
    );
  }

  /**
   * Calculate results for an exam attempt.
   */
  async calculateResults(_attemptId: string): Promise<unknown> {
    logger.info('Result calculation request');
    throw new AppError(
      'Result calculation not yet implemented',
      ErrorCodes.NOT_IMPLEMENTED
    );
  }

  /**
   * Get exam analytics and statistics.
   */
  async getExamAnalytics(_examId: string): Promise<unknown> {
    logger.info('Exam analytics request');
    throw new AppError(
      'Exam analytics not yet implemented',
      ErrorCodes.NOT_IMPLEMENTED
    );
  }
}

export const examService = ExamService.getInstance();
