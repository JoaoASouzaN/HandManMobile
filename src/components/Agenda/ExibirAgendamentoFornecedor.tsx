import React, { useEffect, useState } from 'react';
import { Text, ScrollView, View, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Image } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../constants/ApiUrl';
import { useGetToken } from '../../hooks/useGetToken';
import { ServicoComUsuario, StatusType } from '../../model/Agendamento';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getStatusConfig } from '../../utils/statusConfig';
import { useStatusNotifications } from '../../hooks/useStatusNotifications';
import { CommonActions, CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { RootTabParamList } from '../../navigation/TabNavigation';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { FornecedorStackParamList } from '../../navigation/FornecedorStackNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Loading } from '../Loading';

type NavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList>,
    NativeStackNavigationProp<FornecedorStackParamList>
>;

interface ExibirAgendamentoFornecedorProps {
    fornecedorId: string | undefined;
    onPressEntrarContato?: (idUsuario: string) => void;
    onPressAtualizarStatus?: (novoStatus: StatusType) => void;
}

export const ExibirAgendamentoFornecedor: React.FC<ExibirAgendamentoFornecedorProps> = ({ 
    fornecedorId 
}) => {
    const [loading, setLoading] = useState(true);
    const [agendamento, setAgendamento] = useState<ServicoComUsuario | null>(null);
    const [showNegociacaoModal, setShowNegociacaoModal] = useState(false);
    const navigation = useNavigation<NavigationProp>(); 
    const [novoValor, setNovoValor] = useState('');
    const token = useGetToken();
    const [showFullScreenImage, setShowFullScreenImage] = useState(false);
    const [currentImageUri, setCurrentImageUri] = useState('');
    
    const handleStatusUpdate = async (update: { id_servico: string; novo_status: string }) => {
        if (agendamento && agendamento.id_servico === update.id_servico) {
            setAgendamento(prevAgendamento => 
                prevAgendamento ? { ...prevAgendamento, status: update.novo_status as StatusType } : null
            );
        }
    };

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

    const { emitirMudancaStatus } = useStatusNotifications(handleStatusUpdate);

    const onPressAtualizarStatus = async (novo_status: StatusType) => {
        try {
            if(!agendamento){
                return
            }
            console.log(fornecedorId)

            await axios.put(`${API_URL}/servicos`, {
                id_servico:agendamento.id_servico,
                status: novo_status
            });

            emitirMudancaStatus(agendamento.id_servico, novo_status,agendamento.id_fornecedor);
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            
            Alert.alert(
                "Erro",
                "Não foi possível atualizar o status do serviço. Tente novamente.",
                [{ text: "OK" }]
            );
        }
    };

    const onPressEntrarContato = (idUsuario: string) => {
        
        navigation.navigate('FornecedorStack', {
            screen: 'ChatScreen',
            params: { fornecedorId: idUsuario }
        });
    };

    useEffect(() => {
        const fetchAgendamento = async () => {
            setLoading(true);
            if (!fornecedorId || !token?.id) return;

            try {
                const response = await axios.get(`${API_URL}/servicos/${fornecedorId}/usuario`);
                setAgendamento(response.data);
            } catch (error) {
                console.error('Erro ao buscar detalhes do agendamento:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAgendamento();
    }, [fornecedorId, token]);

    const handleNegociarPreco = async () => {
        try {
            if (!novoValor || isNaN(Number(novoValor)) || Number(novoValor) <= 0) {
                Alert.alert('Erro', 'Por favor, insira um valor válido');
                return;
            }

            const data = {
                id_servico: fornecedorId,
                valor: Number(novoValor)
            };

            await axios.put(`${API_URL}/servicos/valor`, data);

            if(!fornecedorId){
                return
            }
            
            if (onPressAtualizarStatus) {
                onPressAtualizarStatus('confirmar valor');
            }

            Alert.alert('Sucesso', 'Valor atualizado com sucesso!');

            setShowNegociacaoModal(false);
            setNovoValor('');
        } catch (error) {
            console.error('Erro ao atualizar valor:', error);
            Alert.alert('Erro', 'Erro ao atualizar valor');
        }
    };

    const openFullScreenImage = (uri: string) => {
        setCurrentImageUri(uri);
        setShowFullScreenImage(true);
    };

    const closeFullScreenImage = () => {
        setShowFullScreenImage(false);
    };

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

    const statusConfig = getStatusConfig(agendamento.status);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.profileSection}>
                <View style={styles.profileImageContainer}>
                    {agendamento.usuario?.imagemPerfil ? (
                        <Image source={{uri: agendamento.usuario.imagemPerfil}} style={styles.profileImage} />
                    ) : (
                        <MaterialCommunityIcons name="account-circle" size={60} color="#ccc" />
                    )}
                    <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.profileTextContainer}>
                    <Text style={styles.profileName}>{agendamento.usuario?.nome}</Text>
                    <Text style={styles.profileCategory}>{agendamento.categoria}</Text>
                </View>
            </View>

            <View style={styles.statusDateValueSection}>
                <View style={styles.statusAndTimeLeft}>
                    <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
                        <MaterialCommunityIcons
                            name={statusConfig.icon}
                            size={16}
                            color={statusConfig.color}
                        />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.text}
                        </Text>
                    </View>
                    <View style={styles.dateAndTimeContainer}>
                        <MaterialCommunityIcons name="calendar" size={16} color="#666" />
                        <Text style={styles.dateText}>
                            {new Date(agendamento.data).toLocaleDateString()}
                        </Text>
                        <MaterialCommunityIcons name="clock-time-four-outline" size={16} color="#666" />
                        <Text style={styles.timeText}>
                            {new Date(agendamento.horario).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
                {agendamento.valor && agendamento.valor > 0 ? (
                    <Text style={styles.priceValue}>
                        R$ {agendamento.valor.toFixed(2).replace('.', ',')}
                    </Text>
                ) : (
                    <Text style={styles.combineValueText}>Combinar Valor</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Descrição do Serviço</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.value}>{agendamento.descricao}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Endereço</Text>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Rua:</Text>
                    <Text style={styles.value}>{agendamento.usuario?.endereco?.rua}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Cidade:</Text>
                    <Text style={styles.value}>{agendamento.usuario?.endereco?.cidade}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Estado:</Text>
                    <Text style={styles.value}>{agendamento.usuario?.endereco?.estado}</Text>
                </View>
            </View>

            {/* Seção de Imagens */}
            {agendamento.imagems && Array.isArray(agendamento.imagems) && agendamento.imagems.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Imagens do Serviço</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageGallery}>
                        {agendamento.imagems.map((imagem, index) => (
                            <TouchableOpacity key={index} onPress={() => openFullScreenImage(imagem)}>
                                <Image source={{ uri: imagem }} style={styles.serviceImage} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Botões de Ação */}
            <View style={styles.actionButtonsContainer}>
                {agendamento.status.toLowerCase() === 'pendente' && (
                    <View style={styles.mainButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={() => onPressAtualizarStatus('negociar valor')}
                        >
                            <Text style={styles.buttonText}>Aceitar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.rejectButton]}
                            onPress={() => onPressAtualizarStatus('Recusado')}
                        >
                            <Text style={styles.buttonText}>Recusar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {agendamento.status.toLowerCase() === 'negociar valor' && (
                    <View style={styles.mainButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={() => setShowNegociacaoModal(true)}
                        >
                            <Text style={styles.buttonText}>Negociar Valor</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.rejectButton]}
                            onPress={() => onPressAtualizarStatus('Recusado')}
                        >
                            <Text style={styles.buttonText}>Recusar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {agendamento.status.toLowerCase() === 'confirmado' && (
                    <>
                        <View style={styles.mainButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => onPressAtualizarStatus('cancelado')}
                            >
                                <Text style={styles.buttonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.completeButton]}
                                onPress={() => onPressAtualizarStatus('Em Andamento')}
                            >
                                <Text style={styles.buttonText}>Iniciar serviço</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={[styles.button, styles.contactButton, styles.fullWidthButton]}
                            onPress={() => onPressEntrarContato(agendamento.id_usuario)}
                        >
                            <Text style={styles.buttonText}>Contato</Text>
                        </TouchableOpacity>
                    </>
                )}

                {agendamento.status.toLowerCase() === 'em andamento' && (
                    <>
                        <View style={styles.mainButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => onPressAtualizarStatus('cancelado')}
                            >
                                <Text style={styles.buttonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.completeButton]}
                                onPress={() => onPressAtualizarStatus('Aguardando pagamento')}
                            >
                                <Text style={styles.buttonText}>Finalizar</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={[styles.button, styles.contactButton, styles.fullWidthButton]}
                            onPress={() => onPressEntrarContato(agendamento.id_usuario)}
                        >
                            <Text style={styles.buttonText}>Contato</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Spacer para garantir que os botões não sejam cortados */}
            <View style={{ height: 30 }} />

            {/* Modal de Negociação */}
            <Modal
                visible={showNegociacaoModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowNegociacaoModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Negociar Preço</Text>
                        
                        <TextInput
                            style={styles.input}
                            value={novoValor}
                            onChangeText={setNovoValor}
                            placeholder="Digite o novo valor"
                            keyboardType="numeric"
                            placeholderTextColor="#666"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowNegociacaoModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleNegociarPreco}
                            >
                                <Text style={styles.modalButtonText}>Confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Imagem em Tela Cheia */}
            <Modal
                visible={showFullScreenImage}
                transparent={true}
                animationType="fade"
                onRequestClose={closeFullScreenImage}
            >
                <View style={styles.fullScreenImageOverlay}>
                    <TouchableOpacity style={styles.closeButton} onPress={closeFullScreenImage}>
                        <MaterialCommunityIcons name="close-circle" size={30} color="white" />
                    </TouchableOpacity>
                    {currentImageUri && (
                        <Image source={{ uri: currentImageUri }} style={styles.fullScreenImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 30,
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 0,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingRight: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 5,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
    },
    profileImageContainer: {
        position: 'relative',
        marginRight: 15,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: 'white',
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    profileTextContainer: {
        justifyContent: 'center',
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    profileCategory: {
        fontSize: 16,
        color: '#666',
    },
    statusDateValueSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#F5F5F5',
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    statusAndTimeLeft: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        flexShrink: 1,
    },
    dateAndTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
    },
    timeText: {
        fontSize: 14,
        color: '#666',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    combineValueText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#AC5906',
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: '#666666',
        width: 100,
    },
    value: {
        fontSize: 16,
        color: '#333333',
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    imageGallery: {
        flexDirection: 'row',
        paddingVertical: 10,
    },
    serviceImage: {
        width: 150,
        height: 150,
        borderRadius: 8,
        marginRight: 10,
        resizeMode: 'cover',
    },
    actionButtonsContainer: {
        marginTop: 20,
        gap: 10,
    },
    mainButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    fullWidthButton: {
        width: '100%',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    completeButton: {
        backgroundColor: '#2196F3',
    },
    cancelButton: {
        backgroundColor: '#F44336',
    },
    contactButton: {
        backgroundColor: '#9C27B0',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    modalButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    confirmButton: {
        backgroundColor: '#AC5906',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    fullScreenImageOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '90%',
        height: '70%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
});