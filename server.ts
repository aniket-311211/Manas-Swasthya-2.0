import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import health from './api/health';
import users from './api/users';
import assessments from './api/assessments/index';
import mood from './api/mood/index';
import journal from './api/journal/index';
import medicine from './api/medicine/index';
import chatRooms from './api/chat/rooms';
import chatMessages from './api/chat/messages';
import communityGroups from './api/community/groups';
import communityJoin from './api/community/join';
import events from './api/events/index';
import mentors from './api/mentors/index';
import aiChat from './api/ai/chat';
import aiAssessment from './api/ai/assessment';
import aiMedicine from './api/ai/medicine';
import aiAnalyze from './api/ai/analyze';
import aiAdvisory from './api/ai/advisory';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const wrap = (handler: Handler) => (req: express.Request, res: express.Response) => {
  const vreq = {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: { ...req.query },
  } as unknown as VercelRequest;
  return handler(vreq, res as unknown as VercelResponse);
};

app.all('/api/health', wrap(health));
app.all('/api/users', wrap(users));
app.all('/api/assessments', wrap(assessments));
app.all('/api/mood', wrap(mood));
app.all('/api/journal', wrap(journal));
app.all('/api/medicine', wrap(medicine));
app.all('/api/chat/rooms', wrap(chatRooms));
app.all('/api/chat/messages', wrap(chatMessages));
app.all('/api/community/groups', wrap(communityGroups));
app.all('/api/community/join', wrap(communityJoin));
app.all('/api/events', wrap(events));
app.all('/api/mentors', wrap(mentors));
app.all('/api/ai/chat', wrap(aiChat));
app.all('/api/ai/assessment', wrap(aiAssessment));
app.all('/api/ai/medicine', wrap(aiMedicine));
app.all('/api/ai/analyze', wrap(aiAnalyze));
app.all('/api/ai/advisory', wrap(aiAdvisory));

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`API dev server on http://localhost:${PORT}`);
});
