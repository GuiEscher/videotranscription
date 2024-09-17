const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(fileUpload());

// Cria um diretório temporário se não existir
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/transcribe', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }

  const file = req.files.file;
  const filePath = path.join(tempDir, file.name);

  file.mv(filePath, async (err) => {
    if (err) {
      console.error('Erro ao salvar o arquivo:', err);
      return res.status(500).send('Erro ao salvar o arquivo.');
    }

    try {
      // Verificar o arquivo
      console.log('Arquivo salvo em:', filePath);

      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        response_format: 'text',
      });

      // Verifique toda a resposta da API
      console.log('Resposta completa da API:', response);

      // Envie a transcrição diretamente como texto
      const transcriptionText = response || 'Transcrição não disponível'; 
      res.json({ transcription: transcriptionText });
    } catch (error) {
      console.error('Erro na transcrição:', error);
      res.status(500).send('Erro ao processar transcrição.');
    } finally {
      // Remove o arquivo após processar
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });
});

app.listen(5001, () => {
  console.log('Servidor rodando na porta 5001');
});
