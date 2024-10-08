-- Tabela de usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,         -- Chave primária autoincrementada para identificação única de cada usuário
    uid VARCHAR(255) UNIQUE NOT NULL,  -- UID único do usuário (do Firebase ou Google) para autenticação
    nome VARCHAR(255) NOT NULL,        -- Nome do usuário
    email VARCHAR(255) UNIQUE NOT NULL, -- Email único do usuário para contato e identificação
    senha VARCHAR(255),              -- Senha para usuários que não utilizam Google (pode ser NULL para Google)
    foto VARCHAR(500),               -- URL da foto de perfil do usuário (pode ser NULL)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data e hora de criação do registro
);

-- Tabela para rastrear cada transcrição
CREATE TABLE transcriptions (
    id SERIAL PRIMARY KEY,          -- Chave primária autoincrementada para identificação única de cada transcrição
    uid VARCHAR(255),               -- UID do usuário que fez a transcrição
    transcription INTEGER,             -- Texto da transcrição
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data e hora da criação da transcrição
    FOREIGN KEY (uid) REFERENCES usuarios(uid) ON DELETE CASCADE,
    transcription_text TEXT,
    transcription_id VARCHAR(255)
);

ALTER TABLE transcriptions
ADD CONSTRAINT check_transcription_non_negative CHECK (transcription >= 0);
-- Adiciona a coluna 'transcription_text' para armazenar o texto da transcrição
ALTER TABLE transcriptions
ADD COLUMN transcription_text TEXT;

-- Verifica e corrige a estrutura da tabela se necessário
ALTER TABLE transcriptions
ALTER COLUMN transcription_id SET DATA TYPE VARCHAR(255);

ALTER TABLE transcriptions DROP CONSTRAINT unique_uid_transcriptions;
ALTER TABLE transcriptions
ADD CONSTRAINT unique_transcription_id UNIQUE (transcription_id);
