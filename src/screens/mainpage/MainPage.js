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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [videosLeft, setVideosLeft] = useState(0);
  const [transcriptions, setTranscriptions] = useState([]); // Para armazenar as transcrições e seus status
  const [transcriptionsStatus, setTranscriptionsStatus] = useState("");
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
      console.log("Histórico carregado:", response.data);
      setHistory(response.data);
    } catch (error) {
      console.error("Erro ao carregar o histórico de transcrições:", error);
      //setError("Erro ao carregar o histórico de transcrições.");
    }
  };

  const fetchQuota = async (uid, decrement = false) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/transcriptions/daily/${uid}/${decrement}`
      );
      console.log("Cota diária carregada:", response.data);
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
      formData.append("uid", currentUser.uid); // Adiciona o UID do usuário no FormData
      formData.append("transcriptions", 3);
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
              console.log("Upload Progress:", progressPercentage);
            },
          }
        );
  
        console.log("Resposta do upload:", response.data);
        const transcriptionId = response.data.transcriptionId;
        setTranscriptions((prev) => [
          ...prev,
          { id: transcriptionId, status: "pending", transcription: "" }
        ]);
        await checkTranscriptionStatus(transcriptionId);
        await fetchQuota(auth.currentUser.uid, true); // Atualiza a cota após a transcrição
        await fetchHistory(auth.currentUser.uid); // Atualiza o histórico após a transcrição
      } catch (error) {
        console.error("Erro ao processar o upload do arquivo:", error);
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
  

  const checkTranscriptionStatus = async (transcriptionId) => {
    try {
      console.log("Iniciando verificação do status da transcrição:", transcriptionId);
      let response;
      do {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Aguarda 3 segundos
        response = await axios.get(
          `http://localhost:5001/api/transcriptions/${transcriptionId}`
        );
        console.log("Status da transcrição:", response.data);
        setTranscriptions((prev) =>
          prev.map((transcription) =>
            transcription.id === transcriptionId
              ? { ...transcription, ...response.data }
              : transcription
          )
        );
      } while (response.data.status !== "done" && response.data.status !== "failed");

      setTranscriptions((prev) =>
        prev.map((transcription) =>
          transcription.id === transcriptionId
            ? { ...transcription, ...response.data }
            : transcription
        )
      );
    } catch (error) {
      console.error("Erro ao verificar o status da transcrição:", error);
      setError("Erro ao verificar o status da transcrição.");
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
      formData.append('uid', auth.currentUser.uid);

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
              console.log("Upload Progress (Drag & Drop):", progressPercentage);
            },
          }
        );

        console.log("Resposta do upload (Drag & Drop):", response.data);
        const transcriptionId = response.data.transcriptionId;
        setTranscriptions((prev) => [
          ...prev,
          { id: transcriptionId, status: "pending", transcription: "" }
        ]);
        await checkTranscriptionStatus(transcriptionId);
        await fetchQuota(auth.currentUser.uid, true); // Atualiza a cota após a transcrição
        await fetchHistory(auth.currentUser.uid); // Atualiza o histórico após a transcrição
      } catch (error) {
        console.error("Erro ao processar o upload do arquivo (Drag & Drop):", error);
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
          disabled={uploading}
        />
        <p>Arraste e solte o vídeo aqui ou selecione um arquivo para enviar.</p>
        {uploading && <progress value={progress} max={100} />}
        {error && <p className="error-message">{error}</p>}
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome do Arquivo</th>
            <th>Status</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {transcriptions.map((transcription) => (
            <tr key={transcription.id}>
              <td>{transcription.id}</td>
              <td>{transcription.fileName || "Desconhecido"}</td>
              <td>{transcription.status}</td>
              <td>
                {transcription.status === "done" && (
                  <button
                    onClick={() => downloadTranscription(transcription.transcription)}
                  >
                    Baixar Transcrição
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="quota-info">
        <h2>Cota Diária Restante</h2>
        <p>{videosLeft} vídeos restantes</p>
      </div>
    </div>
  );
};



export default MainPage;




// const fetchTranscriptionStatus = async (transcriptionId) => {
//   try {
//     const response = await axios.get(`http://localhost:5001/api/transcriptions/${transcriptionId}`);
//     const transcription = response.data;
//     setTranscriptions((prevTranscriptions) =>
//       prevTranscriptions.map((t) =>
//         t.transcriptionId === transcriptionId ? transcription : t
//       )
//     );
//   } catch (error) {
//     console.error("Erro ao buscar o status da transcrição:", error);
//   }
// };

// useEffect(() => {
//   const interval = setInterval(() => {
//     history.forEach((transcription) => {
//       if (transcription.status === 'pending') {
//         fetchTranscriptionStatus(transcription.transcription_id);
//       }
//     });
//   }, 5000); // Verifica a cada 5 segundos

//   return () => clearInterval(interval);
// }, [history]);
