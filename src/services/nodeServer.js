// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const app = express();
const port = 5000;
const cors = require('cors');
app.use(cors()); 

app.use(bodyParser.json());

// Configurar PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vtdb',
  password: 'admin',
  port: 5432,
});

// Rota para registrar o usuário no PostgreSQL
app.post('/api/register', async (req, res) => {
    const { uid, nome, email, senha } = req.body;
  
    try {
      await pool.query('INSERT INTO usuarios (uid, nome, email, senha) VALUES ($1, $2, $3, $4)', [uid, nome, email, senha]);
      res.status(201).send('Usuário registrado com sucesso');
    } catch (err) {
      console.error(err);
      res.status(500).send('Erro ao registrar usuário');
    }
  });
  

// Rota para login com Google (salva informações do Google no PostgreSQL)
app.post('/api/google-signin', async (req, res) => {
    const { uid, nome, email, foto } = req.body;
  
    try {
      await pool.query('INSERT INTO usuarios (uid, nome, email, foto) VALUES ($1, $2, $3, $4)', [uid, nome, email, foto || null]);
      res.status(201).send('Usuário Google registrado com sucesso');
    } catch (err) {
      console.error(err);
      res.status(500).send('Erro ao registrar usuário do Google');
    }
  });
  

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
