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

const admin = require('firebase-admin'); // Importa o SDK Firebase Admin
const serviceAccount = require('../../config/videotranscription-e2f65-firebase-adminsdk-55kaj-ca08378f9d.json'); // Carrega o arquivo JSON com as credenciais do service account

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount), // Inicializa o Firebase Admin com a credencial do service account
});


// Configuração da conexão com o banco de dados PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "vtdb",
  password: "admin",
  port: 5432,
});

// Cria um diretório temporário para armazenar arquivos de transcrição
const tempDir = path.join(__dirname, 'temp');
fsPromises.mkdir(tempDir, { recursive: true }).catch(err => console.error('Erro ao criar diretório:', err));

// Instancia a OpenAI com a chave de API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tabela temporária em memória para armazenar status das transcrições
const transcriptionStatus = {};

// Endpoint para transcrever arquivos de áudio
app.post('/api/transcribe', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // O token será enviado no cabeçalho 'Authorization'

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso não fornecido.' });
  }

  try {
    // Verifica o token de acesso usando o Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid; // UID do usuário autenticado

    // Continuar com o processo de upload e transcrição
    const file = req.files.file;
    if (!file) {
      return res.status(400).send('Nenhum arquivo foi enviado.');
    }

    const filePath = path.join(tempDir, file.name);
    const transcriptionId = uuidv4();

    await file.mv(filePath);
    await pool.query(
      "INSERT INTO transcriptions (transcription_id, uid, status) VALUES ($1, $2, $3)",
      [transcriptionId, uid, 'pending']
    );

    processTranscription(filePath, transcriptionId);
    res.json({ transcriptionId });
  } catch (error) {
    console.error('Erro de autenticação:', error);
    return res.status(403).json({ error: 'Token inválido.' });
  }
});


// Função para processar a transcrição de forma assíncrona
async function processTranscription(filePath, transcriptionId) {
  try {
    const readStream = fs.createReadStream(filePath); // Cria um stream de leitura do arquivo

    // Faz a chamada à API da OpenAI para transcrição
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
  const { transcriptionId } = req.params; // Obtém o ID da transcrição da URL
  const status = transcriptionStatus[transcriptionId]; // Busca o status na tabela temporária

  if (status) {
    res.json(status); // Retorna o status da transcrição
  } else {
    res.status(404).json({ error: 'Transcrição não encontrada.' });
  }
});

// Inicializa o servidor
const port = 5001;
app.listen(port, () => {
  console.log(`Servidor de transcrição rodando na porta ${port}`);
});

