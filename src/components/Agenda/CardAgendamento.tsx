import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { HistoricoAgendamento, StatusType } from '../../model/Agendamento';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getStatusConfig } from '../../utils/statusConfig';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FornecedorStackParamList } from '../../navigation/FornecedorStackNavigation';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { RootTabParamList } from '../../navigation/TabNavigation';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useGetToken } from '../../hooks/useGetToken';
import { useSocketConnection } from '../../hooks/useSocketConnection';

type NavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<RootTabParamList>,
    BottomTabNavigationProp<FornecedorStackParamList>
>;

interface CardAgendamentoProps {
    agendamento: HistoricoAgendamento;
    onPress?: () => void;
    onPressEntrarContato: (idFornecedor: string) => void;
    onPressAtualizarStatus: (novoStatus: StatusType) => void;
    onPressPagarApp?: () => void;
    onPressPagarLocal?: () => void;
    setHistorico?: React.Dispatch<React.SetStateAction<HistoricoAgendamento[] | null>>;
}

export const CardAgendamento: React.FC<CardAgendamentoProps> = ({
    agendamento,
    onPress,
    onPressEntrarContato,
    onPressAtualizarStatus,
    onPressPagarApp,
    onPressPagarLocal,
    setHistorico
}) => {
    const placeholderImage = require('../../assets/agenda.png');
    const statusConfig = getStatusConfig(agendamento.status);
    const navigation = useNavigation<NavigationProp>();
    const token = useGetToken();
    const [valorAtual, setValorAtual] = useState<number | null>(agendamento.valor || null);

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

    // Calcular urgência do serviço atual
    const dataServico = new Date(agendamento.data);
    const urgencia = calcularUrgencia(dataServico);
    const diasRestantes = calcularDiasRestantes(dataServico);

    // Configuração visual da urgência
    const urgenciaConfig = {
        urgente: { 
            color: '#EF4444', 
            bgColor: '#FEE2E2', 
            text: diasRestantes === 0 ? 'HOJE!' : 'AMANHÃ!',
            icon: '🔥'
        },
        proximo: { 
            color: '#F59E0B', 
            bgColor: '#FEF3C7', 
            text: `${diasRestantes} dias`,
            icon: '⚡'
        },
        futuro: { 
            color: '#10B981', 
            bgColor: '#D1FAE5', 
            text: `${diasRestantes} dias`,
            icon: '📅'
        }
    };

    const configUrgencia = urgenciaConfig[urgencia];

    // Usando o hook de socket
    useSocketConnection({
        tokenId: token?.id,
        agendamentoId: agendamento.id_servico,
        setHistorico,
        onValorAtualizado: (novoValor) => {
            setValorAtual(novoValor);
            Alert.alert(
                "Atualização",
                "O valor do serviço foi atualizado!",
                [{ text: "OK" }]
            );
        }
    });

    const handleCardPress = () => {
        navigation.navigate('FornecedorStack', {
            screen: 'ExibirAgendamentoScreen',
            params: {
                fornecedorId: agendamento.id_servico
            }
        });
    };

    const handleConfirmarValor = () => {
        try {
            onPressAtualizarStatus('confirmado');
            Alert.alert(
                "Sucesso",
                "Valor confirmado com sucesso!",
                [{ text: "OK" }]
            );
        } catch (error) {
            console.error("Erro ao confirmar valor:", error);
            Alert.alert(
                "Erro",
                "Não foi possível confirmar o valor. Tente novamente.",
                [{ text: "OK" }]
            );
        }
    };

    const handleRecusarValor = () => {
        try {
            onPressAtualizarStatus('cancelado');
            Alert.alert(
                "Aviso",
                "Valor recusado. O serviço foi cancelado.",
                [{ text: "OK" }]
            );
        } catch (error) {
            console.error("Erro ao recusar valor:", error);
            Alert.alert(
                "Erro",
                "Não foi possível recusar o valor. Tente novamente.",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <TouchableOpacity style={styles.cardContainer} onPress={handleCardPress}>
            {/* Indicador de Urgência */}
            {urgencia === 'urgente' && (
                <View style={[styles.urgenciaBadge, { backgroundColor: configUrgencia.bgColor }]}>
                    <Text style={[styles.urgenciaText, { color: configUrgencia.color }]}>
                        {configUrgencia.icon} {configUrgencia.text}
                    </Text>
                </View>
            )}

            <View style={styles.headerContainer}>
                <Image
                    source={
                        agendamento.fornecedor?.imagemPerfil 
                        ? { uri: agendamento.fornecedor.imagemPerfil }
                        : placeholderImage
                    }
                    style={styles.providerImage}
                />
                <Text style={styles.providerName}>{agendamento.fornecedor?.nome || 'Fornecedor não disponível'}</Text>
            </View>

            <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Data do serviço:</Text>
                    <Text style={styles.detailValue}>
                        {new Date(agendamento.data).toLocaleDateString()}
                        {/* Indicador de urgência sutil */}
                        <Text style={[styles.urgenciaSutil, { color: configUrgencia.color }]}>
                            {' '}{configUrgencia.icon} {configUrgencia.text}
                        </Text>
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Valor:</Text>
                    <Text style={styles.detailValue}>
                        {valorAtual 
                            ? `R$ ${valorAtual.toFixed(2)}`
                            : "A combinar"}
                    </Text>
                </View>
                <View style={styles.statusContainer}>
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
                </View>
            </View>

            {agendamento.status === 'confirmar valor' && (
                <View style={styles.valorContainer}>
                    <View style={styles.valorHeader}>
                        <Text style={styles.valorLabel}>Valor Proposto:</Text>
                        <Text style={styles.valorValue}>
                            R$ {valorAtual?.toFixed(2) || "0,00"}
                        </Text>
                    </View>
                    <View style={styles.valorButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleConfirmarValor}
                        >
                            <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Aceitar Valor</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleRecusarValor}
                        >
                            <MaterialCommunityIcons name="close-circle" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.buttonText}>Recusar Valor</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {agendamento.status === 'concluido' && !agendamento.avaliado && (
                <TouchableOpacity style={styles.button} onPress={onPress}>
                    <Text style={styles.buttonText}>Avaliar</Text>
                </TouchableOpacity>
            )}

            {agendamento.status === 'Aguardando pagamento' && (
                <View style={styles.paymentButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.paymentButton]}
                        onPress={onPressPagarApp}
                    >
                        <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Pagar pelo App</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.paymentButton, styles.localPaymentButton]}
                        onPress={() => onPressAtualizarStatus('concluido')}
                    >
                        <MaterialCommunityIcons name="cash" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Pagamento realizado Localmente</Text>
                    </TouchableOpacity>
                </View>
            )}

            {agendamento.status === 'Em Andamento' && (
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => onPressEntrarContato(agendamento.id_fornecedor)}
                >
                    <Text style={styles.buttonText}>Entrar em contato</Text>
                </TouchableOpacity>
            )}
            {agendamento.status === 'confirmado' && (
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => onPressEntrarContato(agendamento.id_fornecedor)}
                >
                    <Text style={styles.buttonText}>Entrar em contato</Text>
                </TouchableOpacity>
            )}

            <View style={styles.footer}>
                {agendamento.status.toLowerCase() === 'pendente' && (
                    <Text style={styles.pendingMessage}>Aguardando confirmação do fornecedor.</Text>
                )}

                {['pendente', 'confirmado', 'em andamento'].includes(agendamento.status.toLowerCase()) && (
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => onPressAtualizarStatus('cancelado')}
                    >
                        <Text style={styles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#Ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#AC5906',
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    providerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    providerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    detailsContainer: {
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    button: {
        backgroundColor: '#AC5906',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        display:'flex',
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
    statusContainer: {
        marginTop: 10,
        alignItems: 'flex-end',
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        flexDirection:'row'
    },
    startButton: {
        backgroundColor: '#2196F3',
    },
    completeButton: {
        backgroundColor: '#4CAF50',
    },
    cancelButton: {
        backgroundColor: '#F44336',
        flexDirection:'row'
    },
    pendingMessage: {
        fontSize: 14,
        color: '#FFA500',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
        width: '100%',
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
    valorContainer: {
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
        marginTop: 12,
    },
    valorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    valorLabel: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    valorValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#AC5906',
    },
    valorButtons: {
        flexDirection: 'column',
        gap: 8,
    },
    urgenciaBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 4,
        borderRadius: 8,
    },
    urgenciaText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    urgenciaSutil: {
        fontSize: 12,
        fontWeight: 'normal',
    },
});

export default CardAgendamento; 