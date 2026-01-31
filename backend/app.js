import express from 'express';
import morgan from 'morgan';
import connection from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';

await connection();

const app = express();

// ✅ Proper CORS config
app.use(cors({
  origin: "https://ai-chatcombo-20.onrender.com",   // frontend URL
  credentials: true                  // allow cookies / auth headers
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;
