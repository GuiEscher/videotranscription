import React, { useEffect, useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import axios from 'axios';
import { auth } from '../../config/firebaseConfig';
import '../../App.css';
import { useNavigate } from 'react-router-dom'; // Corrigir importação do useNavigate
import EntradaTexto from '../../components/EntradaTexto';
const AuthScreen = () => {
  const [isRegistering, setIsRegistering] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [authError, setAuthError] = useState(null);
  
  const navigate = useNavigate(); // Usar useNavigate

  useEffect(() => {
    // Listener para mudanças de autenticação
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/main');
      }
    });
    console.log(JSON.stringify(auth.currentUser));
    return () => unsubscribe(); // Limpar o listener na desmontagem do componente
  }, [navigate]);

  const googleProvider = new GoogleAuthProvider();

  const handleAuthAction = async () => {
    try {
      if (isRegistering) {
        if (password.length < 6) {
          setAuthError('A senha deve conter pelo menos 6 caracteres.');
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);

        console.log('Enviando dados para o backend:', {
          uid: user.uid,
          nome: nome,
          email: user.email,
          senha: password
        });

        await axios.post('http://localhost:5000/api/register', {
          uid: user.uid,
          nome: nome,
          email: user.email,
          senha: password
        });

        setAuthError(null); // Limpa erros
        navigate('/main');  // Navega para a página principal após o registro
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Usuário logado com sucesso.');
        setAuthError(null); // Limpa erros
        navigate('/main');  // Navega para a página principal após o login
      }
    } catch (error) {
      console.error(error.message);
      setAuthError('Erro ao autenticar. Por favor, tente novamente.'); // Atualiza o estado com erro
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Envia informações do usuário Google para PostgreSQL
      await axios.post('http://localhost:5000/api/google-signin', {
        uid: user.uid,
        nome: user.displayName,
        email: user.email,
        foto: user.photoURL
      });

      setAuthError(null); // Limpa erros
      navigate('/main');  // Navega para a página principal após o login com Google
    } catch (error) {
      console.error(error.message);
      setAuthError('Erro ao autenticar com Google. Por favor, tente novamente.'); // Atualiza o estado com erro
    }
  };

  return (
    <div className="auth-container">
    <h2>{isRegistering ? 'Registrar' : 'Login'}</h2>
    {authError && <p className="error-message">{authError}</p>}
    {isRegistering && (
      <EntradaTexto
        label="Nome"
        value={nome}
        onChange={(value) => setNome(value)}
      />
    )}
    <EntradaTexto
      label="Email"
      type="email"
      value={email}
      onChange={(value) => setEmail(value)}
    />
    <EntradaTexto
      label="Senha"
      secureTextEntry={true}
      value={password}
      onChange={(value) => setPassword(value)}
    />
    <button onClick={handleAuthAction}>{isRegistering ? 'Registrar' : 'Login'}</button>
    <button onClick={() => setIsRegistering(!isRegistering)}>
      {isRegistering ? 'Já tem uma conta? Faça login' : 'Criar nova conta'}
    </button>
  </div>
);
};

export default AuthScreen;
