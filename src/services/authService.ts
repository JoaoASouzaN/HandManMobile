import axios from 'axios';
import dbPromise from '../../db';
import { checkInternetConnection, handleApiError } from '../utils/networkUtils';
import { API_URL } from '../constants/ApiUrl';
import { User } from '../model/User';
import { typeFornecedor } from '../model/Fornecedor';

interface LoginSuccess {
    success: true;
    data: {
        token: string;
    };
}

interface LoginError {
    success: false;
    message: string;
}

export type LoginResponse = LoginSuccess | LoginError;

export const authService = {
    async login(email: string, senha: string): Promise<LoginResponse> {
        try {
            console.log('=== DEBUG LOGIN ===');
            console.log('Email:', email);
            console.log('Senha:', senha);
            console.log('URL da API:', `${API_URL}/usuarios/login`);
            console.log('Tentando login em:', `${API_URL}/usuarios/login`);
            
            const loginData = {
                email: email.trim(),
                senha: senha.trim()
            };

            console.log('Dados do login:', loginData);

            const response = await axios.post(`${API_URL}/usuarios/login`, loginData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 segundos de timeout
            });

            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            if (response.data && response.data.token) {
                console.log('Login bem-sucedido! Token recebido.');
                return {
                    success: true,
                    data: {
                        token: response.data.token
                    },
                };
            }
            
            console.log('Token não encontrado na resposta');
            throw new Error('Token não recebido da API');
        } catch (error: any) {
            console.error('=== ERRO NO LOGIN ===');
            console.error('Erro completo:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    message: 'Timeout na conexão. Verifique sua internet.'
                };
            }
            
            if (error.code === 'ERR_NETWORK') {
                return {
                    success: false,
                    message: 'Erro de conexão. Verifique se o servidor está rodando.'
                };
            }
            
            return handleApiError(error) as LoginError;
        }
    },

    async loginFornecedor(email: string, senha: string): Promise<LoginResponse> {
        try {
            console.log('Tentando login de fornecedor em:', `${API_URL}/fornecedor/login`);
            const loginData = {
                email: email.trim(),
                senha: senha.trim()
            };

            const response = await axios.post(`${API_URL}/fornecedor/login`, loginData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            if (response.data && response.data.token) {
                return {
                    success: true,
                    data: {
                        token: response.data.token
                    },
                };
            }
            
            throw new Error('Token não recebido da API');
        } catch (error: any) {
            console.error('Erro no login do fornecedor:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error message:', error.message);
            
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    message: 'Timeout na conexão. Verifique sua internet.'
                };
            }
            
            if (error.code === 'ERR_NETWORK') {
                return {
                    success: false,
                    message: 'Erro de conexão. Verifique se o servidor está rodando.'
                };
            }
            
            return handleApiError(error) as LoginError;
        }
    },

    async cadastro(usuario: User): Promise<LoginResponse> {
        try {
            const response = await axios.post(`${API_URL}/usuarios`, usuario);
            
            if (response.data) {
                return {
                    success: true,
                    data: {
                        token: response.data.token
                    }
                };
            }
            
            throw new Error('Dados não recebidos da API');
        } catch (error: any) {
            console.error('Erro no cadastro:', error.response?.data || error.message);
            return handleApiError(error) as LoginError;
        }
    },
    async cadastrarFornecedor(usuario:Partial<typeFornecedor>){
        try{
            const response = await axios.post(`${API_URL}/fornecedor`,usuario)
            if (response.data) {
                return {
                    success: true,
                    data: {
                        token: response.data.token
                    }
                };
            }
            
            throw new Error('Dados não recebidos da API');
        }catch (error: any) {
            console.error('Erro no cadastro:', error.response?.data || error.message);
            return handleApiError(error) as LoginError;
        }
    }
}; 