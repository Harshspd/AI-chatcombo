
import express from 'express';
import morgan from 'morgan';
import connection from './db/db.js';
import userRoutes from './routes/user.routes.js';


await connection();



const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/users', userRoutes);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;