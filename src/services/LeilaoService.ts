import { API_URL } from '../constants/ApiUrl';
import { Leilao, CriarLeilaoData, FazerLanceData } from '../types/leilao';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class LeilaoService {
  static async buscarLeiloes(): Promise<Leilao[]> {
    try {
      console.log('Tentando buscar leilões de:', `${API_URL}/leiloes`);
      const response = await fetch(`${API_URL}/leiloes`);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error('Erro ao buscar leilões');
      }
      
      const data = await response.json();
      console.log('Dados recebidos:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar leilões:', error);
      throw error;
    }
  }

  static async buscarLeilaoPorId(id: string): Promise<Leilao> {
    try {
      console.log('Tentando buscar leilão por ID:', id);
      const response = await fetch(`${API_URL}/leiloes/${id}`);
      if (!response.ok) {
        throw new Error('Leilão não encontrado');
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar leilão:', error);
      throw error;
    }
  }

  static async buscarMeusLeiloes(): Promise<Leilao[]> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      const response = await fetch(`${API_URL}/leiloes/meus`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar meus leilões');
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar meus leilões:', error);
      throw error;
    }
  }

  static async criarLeilao(dados: CriarLeilaoData): Promise<Leilao> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      const response = await fetch(`${API_URL}/leiloes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      if (!response.ok) {
        throw new Error('Erro ao criar leilão');
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar leilão:', error);
      throw error;
    }
  }

  static async fazerLance(idLeilao: string, dados: FazerLanceData): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      const response = await fetch(`${API_URL}/leiloes/${idLeilao}/lance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao fazer lance');
      }
    } catch (error) {
      console.error('Erro ao fazer lance:', error);
      throw error;
    }
  }
} 