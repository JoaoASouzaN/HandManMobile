import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, SectionList, TouchableOpacity, ScrollView } from 'react-native';
import { AgendamentoService } from '../../services/AgendamentoServico';
import { HistoricoAgendamento, StatusType } from '../../model/Agendamento';
import { CardAgendamento } from './CardAgendamento';
import { useGetToken } from '../../hooks/useGetToken';
import { CompositeNavigationProp,useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList } from '../../navigation/TabNavigation';
import { FornecedorStackParamList } from '../../navigation/FornecedorStackNavigation';
import { ModalAvaliacao } from '../ModalAvaliacao';
import axios from 'axios';
import { API_URL } from '../../constants/ApiUrl';
import { useStatusNotifications } from '../../hooks/useStatusNotifications';
import { getStatusColor, getStatusBackground, getStatusLabel } from '../../utils/statusConfig';
import { Loading } from '../Loading';

type NavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList>,
    NativeStackNavigationProp<FornecedorStackParamList>
>;

export const AgendaUsuario = () => {
    const [agendamentos, setAgendamentos] = useState<HistoricoAgendamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAvaliacaoOpen, setIsAvaliacaoOpen] = useState(false);
    const [servicoSelecionado, setServicoSelecionado] = useState<HistoricoAgendamento | null>(null);
    const [filtroAtivo, setFiltroAtivo] = useState<StatusType | 'todos'>('todos');
    const [filtroUrgencia, setFiltroUrgencia] = useState<'todos' | 'urgente' | 'proximo' | 'futuro'>('todos');
    const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
    const [showFiltros, setShowFiltros] = useState(false);
    const navigation = useNavigation<NavigationProp>();
    const token = useGetToken();

    const handleStatusUpdate = (update: { id_servico: string; novo_status: string }) => {
        setAgendamentos(prevAgendamentos => 
            prevAgendamentos && Array.isArray(prevAgendamentos) 
                ? prevAgendamentos.map(agendamento => 
                    agendamento.id_servico === update.id_servico
                        ? { ...agendamento, status: update.novo_status as StatusType }
                        : agendamento
                )
                : []
        );
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

    const atualizarStatusServico = async (id_servico: string, novo_status: StatusType, id_fornecedor: string) => {
        try {
            // Atualiza no banco
            await axios.put(`${API_URL}/servicos`, {
                id_servico,
                status: novo_status
            });

            // Emite o evento de socket
            emitirMudancaStatus(id_servico, novo_status, id_fornecedor);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            Alert.alert(
                "Erro",
                "Não foi possível atualizar o status do serviço. Tente novamente.",
                [{ text: "OK" }]
            );
        }
    };

    const fetchAgendamentos = async () => {
        setLoading(true);
        try {
            if (!token || !token.id) {
                console.log("Token não disponível ainda");
                setAgendamentos([]);
                return;
            }

            const id_usuario = token.id;
            const agendamentos = await AgendamentoService.getAgendamentos(id_usuario);
            if (agendamentos && Array.isArray(agendamentos)) {
                setAgendamentos(agendamentos);
            } else {
                setAgendamentos([]);
            }
        } catch (error) {
            console.error("Erro ao buscar agendamentos:", error);
            setAgendamentos([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Só busca agendamentos se o token estiver carregado (não undefined)
        if (token !== undefined) {
            fetchAgendamentos();
        }
    }, [token]);

    const handleSubmitAvaliacao = async (nota: number, comentario: string) => {
        if (!servicoSelecionado || !token?.id) return;
        
        try {
            const dataAvaliacao = {
                id_servico: servicoSelecionado.id_servico,
                id_usuario: token.id,
                id_fornecedor: servicoSelecionado.id_fornecedor,
                data: servicoSelecionado.data,
                nota: nota,
                comentario: comentario
            };
            
            await axios.post(`${API_URL}/avaliacao`, dataAvaliacao);
            servicoSelecionado.avaliado = true;
            setIsAvaliacaoOpen(false);
            setServicoSelecionado(null);
        } catch (error) {
            console.error("Erro ao enviar avaliação:", error);
        }
    };

    const handleEntrarEmContato = (idFornecedor: string) => {
        navigation.navigate('FornecedorStack', {
            screen: 'ChatScreen',
            params: { fornecedorId: idFornecedor }
        });
    }

    const handleAvaliarServico = (agendamento: HistoricoAgendamento) => {
        setServicoSelecionado(agendamento);
        setIsAvaliacaoOpen(true);
    };

    const handleVerDetalhes = (agendamento: HistoricoAgendamento) => {
        navigation.navigate('FornecedorStack', {
            screen: 'ExibirAgendamentoScreen',
            params: { fornecedorId: agendamento.id_servico }
        });
    };

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

    const agendamentosFiltrados = agendamentos.filter(ag => {
        // Filtro por status
        if (filtroAtivo !== 'todos' && ag.status !== filtroAtivo) {
            return false;
        }

        // Filtro por urgência
        if (filtroUrgencia !== 'todos') {
            const dataServico = new Date(ag.data);
            const urgencia = calcularUrgencia(dataServico);
            if (urgencia !== filtroUrgencia) {
                return false;
            }
        }

        return true;
    });

    // Ordenação por urgência (prazo mais apertado primeiro)
    const agendamentosOrdenados = [...agendamentosFiltrados].sort((a, b) => {
        const dataA = new Date(a.data);
        const dataB = new Date(b.data);
        
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
        
        const prioridadeA = prioridadeStatus[a.status.toLowerCase()] || 8;
        const prioridadeB = prioridadeStatus[b.status.toLowerCase()] || 8;
        
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
                    <Text style={styles.headerTitle}>Meus Agendamentos</Text>
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
                data={agendamentosOrdenados}
                keyExtractor={(item) => item.id_servico}
                renderItem={({ item }) => (
                    <CardAgendamento 
                        agendamento={item} 
                        onPress={() => handleVerDetalhes(item)}
                        onPressEntrarContato={handleEntrarEmContato}
                        onPressAtualizarStatus={(novoStatus) => 
                            atualizarStatusServico(item.id_servico, novoStatus as StatusType, item.id_fornecedor)
                        }
                    />
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyMessage}>Nenhum agendamento encontrado</Text>
                        <Text style={styles.emptySubMessage}>Tente selecionar outro filtro</Text>
                    </View>
                )}
                contentContainerStyle={styles.listaContainer}
            />

            <ModalAvaliacao
                visible={isAvaliacaoOpen}
                onClose={() => {
                    setIsAvaliacaoOpen(false);
                    setServicoSelecionado(null);
                }}
                onSubmit={handleSubmitAvaliacao}
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