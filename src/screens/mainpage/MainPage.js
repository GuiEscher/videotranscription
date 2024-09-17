import React, { useState, useEffect} from 'react';
import Modal from 'react-modal'; 
import axios from 'axios';
import '../../App.css';
import { useNavigate, navigation } from 'react-router-dom';  // Importar useNavigate
import { auth } from '../../config/firebaseConfig'; 
Modal.setAppElement('#root');

const MainPage = () => {
  const currentUser = auth.currentUser;
  const navigate = useNavigate();  // Usar useNavigate
  useEffect(() => {
    // se o usuário nao estiver logado, currentUser = null
    console.log("Usuário atual: " + JSON.stringify(currentUser));
    if(!currentUser){
      navigate('/auth');
    }
  }, []);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(''); // Estado para mensagens de erro

  // Abre e fecha o modal
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  // Função para enviar o arquivo para o servidor
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(''); // Limpa a mensagem de erro ao selecionar um novo arquivo
    
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        setUploading(true);
        const response = await axios.post('http://localhost:5001/api/transcribe', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('Resposta da transcrição:', response.data); // Adiciona log para verificar a resposta
        setTranscription(JSON.stringify(response.data) || 'Transcrição não disponível');
      } catch (error) {
        console.error('Erro ao enviar o vídeo:', error);
        setError('Ocorreu um erro ao processar o arquivo. Tente novamente.');
      } finally {
        setUploading(false);
      }
    }
  };

  // Funções de drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError(''); // Limpa a mensagem de erro ao fazer o drop de um arquivo

    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        setUploading(true);
        const response = await axios.post('http://localhost:5001/api/transcribe', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('Resposta da transcrição:', response.data); // Adiciona log para verificar a resposta
        setTranscription(response.data.transcription || 'Transcrição não disponível');
      } catch (error) {
        console.error('Erro ao enviar o vídeo:', error);
        setError('Ocorreu um erro ao processar o arquivo. Tente novamente.');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="container-main">
      <h1>Transcrição de Vídeos</h1>

      {/* Botão de Configurações */}
      <button onClick={openModal} className="config-button">
        Configurações
      </button>

      {/* Modal de Perfil */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Configurações de Perfil"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2>Configurações de Perfil</h2>
        <p>Opções de perfil aqui...</p>
        <button onClick={closeModal}>Fechar</button>
      </Modal>

      {/* Campo para arrastar ou selecionar vídeo */}
      <div
        className="upload-container"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="upload-input"
        />
        <p>Arraste e solte um vídeo aqui, ou clique para selecionar</p>
        {uploading && <p>Carregando vídeo...</p>}
        {error && <p className="error-message">{error}</p>} {/* Exibe a mensagem de erro */}
        {transcription && (
          <div className="transcription-result">
            <h3>Transcrição:</h3>
            <p>{transcription}</p>
            <button onClick={() => downloadTranscription(transcription)}>Baixar Transcrição</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Função para download da transcrição
const downloadTranscription = (transcriptionText) => {
  const element = document.createElement("a");
  const file = new Blob([transcriptionText], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = "transcription.txt";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element); // Remove o elemento após o clique
};

export default MainPage;
