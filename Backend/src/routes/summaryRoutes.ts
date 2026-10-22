import { Router, Request, Response } from 'express';
import { getSummary } from '../services/summaryService';

const router = Router();

router.get('/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;

  if (!user_id) {
    res.status(400).json({ error: 'user_id is required' });
    return;
  }

  try {
    const summary = await getSummary(user_id);
    res.status(200).json(summary);
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
