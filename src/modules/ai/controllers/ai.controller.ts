import { Request, Response } from 'express';
import { contentGeneratorService } from '@modules/ai/services/content-generator.service';
import { promptOptimizerService } from '@modules/ai/services/prompt-optimizer.service';
import { summarizerService } from '@modules/ai/services/summarizer.service';
import { tagsGeneratorService } from '@modules/ai/services/tags-generator.service';
import { recommendationService } from '@modules/ai/services/recommendation.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';

export const generateContent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const result = await contentGeneratorService.generate(req.user.userId, req.body);
  ApiResponse.success(res, result, 'Content generated successfully');
});

export const optimizePrompt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const result = await promptOptimizerService.optimize(req.user.userId, req.body.prompt);
  ApiResponse.success(res, result, 'Prompt optimized successfully');
});

export const summarizeText = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const result = await summarizerService.summarize(
    req.user.userId,
    req.body.text,
    req.body.maxSentences
  );
  ApiResponse.success(res, result, 'Text summarized successfully');
});

export const generateTags = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const result = await tagsGeneratorService.generateTags(req.user.userId, req.body.content);
  ApiResponse.success(res, result, 'Tags generated successfully');
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const result = await recommendationService.recommendDocuments(req.user.userId, req.body.limit);
  ApiResponse.success(res, { recommendations: result }, 'Recommendations generated successfully');
});
