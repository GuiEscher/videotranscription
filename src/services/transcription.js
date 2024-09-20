const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { Pool } = require("pg");
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "vtdb",
  password: "admin",
  port: 5432,
});

// Cria um diretório temporário se não existir
const tempDir = path.join(__dirname, 'temp');
fsPromises.mkdir(tempDir, { recursive: true }).catch(err => console.error('Erro ao criar diretório:', err));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tabela temporária em memória para armazenar status das transcrições
const transcriptionStatus = {};

app.post('/api/transcribe', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }

  // Verifique se o `uid` foi enviado
  if (!req.body.uid) {
    return res.status(400).send('UID não fornecido.');
  }

  const file = req.files.file;
  const filePath = path.join(tempDir, file.name);
  const transcriptionId = uuidv4(); // Gerar um ID único para a transcrição

  try {
    await file.mv(filePath);

    // Registra o status inicial da transcrição na tabela do banco de dados
    await pool.query(
      "INSERT INTO transcriptions (transcription_id, uid, status) VALUES ($1, $2, $3)",
      [transcriptionId, req.body.uid, 'pending']
    );

    // Processa a transcrição em segundo plano
    processTranscription(filePath, transcriptionId);

    res.json({ transcriptionId }); // Retorna o ID da transcrição
  } catch (err) {
    console.error('Erro ao salvar o arquivo:', err);
    res.status(500).send('Erro ao salvar o arquivo.');
  }
});



async function processTranscription(filePath, transcriptionId) {
  try {
    const readStream = fs.createReadStream(filePath);

    const response = await openai.audio.transcriptions.create({
      file: readStream,
      model: 'whisper-1',
      response_format: 'text',
    });

    const transcriptionText = response || 'Transcrição não disponível';

    // Atualiza o status da transcrição no banco de dados
    await pool.query(
      "UPDATE transcriptions SET transcription_text = $1, status = 'done' WHERE transcription_id = $2",
      [transcriptionText, transcriptionId]
    );

    // Atualiza o status em memória
    transcriptionStatus[transcriptionId] = {
      status: 'done',
      transcription: transcriptionText,
    };
  } catch (error) {
    console.error('Erro na transcrição:', error);

    // Atualiza o status da transcrição em caso de erro no banco de dados
    await pool.query(
      "UPDATE transcriptions SET status = 'failed' WHERE transcription_id = $1",
      [transcriptionId]
    );

    // Atualiza o status em memória
    transcriptionStatus[transcriptionId] = {
      status: 'failed',
      transcription: 'Erro ao processar transcrição.',
    };
  } finally {
    // Remove o arquivo após processar
    try {
      await fsPromises.unlink(filePath);
    } catch (err) {
      console.error('Erro ao remover arquivo:', err);
    }
  }
}



// Endpoint para checar o status da transcrição
app.get('/api/transcriptions/:transcriptionId', (req, res) => {
  const { transcriptionId } = req.params;
  const status = transcriptionStatus[transcriptionId];

  if (status) {
    res.json(status);
  } else {
    res.status(404).json({ error: 'Transcrição não encontrada.' });
  }
});

// Inicializa o servidor
const port = 5001;
app.listen(port, () => {
  console.log(`Servidor de transcrição rodando na porta ${port}`);
});