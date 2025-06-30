import React, { useEffect, useState } from 'react';
import { Text, ScrollView, View, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../constants/ApiUrl';
import { useGetToken } from '../../hooks/useGetToken';
import { Loading } from '../Loading';
import { ServicoIlustrar, StatusType } from '../../model/Agendamento';
import placeholderImage from '../../assets/handman.jpg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute, CommonActions, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FornecedorStackParamList } from '../../navigation/FornecedorStackNavigation';
import { useStatusNotifications } from '../../hooks/useStatusNotifications';
import { RootTabParamList } from '../../navigation/TabNavigation';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ModalAvaliacao } from '../ModalAvaliacao';

interface ExibirAgendamentoUsuarioProps {
    fornecedorId: string | undefined;
}

type ExibirAgendaScreenRouteProp = RouteProp<FornecedorStackParamList, 'ExibirAgendamentoScreen'>;
type ExibirAgendaScreenNavigationProp = NativeStackNavigationProp<FornecedorStackParamList, 'ExibirAgendamentoScreen'>;

type NavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList>,
    NativeStackNavigationProp<FornecedorStackParamList>
>;

export const ExibirAgendamentoUsuario: React.FC<ExibirAgendamentoUsuarioProps> = ({ fornecedorId }) => {
    const navigation = useNavigation<ExibirAgendaScreenNavigationProp>();
    const route = useRoute<ExibirAgendaScreenRouteProp>();

    const navigationChat = useNavigation<NavigationProp>();

    const [loading, setLoading] = useState(true);
    const [agendamento, setAgendamento] = useState<ServicoIlustrar | null>(null);
    const [isAvaliacaoOpen, setIsAvaliacaoOpen] = useState(false);
    const token = useGetToken();
    

    const handleStatusUpdate = (update: { id_servico: string; novo_status: string }) => {
        if (agendamento && agendamento.id_servico === update.id_servico) {
            setAgendamento(prevAgendamento => 
                prevAgendamento ? { ...prevAgendamento, status: update.novo_status as StatusType } : null
            );
        }
    };

    const { emitirMudancaStatus } = useStatusNotifications(handleStatusUpdate);

    const atualizarStatusServico = async ( novo_status: StatusType) => {
        try {
            if(!agendamento){
                return
            }
            // Atualiza no banco
            await axios.put(`${API_URL}/servicos`, {
                id_servico:agendamento.id_servico,
                status: novo_status
            });

            // Emite o evento de socket
            emitirMudancaStatus(agendamento.id_servico, novo_status, agendamento.id_fornecedor);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            Alert.alert(
                "Erro",
                "Não foi possível atualizar o status do serviço. Tente novamente.",
                [{ text: "OK" }]
            );
        }
    };

    const handleSubmitAvaliacao = async (nota: number, comentario: string) => {
        if (!agendamento || !token?.id) return;
        
        try {
            const dataAvaliacao = {
                id_servico: agendamento.id_servico,
                id_usuario: token.id,
                id_fornecedor: agendamento.id_fornecedor,
                data: agendamento.data,
                nota: nota,
                comentario: comentario
            };
            
            await axios.post(`${API_URL}/avaliacao`, dataAvaliacao);
            setIsAvaliacaoOpen(false);
        } catch (error) {
            console.error("Erro ao enviar avaliação:", error);
        }
    };

    const handleEntrarEmContato = (idFornecedor: string) => {
        navigationChat.navigate('FornecedorStack', {
            screen: 'ChatScreen',
            params: { fornecedorId: idFornecedor }
        });
    }

    const handleAvaliarServico = () => {
        setIsAvaliacaoOpen(true);
    };

    const handlePagarPeloApp = () =>{
        
    }

    const handleVoltar = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    { name: 'Agenda' }
                ],
            })
        );
    };

    const fetchAgendamento = async () => {

        if (!fornecedorId || !token?.id) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/servicos/${fornecedorId}`);
            setAgendamento(response.data);
        } catch (error) {
            console.error('Erro ao buscar detalhes do agendamento:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        fetchAgendamento();
    }, [fornecedorId, token]);

    if (loading) {
        return (
            <Loading />
        );
    }

    if (!agendamento) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Agendamento não encontrado</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.outerContainer}> 
            <View style={styles.header}>
                <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>DETALHES DO SERVIÇO</Text>
            </View>
            <ScrollView style={styles.scrollViewContent}>
                <View style={styles.section}>
                    <Image
                        source={agendamento.fornecedor?.imagemPerfil ? { uri: agendamento.fornecedor.imagemPerfil } : placeholderImage}
                        style={styles.userImage}
                    />
                    <Text style={styles.fornecedorName}>{agendamento.fornecedor?.nome || 'Fornecedor não disponível'}</Text>
                    <Text style={styles.orderInfo}>
                        {new Date(agendamento.data).toLocaleDateString()} às {new Date(agendamento.horario).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {agendamento.status === 'concluido' && (
                        <View style={styles.orderStatusContainer}>
                            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                            <Text style={styles.orderStatusText}>
                                Serviço concluído às {new Date(agendamento.horario).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumo do Serviço</Text>
                    <View style={styles.itemRow}>
                        <Text style={styles.itemName}>{agendamento.categoria}</Text>
                    </View>
                   
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Descrição:</Text>
                        <Text style={styles.value}>{agendamento.descricao}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Status:</Text>
                        <Text style={styles.value}>{agendamento.status}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumo de Valores</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Total:</Text>
                        <Text style={styles.value}>
                            {`R$ ${((agendamento.valor ?? 0)).toFixed(2)}`}
                        </Text>
                    </View>
                </View>

                {agendamento.status === 'concluido' && (
                    <TouchableOpacity style={styles.button} onPress={handleAvaliarServico}>
                        <Text style={styles.buttonText}>Avaliar</Text>
                    </TouchableOpacity>
                )}

                {agendamento.status === 'Aguardando pagamento' && (
                    <View style={styles.paymentButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.paymentButton]}
                            onPress={handlePagarPeloApp}
                        >
                            <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Pagar pelo App</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.paymentButton, styles.localPaymentButton]}
                            onPress={() => atualizarStatusServico('concluido')}
                        >
                            <MaterialCommunityIcons name="cash" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Pagamento realizado Localmente</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {agendamento.status === 'Em Andamento' && (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => handleEntrarEmContato(agendamento.id_fornecedor)}
                    >
                        <Text style={styles.buttonText}>Entrar em contato</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.footer}>
                    {agendamento.status.toLowerCase() === 'pendente' && (
                        <>
                            <Text style={styles.pendingMessage}>Aguardando confirmação do fornecedor.</Text>
                        </>
                    )}

                    {['pendente', 'confirmado', 'em andamento'].includes(agendamento.status.toLowerCase()) && (
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => atualizarStatusServico('cancelado')}
                        >
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
            <ModalAvaliacao
                visible={isAvaliacaoOpen}
                onClose={() => {
                    setIsAvaliacaoOpen(false);
                }}
                onSubmit={handleSubmitAvaliacao}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        padding: 16,
        paddingBottom: 40,
    },
    userImage:{
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
        alignSelf: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#FF5252',
        textAlign: 'center',
        marginTop: 20,
    },
    outerContainer: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    scrollViewContent: {
        flex: 1,
        padding: 16,
        paddingBottom: 40,
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        alignSelf:'center'
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    helpButton: {
        fontSize: 16,
        color: '#DC3545',
        fontWeight: '600',
    },
    fornecedorName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        marginBottom: 4,
    },
    orderInfo: {
        fontSize: 14,
        color: '#888888',
        textAlign: 'center',
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemName: {
        fontSize: 17,
        color: '#333333',
        fontWeight: '600',
    },
    itemValue: {
        fontSize: 17,
        color: '#333333',
        fontWeight: '600',
    },
    itemQuantityContainer: {
        backgroundColor: '#DC3545',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        marginRight: 'auto',
    },
    itemQuantity: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    itemNote: {
        fontSize: 14,
        color: '#888888',
        fontStyle: 'italic',
        marginBottom: 16,
        paddingLeft: 8,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333333',
        marginBottom: 24,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingVertical: 8,
    },
    label: {
        fontSize: 17,
        color: '#666666',
        fontWeight: '600',
    },
    value: {
        fontSize: 17,
        color: '#333333',
        flex: 1,
        textAlign: 'right',
        fontWeight: '500',
    },
    orderStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        justifyContent: 'center',
    },
    orderStatusText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#2E7D32',
        fontWeight: '600',
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentMethodLogo: {
        width: 30,
        height: 30,
        marginRight: 10,
        resizeMode: 'contain',
    },
    paymentMethodText: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    },
    paymentCardType: {
        fontSize: 14,
        color: '#666666',
        marginLeft: 40,
        marginBottom: 16,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locationIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    addressText: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    },
    addressDetailText: {
        fontSize: 14,
        color: '#666666',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: '#DC3545',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        marginHorizontal: 16,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#AC5906',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        width: '100%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    paymentButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 10,
    },
    paymentButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
    },
    localPaymentButton: {
        backgroundColor: '#2196F3',
    },
    buttonIcon: {
        marginRight: 8,
    },
    cancelButton: {
        backgroundColor: '#F44336',
    },
    pendingMessage: {
        fontSize: 14,
        color: '#FFA500',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
        width: '100%',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
    }
});