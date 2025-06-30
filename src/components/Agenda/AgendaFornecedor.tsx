import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useGetToken } from '../../hooks/useGetToken';
import { useStatusNotifications } from '../../hooks/useStatusNotifications';
import { useNotifications } from '../../hooks/useNotifications';
import axios from 'axios';
import { API_URL } from '../../constants/ApiUrl';
import { CardAgendamentoFornecedor } from './CardAgendamentoFornecedor';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList } from '../../navigation/TabNavigation';
import { FornecedorStackParamList } from '../../navigation/FornecedorStackNavigation';
import { io, Socket } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { Solicitacao, StatusType } from '../../model/Agendamento';
import { getStatusColor, getStatusBackground, getStatusLabel } from '../../utils/statusConfig';
import { Loading } from '../Loading';

type NavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList>,
    NativeStackNavigationProp<FornecedorStackParamList>
>;

export const AgendaFornecedor = () => {
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroAtivo, setFiltroAtivo] = useState<StatusType | 'todos'>('todos');
    const [filtroUrgencia, setFiltroUrgencia] = useState<'todos' | 'urgente' | 'proximo' | 'futuro'>('todos');
    const [showFiltros, setShowFiltros] = useState(false);
    const navigation = useNavigation<NavigationProp>();
    const token = useGetToken();
    const socketRef = useRef<Socket | null>(null);

    const { expoPushToken } = useNotifications(token?.id);

    console.log(expoPushToken);

    const handleStatusUpdate = async (update: { id_servico: string; novo_status: string }) => {
        setSolicitacoes(prevSolicitacoes =>
            prevSolicitacoes && Array.isArray(prevSolicitacoes)
                ? prevSolicitacoes.map(solicitacao =>
                    solicitacao.servico.id_servico === update.id_servico
                        ? {
                            ...solicitacao,
                            servico: {
                                ...solicitacao.servico,
                                status: update.novo_status
                            }
                        }
                        : solicitacao
                )
                : []
        );

        try {
            // Enviar notificação push
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Status do serviço foi atualizado",
                    body: `O status do serviço foi atualizado para: ${update.novo_status}`,
                    data: { update },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null, // Enviar imediatamente
            });
            console.log('Notificação enviada com sucesso');
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    };

    const { emitirMudancaStatus } = useStatusNotifications(handleStatusUpdate);

    // Função para calcular a urgência de um serviço
    const calcularUrgencia = (dataServico: Date): 'urgente' | 'proximo' | 'futuro' => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        
        const proximaSemana = new Date(hoje);
        proximaSemana.setDate(hoje.getDate() + 7);
        
        if (dataServico <= amanha) return 'urgente';
        if (dataServico <= proximaSemana) return 'proximo';
        return 'futuro';
    };

    // Função para calcular dias restantes
    const calcularDiasRestantes = (dataServico: Date): number => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataServicoLimpa = new Date(dataServico);
        dataServicoLimpa.setHours(0, 0, 0, 0);
        
        const diffTime = dataServicoLimpa.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    };

    const atualizarStatusServico = async (id_servico: string, novo_status: StatusType) => {
        try {
            await axios.put(`${API_URL}/servicos`, {
                id_servico,
                status: novo_status
            });

            emitirMudancaStatus(id_servico, novo_status, token?.id as string);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            
            Alert.alert(
                "Erro",
                "Não foi possível atualizar o status do serviço. Tente novamente.",
                [{ text: "OK" }]
            );
        }
    };

    const handleEntrarEmContato = (idUsuario: string) => {
        console.log(idUsuario)
        navigation.navigate('FornecedorStack', {
            screen: 'ChatScreen',
            params: { fornecedorId: idUsuario }
        });
    };

    const fetchSolicitacoes = async () => {
        setLoading(true);
        try {
            if (!token || !token.id) {
                console.log("Token não disponível ainda");
                return;
            }

            const response = await axios.get(`${API_URL}/fornecedor/${token.id}/solicitacoes`);
            
            setSolicitacoes(response.data);
        } catch (error) {
            console.error("Erro ao buscar solicitações:", error);
            Alert.alert(
                "Erro",
                "Não foi possível carregar as solicitações. Tente novamente.",
                [{ text: "OK" }]
            );
        } finally {
            setLoading(false);
        }
    };

    // Configuração do Socket.IO
    useEffect(() => {
        if (!token?.id) return;

        console.log('Iniciando conexão socket para fornecedor:', token.id);

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

        socket.on('connect', () => {
            console.log('Socket conectado com sucesso');
            socket.emit('join', token.id);
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

        socket.on('novo_agendamento', async (novoAgendamento) => {
            console.log('Novo agendamento recebido:', novoAgendamento);
            await fetchSolicitacoes();

            try {
                // Enviar notificação push
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "Nova Solicitação",
                        body: "Você recebeu uma nova solicitação de serviço!",
                        data: { novoAgendamento },
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: null, // Enviar imediatamente
                });
                console.log('Notificação enviada com sucesso');
            } catch (error) {
                console.error('Erro ao enviar notificação:', error);
            }
        });

        return () => {
            console.log('Desconectando socket');
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [token]);

    // Efeito para carregar solicitações iniciais
    useEffect(() => {
        fetchSolicitacoes();
    }, [token]);

    const statusDisponiveis: (StatusType | 'todos')[] = [
        'todos',
        'pendente',
        'confirmado',
        'Em Andamento',
        'Aguardando pagamento',
        'concluido',
        'cancelado',
        'Recusado'
    ];

    const solicitacoesFiltradas = solicitacoes.filter(sol => {
        // Filtro por status
        if (filtroAtivo !== 'todos' && sol.servico.status !== filtroAtivo) {
            return false;
        }

        // Filtro por urgência
        if (filtroUrgencia !== 'todos') {
            const dataServico = new Date(sol.servico.data);
            const urgencia = calcularUrgencia(dataServico);
            if (urgencia !== filtroUrgencia) {
                return false;
            }
        }

        return true;
    });

    // Ordenação por urgência (prazo mais apertado primeiro)
    const solicitacoesOrdenadas = [...solicitacoesFiltradas].sort((a, b) => {
        const dataA = new Date(a.servico.data);
        const dataB = new Date(b.servico.data);
        
        // Primeiro ordena por data (mais próximo primeiro)
        const diffA = calcularDiasRestantes(dataA);
        const diffB = calcularDiasRestantes(dataB);
        
        if (diffA !== diffB) {
            return diffA - diffB; // Menor diferença primeiro
        }
        
        // Se a data for igual, ordena por status (pendente primeiro)
        const prioridadeStatus: Record<string, number> = {
            'pendente': 1,
            'confirmar valor': 2,
            'confirmado': 3,
            'em andamento': 4,
            'aguardando pagamento': 5,
            'concluido': 6,
            'cancelado': 7
        };
        
        const prioridadeA = prioridadeStatus[a.servico.status.toLowerCase()] || 8;
        const prioridadeB = prioridadeStatus[b.servico.status.toLowerCase()] || 8;
        
        return prioridadeA - prioridadeB;
    });

    if (loading) {
        return (
            <Loading/>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Solicitações de Serviço</Text>
                    <TouchableOpacity 
                        style={styles.filtroToggle}
                        onPress={() => setShowFiltros(!showFiltros)}
                    >
                        <Text style={styles.filtroToggleText}>
                            {showFiltros ? 'Ocultar' : 'Filtros'}
                        </Text>
                    </TouchableOpacity>
                </View>
                
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtroContainer}
                    contentContainerStyle={styles.filtroContent}
                >
                    {statusDisponiveis.map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filtroBotao,
                                filtroAtivo === status && styles.filtroBotaoAtivo,
                                { 
                                    backgroundColor: filtroAtivo === status 
                                        ? getStatusBackground(status)
                                        : '#FFFFFF',
                                    borderColor: getStatusColor(status)
                                }
                            ]}
                            onPress={() => setFiltroAtivo(status)}
                        >
                            <Text style={[
                                styles.filtroTexto,
                                filtroAtivo === status && styles.filtroTextoAtivo,
                                { color: getStatusColor(status) }
                            ]}>
                                {getStatusLabel(status)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Filtros adicionais */}
                {showFiltros && (
                    <View style={styles.filtrosAdicionais}>
                        <Text style={styles.filtroLabel}>Urgência:</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.filtroUrgenciaContainer}
                        >
                            {[
                                { value: 'todos', label: 'Todos' },
                                { value: 'urgente', label: 'Urgente' },
                                { value: 'proximo', label: 'Próximo' },
                                { value: 'futuro', label: 'Futuro' }
                            ].map((urgencia) => (
                                <TouchableOpacity
                                    key={urgencia.value}
                                    style={[
                                        styles.filtroUrgenciaBotao,
                                        filtroUrgencia === urgencia.value && styles.filtroUrgenciaBotaoAtivo
                                    ]}
                                    onPress={() => setFiltroUrgencia(urgencia.value as any)}
                                >
                                    <Text style={[
                                        styles.filtroUrgenciaTexto,
                                        filtroUrgencia === urgencia.value && styles.filtroUrgenciaTextoAtivo
                                    ]}>
                                        {urgencia.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            <FlatList
                data={solicitacoesOrdenadas}
                keyExtractor={(item) => item.servico.id_servico}
                renderItem={({ item }) => (
                    <CardAgendamentoFornecedor
                        solicitacao={item}
                        onPressEntrarContato={handleEntrarEmContato}
                        onPressAtualizarStatus={(novoStatus) =>
                            atualizarStatusServico(item.servico.id_servico, novoStatus)
                        }
                    />
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyMessage}>Nenhuma solicitação encontrada</Text>
                        <Text style={styles.emptySubMessage}>Tente selecionar outro filtro</Text>
                    </View>
                )}
                contentContainerStyle={styles.listaContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerContainer: {
        backgroundColor: '#FFFFFF',
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
        marginRight: 16,
    },
    filtroToggle: {
        padding: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
    },
    filtroToggleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
    },
    filtroContainer: {
        maxHeight: 50,
    },
    filtroContent: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    filtroBotao: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 4,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    filtroBotaoAtivo: {
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    filtroTexto: {
        fontSize: 14,
        fontWeight: '500',
    },
    filtroTextoAtivo: {
        fontWeight: '700',
    },
    filtrosAdicionais: {
        padding: 16,
    },
    filtroLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
    },
    filtroUrgenciaContainer: {
        maxHeight: 50,
    },
    filtroUrgenciaBotao: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 4,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    filtroUrgenciaBotaoAtivo: {
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    filtroUrgenciaTexto: {
        fontSize: 14,
        fontWeight: '500',
    },
    filtroUrgenciaTextoAtivo: {
        fontWeight: '700',
    },
    listaContainer: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyMessage: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666666',
        marginBottom: 8,
    },
    emptySubMessage: {
        fontSize: 14,
        color: '#999999',
    },
});