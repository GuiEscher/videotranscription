import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../App.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../../config/firebaseConfig";
import { FaCog, FaSignOutAlt } from "react-icons/fa";

const MainPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [videosLeft, setVideosLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/auth");
      } else {
        setCurrentUser(user);
        fetchHistory(user.uid);
        fetchQuota(user.uid);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchHistory = async (uid) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/transcriptions/${uid}`
      );
      setHistory(response.data);
    } catch (error) {
      setError("Erro ao carregar o histórico de transcrições.");
    }
  };

  const fetchQuota = async (uid, decrement = false) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/transcriptions/daily/${uid}/${decrement}`
      );
      if (response.data && response.data.videosLeft !== undefined) {
        setVideosLeft(response.data.videosLeft);
      } else {
        console.error("Resposta inválida ao carregar a cota diária");
      }
    } catch (error) {
      console.error("Erro ao carregar a cota diária:", error);
      setError("Erro ao carregar a cota diária.");
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError("");

    if (selectedFile && videosLeft > 0) {
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        setUploading(true);
        setProgress(0);

        const response = await axios.post(
          "http://localhost:5001/api/transcribe",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const totalLength = progressEvent.lengthComputable
                ? progressEvent.total
                : selectedFile.size;
              const progressPercentage = Math.round(
                (progressEvent.loaded * 100) / totalLength
              );
              setProgress(progressPercentage);
            },
          }
        );

        setTranscription(
          response.data.transcription || "Transcrição não disponível"
        );
        await fetchQuota(auth.currentUser.uid, true); // Atualiza a cota após a transcrição
        await fetchHistory(auth.currentUser.uid); // Atualiza o histórico após a transcrição
      } catch (error) {
        setError(
          error.response?.data ||
            "Ocorreu um erro ao processar o arquivo. Tente novamente."
        );
      } finally {
        setUploading(false);
      }
    } else if (videosLeft <= 0) {
      setError("Você atingiu o limite diário de transcrições.");
    }
  };

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

    setError("");
    const selectedFile = e.dataTransfer.files[0];

    if (selectedFile && videosLeft > 0) {
      setFile(selectedFile);
      const formData = new FormData();
      formData.append("file", selectedFile);

      try {
        setUploading(true);
        setProgress(0);

        const response = await axios.post(
          "http://localhost:5001/api/transcribe",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const totalLength = progressEvent.lengthComputable
                ? progressEvent.total
                : selectedFile.size;
              const progressPercentage = Math.round(
                (progressEvent.loaded * 100) / totalLength
              );
              setProgress(progressPercentage);
            },
          }
        );

        setTranscription(
          response.data.transcription || "Transcrição não disponível"
        );
        await fetchQuota(auth.currentUser.uid, true); // Atualiza a cota após a transcrição
        await fetchHistory(auth.currentUser.uid); // Atualiza o histórico após a transcrição
      } catch (error) {
        setError(
          error.response?.data ||
            "Ocorreu um erro ao processar o arquivo. Tente novamente."
        );
      } finally {
        setUploading(false);
      }
    } else if (videosLeft <= 0) {
      setError("Você atingiu o limite diário de transcrições.");
    }
  };

  const downloadTranscription = (transcriptionText) => {
    const element = document.createElement("a");
    const file = new Blob([transcriptionText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "transcription.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  return (
    <div className="container-main">
      <h1>Transcrição de Vídeos</h1>

      <button onClick={toggleSidebar} className="config-button">
        <FaCog />
        Configurações
      </button>

      <button onClick={handleLogout} className="logout-button">
        <FaSignOutAlt />
        Sair
      </button>

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2>Configurações de Perfil</h2>
        <p>Opções de perfil aqui...</p>
        <button onClick={toggleSidebar} className="close-sidebar">
          Fechar
        </button>
      </div>

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
          className="file-input"
        />
        {uploading && <p>Upload em progresso: {progress}%</p>}
        {error && <p className="error-message">{error}</p>}
        {transcription && (
          <div className="transcription-results">
            <h2>Transcrição:</h2>
            <p>{transcription}</p>
            <button onClick={() => downloadTranscription(transcription)}>
              Baixar Transcrição
            </button>
          </div>
        )}
      </div>

      <div className="history-container">
        <h2>Histórico de Transcrições</h2>
        <ul>
          {history.map((item, index) => (
            <li key={index}>
              {item.date}: {item.transcription}
            </li>
          ))}
        </ul>
      </div>

      <div className="quota-container">
        <p>Vídeos restantes para transcrição: {videosLeft}</p>
      </div>
    </div>
  );
};

export default MainPage;
