-- Tabela de usuários
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,         -- Chave primária autoincrementada para identificação única de cada usuário
    uid VARCHAR(255) UNIQUE NOT NULL,  -- UID único do usuário (do Firebase ou Google) para autenticação
    nome VARCHAR(255) NOT NULL,        -- Nome do usuário
    email VARCHAR(255) UNIQUE NOT NULL, -- Email único do usuário para contato e identificação
    senha VARCHAR(255),              -- Senha para usuários que não utilizam Google (pode ser NULL para Google)
    foto VARCHAR(500),               -- URL da foto de perfil do usuário (pode ser NULL)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data e hora de criação do registro
    videos_uploaded INT DEFAULT 0    -- Contador de vídeos enviados pelo usuário
);

-- Cria a tabela 'transcriptions' com a nova estrutura
CREATE TABLE transcriptions (
    id SERIAL PRIMARY KEY,          -- Chave primária autoincrementada para identificação única de cada transcrição
    uid VARCHAR(255),               -- UID do usuário que fez a transcrição
    transcription INTEGER,          -- Texto da transcrição (mantido como INTEGER conforme solicitado)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data e hora da criação da transcrição
    status VARCHAR(50) DEFAULT 'pending', -- Status da transcrição (novo campo)
    transcription_id VARCHAR(255) UNIQUE, -- ID único da transcrição (novo campo)
    FOREIGN KEY (uid) REFERENCES usuarios(uid) ON DELETE CASCADE
);

-- Adiciona restrição de unicidade ao campo 'uid' na tabela 'usuarios'
ALTER TABLE usuarios ADD CONSTRAINT unique_uid UNIQUE (uid);

-- Adiciona restrição de unicidade ao campo 'email' na tabela 'usuarios'
ALTER TABLE usuarios ADD CONSTRAINT unique_email UNIQUE (email);

-- Adiciona restrição de unicidade ao campo 'uid' na tabela 'transcriptions'
ALTER TABLE transcriptions ADD CONSTRAINT unique_uid_transcriptions UNIQUE (uid);
