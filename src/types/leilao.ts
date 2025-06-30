export interface Lance {
  id?: string;
  usuarioId: string;
  valor: number;
  data: string;
  nomeUsuario?: string;
}

export interface Leilao {
  id: string;
  titulo: string;
  descricao: string;
  valorDesejado: number;
  detalhes: string;
  prazoLimite: string;
  categoria: string;
  imagem?: string;
  imagemCapa?: string;
  id_usuario?: string;
  status?: string;
  valor_atual?: number;
  total_lances?: number;
  lances: Lance[];
  tempoFinalizacao?: string;
  data_final?: string;
  data_limite?: string;
}

export interface CriarLeilaoData {
  titulo: string;
  descricao: string;
  valorDesejado: number;
  detalhes: string;
  prazoLimite: string;
  categoria: string;
  imagem?: string;
}

export interface FazerLanceData {
  valor: number;
} 