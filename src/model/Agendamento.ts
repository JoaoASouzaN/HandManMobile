export interface Agendamento {
    id_usuario: string;
    id_fornecedor: string;
    categoria: string;
    data: string;
    horario: string;
    descricao: string;
    status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
    id_pagamento: string;
    id_avaliacao: string;
}

export type StatusType = 
    | "pendente" 
    | "confirmado"
    | "negociar valor" 
    | "cancelado" 
    | "concluido" 
    | "Em Andamento" 
    | "Aguardando pagamento" 
    | "Recusado"
    | "confirmar valor";

export interface FornecedorHistorico {
    nome: string;
    email: string;
    telefone: string;
    categoria_servico: string[];
    media_avaliacoes: number;
}

export type HistoricoAgendamento = {
    id_servico: string;
    id_fornecedor: string
    data: Date;
    horario: Date;
    data_submisao: Date;
    status: StatusType;
    descricao: string;
    valor:number;
    avaliado:boolean;
    fornecedor: {
        nome: string;
        email: string;
        telefone: string;
        imagemPerfil: string;
    } | null;
};

export interface Solicitacao {
    servico: {
        id_servico: string;
        categoria: string;
        data: Date;
        horario: Date;
        data_submisao: Date
        status: string;
        descricao: string;
        id_pagamento?: string;
        id_avaliacao?: string;
    };
    usuario: {
        id_usuario: string;
        nome: string;
        email: string;
        telefone: string;
        picture: string;
    } | null;
}

interface FornecedorIlustrar {
    imagemPerfil:string;
    nome: string;
    email: string;
    telefone: string;
    categoria_servico: string[];
    media_avaliacoes: number;
}

export interface ServicoIlustrar {
    id_servico: string;
    id_fornecedor: string;
    id_usuario: string;
    categoria: string;
    data: Date;
    horario: Date;
    status: string;
    descricao: string;
    valor: number;
    fornecedor: FornecedorIlustrar;
}

export interface ServicoComUsuario {
    id_servico: string;
    id_fornecedor: string;
    id_usuario: string;
    imagems: string[];
    data_submisao: Date;
    categoria: string;
    data: Date;
    horario: Date;
    status: string;
    id_pagamento?: string;
    id_avaliacao?: string;
    descricao: string;
    valor: number;
    usuario: {
        imagemPerfil: string;
        nome: string;
        email: string;
        telefone: string;
        endereco:typeEndereco
    } | null;
} 

export type typeEndereco = {
    rua: string;
    cidade: string;
    estado: string;
    cep: string;
    numero:string;
    tipoMoradia:string;
}

