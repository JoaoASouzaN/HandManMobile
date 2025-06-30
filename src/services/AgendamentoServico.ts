import axios from "axios";
import { Agendamento, HistoricoAgendamento } from "../model/Agendamento";
import { API_URL } from "../constants/ApiUrl";

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingServices: Array<{
    id: string;
    data: Date;
    horario: Date;
    tipo: 'servico' | 'leilao';
    titulo?: string;
  }>;
  message?: string;
}

export const AgendamentoService = {
    async AgendarServico(agendamento:Agendamento){
        try{
            const response = await axios.post(`${API_URL}/servicos`,agendamento);
            return response.data;
        }catch(error:unknown){
            console.log(error);
        }
    },

    async getAgendamentos(id_usuario:string | undefined):Promise<HistoricoAgendamento[] | undefined>{
        try{
            const response = await axios.get(`${API_URL}/usuarios/historico/${id_usuario}`)
            return response.data;
        }catch(error){  
            console.log(error);
        }
    },

    async verificarConflitosHorario(
        fornecedorId: string,
        data: Date,
        horario: Date
    ): Promise<ConflictInfo> {
        try {
            const response = await axios.post(`${API_URL}/servicos/verificar-conflitos`, {
                fornecedorId,
                data: data.toISOString(),
                horario: horario.toISOString()
            });
            
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 409) {
                return error.response.data;
            }
            throw error;
        }
    },

    async criarAgendamento(agendamentoData: any) {
        try {
            const response = await axios.post(`${API_URL}/servicos`, agendamentoData);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 409) {
                throw new Error(error.response.data.error || 'Conflito de horário detectado!');
            }
            throw error;
        }
    }
}