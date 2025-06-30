import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useGetToken } from '../hooks/useGetToken';
import { API_URL } from '../constants/ApiUrl';

interface Servico {
  id_servico: string;
  id_usuario: string;
  id_fornecedor: string;
  categoria: string;
  data: string;
  horario: string;
  status: string;
  valor?: number;
  descricao?: string;
  id_pagamento?: string;
  id_avaliacao?: string;
}

const MeusServicosScreen: React.FC = () => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const token = useGetToken();

  useEffect(() => {
    if (token !== undefined && token?.id) {
      buscarServicos();
    }
  }, [token]);

  const buscarServicos = async () => {
    try {
      setLoading(true);
      if (!token?.id) {
        console.log("Token não disponível");
        setServicos([]);
        return;
      }
      
      const response = await fetch(`${API_URL}/usuarios/historico/${token.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setServicos(data);
      } else {
        console.log("Dados recebidos não são um array:", data);
        setServicos([]);
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus serviços');
      setServicos([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await buscarServicos();
    setRefreshing(false);
  };

  const servicosFiltrados = servicos.filter(servico => {
    if (filtroStatus === 'todos') return true;
    return servico.status === filtroStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'agendado': return '#3B82F6';
      case 'confirmar valor': return '#F59E0B';
      case 'confirmado': return '#10B981';
      case 'concluído': return '#8B5CF6';
      case 'cancelado': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'agendado': return 'Agendado';
      case 'confirmar valor': return 'Aguardando Confirmação';
      case 'confirmado': return 'Confirmado';
      case 'concluído': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarValor = (valor?: number) => {
    if (!valor) return 'A definir';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleCancelarServico = async (idServico: string) => {
    Alert.alert(
      'Cancelar Serviço',
      'Tem certeza que deseja cancelar este serviço?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/servicos`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id_servico: idServico,
                  status: 'cancelado'
                })
              });
              
              if (response.ok) {
                buscarServicos();
                Alert.alert('Sucesso', 'Serviço cancelado com sucesso');
              } else {
                Alert.alert('Erro', 'Não foi possível cancelar o serviço');
              }
            } catch (error) {
              console.error('Erro ao cancelar serviço:', error);
              Alert.alert('Erro', 'Erro ao cancelar serviço');
            }
          }
        }
      ]
    );
  };

  const FiltroButton = ({ title, count, isSelected, onPress }: {
    title: string;
    count: number;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.filtroButton,
        isSelected && styles.filtroButtonSelected
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filtroButtonText,
        isSelected && styles.filtroButtonTextSelected
      ]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  const ServicoCard = ({ servico }: { servico: Servico }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>{servico.categoria}</Text>
          <Text style={styles.cardDescription}>
            {servico.descricao || 'Sem descrição'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(servico.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(servico.status) }]}>
              {getStatusText(servico.status)}
            </Text>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={styles.valorText}>{formatarValor(servico.valor)}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Data</Text>
          <Text style={styles.detailValue}>{formatarData(servico.data)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Horário</Text>
          <Text style={styles.detailValue}>{servico.horario}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Fornecedor</Text>
          <Text style={styles.detailValue}>ID: {servico.id_fornecedor}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Ver Detalhes</Text>
        </TouchableOpacity>
        
        {servico.status === 'agendado' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelarServico(servico.id_servico)}
          >
            <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancelar</Text>
          </TouchableOpacity>
        )}
        
        {servico.status === 'concluído' && !servico.id_avaliacao && (
          <TouchableOpacity style={[styles.actionButton, styles.avaliarButton]}>
            <Text style={[styles.actionButtonText, styles.avaliarButtonText]}>Avaliar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#AC5906" />
        <Text style={styles.loadingText}>Carregando seus serviços...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Serviços Contratados</Text>
        <Text style={styles.headerSubtitle}>
          Gerencie todos os serviços que você contratou
        </Text>
      </View>

      <ScrollView
        style={styles.filtrosContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <FiltroButton
          title="Todos"
          count={servicos.length}
          isSelected={filtroStatus === 'todos'}
          onPress={() => setFiltroStatus('todos')}
        />
        <FiltroButton
          title="Agendados"
          count={servicos.filter(s => s.status === 'agendado').length}
          isSelected={filtroStatus === 'agendado'}
          onPress={() => setFiltroStatus('agendado')}
        />
        <FiltroButton
          title="Aguardando"
          count={servicos.filter(s => s.status === 'confirmar valor').length}
          isSelected={filtroStatus === 'confirmar valor'}
          onPress={() => setFiltroStatus('confirmar valor')}
        />
        <FiltroButton
          title="Concluídos"
          count={servicos.filter(s => s.status === 'concluído').length}
          isSelected={filtroStatus === 'concluído'}
          onPress={() => setFiltroStatus('concluído')}
        />
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {servicosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nenhum serviço encontrado</Text>
            <Text style={styles.emptyText}>
              {filtroStatus === 'todos' 
                ? 'Você ainda não contratou nenhum serviço.'
                : `Nenhum serviço com status "${getStatusText(filtroStatus)}" encontrado.`
              }
            </Text>
          </View>
        ) : (
          <View style={styles.servicosList}>
            {servicosFiltrados.map((servico) => (
              <ServicoCard key={servico.id_servico} servico={servico} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  filtrosContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtroButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filtroButtonSelected: {
    backgroundColor: '#AC5906',
  },
  filtroButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filtroButtonTextSelected: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  servicosList: {
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  valorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#AC5906',
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#AC5906',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    color: 'white',
  },
  avaliarButton: {
    backgroundColor: '#10B981',
  },
  avaliarButtonText: {
    color: 'white',
  },
});

export default MeusServicosScreen; 