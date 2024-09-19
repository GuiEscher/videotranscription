const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const app = express();
const port = 5000;
const cors = require("cors");

// Configurações do Express
app.use(cors()); // Permite solicitações de diferentes origens (CORS)
app.use(bodyParser.json()); // Faz o parse do corpo das requisições em JSON

// Configurar PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "vtdb",
  password: "admin",
  port: 5432,
});

// Função para verificar e atualizar a cota de vídeos do usuário
const checkAndUpdateQuota = async (uid) => {
  // Verifica o número de vídeos enviados pelo usuário
  const result = await pool.query(
    "SELECT videos_uploaded FROM usuarios WHERE uid = $1",
    [uid]
  );
  const user = result.rows[0];
  if (user) {
    // Verifica se o número de vídeos enviados hoje ultrapassa o limite
    if (user.videos_uploaded >= 3) {
      throw new Error("Limite diário de vídeos excedido");
    }

    // Atualiza o contador de vídeos
    await pool.query(
      "UPDATE usuarios SET videos_uploaded = videos_uploaded + 1 WHERE uid = $1",
      [uid]
    );
  } else {
    throw new Error("Usuário não encontrado");
  }
};

// Função para reiniciar o contador de vídeos a cada novo dia
const resetDailyQuota = async () => {
  const today = new Date().toISOString().split("T")[0]; // Data atual no formato YYYY-MM-DD

  await pool.query(
    "UPDATE usuarios SET videos_uploaded = 0 WHERE DATE(criado_em) <> $1",
    [today]
  );
};

// Rota para registrar o usuário
app.post("/api/register", async (req, res) => {
  const { uid, nome, email, senha } = req.body;
  const t_count = 3; // Usuário ainda tem 3 vídeos disponíveis
  try {
    // Insere o novo usuário na tabela 'usuarios'
    await pool.query(
      "INSERT INTO usuarios (uid, nome, email, senha) VALUES ($1, $2, $3, $4) ON CONFLICT (uid) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, senha = EXCLUDED.senha",
      [uid, nome, email, senha]
    );
    
    // Adiciona a cota inicial para o novo usuário
    await pool.query(
      "INSERT INTO transcriptions (uid, transcription) VALUES ($1, $2) ON CONFLICT (uid) DO UPDATE SET transcription = EXCLUDED.transcription",
      [uid, t_count]
    );
    
    res.status(201).send("Usuário registrado com sucesso");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao registrar usuário");
  }
});

// Rota para login com Google
app.post("/api/google-signin", async (req, res) => {
  const { uid, nome, email, foto } = req.body;
  const t_count = 3; // Define a cota inicial de vídeos para novos usuários

  try {
    // Insere ou atualiza o usuário na tabela 'usuarios'
    await pool.query(
      "INSERT INTO usuarios (uid, nome, email, foto) VALUES ($1, $2, $3, $4) ON CONFLICT (uid) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email, foto = EXCLUDED.foto",
      [uid, nome, email, foto || null]
    );

    // Insere a cota inicial na tabela 'transcriptions'
    await pool.query(
      "INSERT INTO transcriptions (uid, transcription) VALUES ($1, $2) ON CONFLICT (uid) DO UPDATE SET transcription = EXCLUDED.transcription",
      [uid, t_count]
    );

    res.status(200).json({ message: "Usuário autenticado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao autenticar usuário");
  }
});

// Endpoint para verificar o status da transcrição
app.get("/api/transcriptions/:transcriptionId", async (req, res) => {
  const { transcriptionId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM transcriptions WHERE transcription_id = $1",
      [transcriptionId]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Transcrição não encontrada." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar transcrição");
  }
});

// Inicializa o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
// Rota para visualizar e atualizar a cota diária
app.get("/api/transcriptions/daily/:uid/:decrement?", async (req, res) => {
  const { uid, decrement } = req.params;

  try {
    if (decrement === "true") {
      // Atualizar a cota de vídeos do usuário
      await pool.query(
        "UPDATE transcriptions SET transcription = transcription - 1 WHERE uid = $1",
        [uid]
      );
    }

    // Executa a consulta e pega o valor de 'transcription'
    const result = await pool.query(
      "SELECT transcription FROM transcriptions WHERE uid = $1",
      [uid]
    );

    if (result.rows.length > 0) {
      const videosLeft = result.rows[0].transcription; // Pega o valor correto do campo 'transcription'
      res.status(200).json({ videosLeft });
    } else {
      res.status(404).json({ error: "Usuário não encontrado" });
    }
  } catch (e) {
    console.error("Erro em visualização de cota diária:", e.message);
    res.status(500).json({ error: "Erro ao visualizar a cota diária" });
  }
});
// Verifica e reinicia a cota diária a cada 24 horas
setInterval(resetDailyQuota, 24 * 60 * 60 * 1000);
