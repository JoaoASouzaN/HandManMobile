import { useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { API_URL } from '../constants/ApiUrl';
import { HistoricoAgendamento } from '../model/Agendamento';

interface UseSocketConnectionProps {
    tokenId: string | undefined;
    agendamentoId: string;
    setHistorico?: React.Dispatch<React.SetStateAction<HistoricoAgendamento[] | null>>;
    onValorAtualizado?: (novoValor: number) => void;
}

export const useSocketConnection = ({
    tokenId,
    agendamentoId,
    setHistorico,
    onValorAtualizado
}: UseSocketConnectionProps) => {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!tokenId) return;

        // Inicializa o socket com configurações melhoradas
        const socket = io(API_URL, {
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            transports: ['websocket', 'polling'],
            forceNew: true
        });

        socketRef.current = socket;

        // Eventos de conexão do socket
        socket.on('connect', () => {
            console.log('Socket conectado com sucesso');
            socket.emit('join', tokenId);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket desconectado:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('Erro na conexão do socket:', error.message);
            console.error('Detalhes do erro:', error);
        });

        socket.on('error', (error) => {
            console.error('Erro geral do socket:', error);
        });

        // Escuta o evento de valor atualizado
        socket.on('valor_atualizado', (update) => {
            console.log('Recebido evento valor_atualizado:', update);
            if (update && update.id_servico === agendamentoId) {
                // Atualiza o histórico se disponível
                if (setHistorico) {
                    setHistorico(prevHistorico => {
                        if (!prevHistorico) return prevHistorico;
                        return prevHistorico.map(servico => {
                            if (servico.id_servico === update.id_servico) {
                                return {
                                    ...servico,
                                    valor: update.novo_valor,
                                    status: update.novo_status
                                };
                            }
                            return servico;
                        });
                    });
                }

                // Chama o callback de atualização de valor
                if (onValorAtualizado) {
                    onValorAtualizado(update.novo_valor);
                }
            }
        });

        // Escuta o evento de atualização de status
        socket.on('atualizacao_status', (update) => {
            console.log('Recebido evento atualizacao_status:', update);
            if (update && update.id_servico === agendamentoId && setHistorico) {
                setHistorico(prevHistorico => {
                    if (!prevHistorico) return prevHistorico;
                    return prevHistorico.map(servico => {
                        if (servico.id_servico === update.id_servico) {
                            return {
                                ...servico,
                                status: update.novo_status
                            };
                        }
                        return servico;
                    });
                });
            }
        });

        return () => {
            if (socketRef.current) {
                console.log('Desconectando socket...');
                socketRef.current.disconnect();
            }
        };
    }, [tokenId, agendamentoId, setHistorico, onValorAtualizado]);

    return {
        socket: socketRef.current
    };
}; 