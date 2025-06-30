import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';
import { LeilaoImage } from '../components/leilao/LeilaoImage';
import { FormularioLance } from '../components/leilao/FormularioLance';
import { LeilaoService } from '../services/LeilaoService';
import { Leilao } from '../types/leilao';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface RouteParams {
  id: string;
}

export const LeilaoDetalhesScreen: React.FC = () => {
  const [leilao, setLeilao] = useState<Leilao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { id } = route.params as RouteParams;

  console.log('LeilaoDetalhesScreen renderizada com ID:', id);

  const buscarLeilao = async () => {
    try {
      console.log('Iniciando busca do leilão com ID:', id);
      setLoading(true);
      const data = await LeilaoService.buscarLeilaoPorId(id);
      console.log('Leilão encontrado:', data);
      setLeilao(data);
      setError(null);
    } catch (error: any) {
      console.error('Erro ao buscar leilão:', error);
      setError(error.message || 'Erro ao carregar leilão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      buscarLeilao();
    }
  }, [id]);

  const handleLanceRealizado = () => {
    buscarLeilao(); // Recarregar dados do leilão
  };

  const tempoRestante = (dataFinal: string) => {
    try {
      return formatDistanceToNow(new Date(dataFinal), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EEB16C" />
        <Text style={styles.loadingText}>Carregando leilão...</Text>
      </View>
    );
  }

  if (error || !leilao) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>
          {error || 'Leilão não encontrado'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const valorAtual = leilao.lances.length > 0
    ? leilao.lances[leilao.lances.length - 1].valor
    : leilao.valorDesejado;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Leilão</Text>
      </View>

      <LeilaoImage
        src={leilao.imagem || leilao.imagemCapa}
        alt={leilao.titulo}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{leilao.titulo}</Text>
        <Text style={styles.description}>{leilao.descricao}</Text>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Icon name="tag" size={16} color="#666" />
            <Text style={styles.infoText}>{leilao.categoria}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="clock" size={16} color="#666" />
            <Text style={styles.infoText}>
              Encerra {tempoRestante(leilao.prazoLimite || leilao.tempoFinalizacao || leilao.data_final || '')}
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Valor Atual</Text>
          <Text style={styles.priceValue}>R$ {valorAtual.toFixed(2)}</Text>
          <Text style={styles.bidsCount}>
            {leilao.lances.length} lance{leilao.lances.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {leilao.detalhes && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Detalhes Adicionais</Text>
            <Text style={styles.detailsText}>{leilao.detalhes}</Text>
          </View>
        )}

        <View style={styles.lancesContainer}>
          <Text style={styles.lancesTitle}>Histórico de Lances</Text>
          {!leilao.lances || !Array.isArray(leilao.lances) || leilao.lances.length === 0 ? (
            <Text style={styles.noBidsText}>Nenhum lance ainda</Text>
          ) : (
            leilao.lances.map((lance, index) => (
              <View key={index} style={styles.lanceItem}>
                <Text style={styles.lanceValue}>R$ {lance.valor.toFixed(2)}</Text>
                <Text style={styles.lanceDate}>
                  {new Date(lance.data).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            ))
          )}
        </View>

        <FormularioLance
          idLeilao={leilao.id}
          valorAtual={valorAtual}
          onLanceRealizado={handleLanceRealizado}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#EEB16C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  image: {
    margin: 16,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  priceContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EEB16C',
    marginBottom: 4,
  },
  bidsCount: {
    fontSize: 12,
    color: '#999',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  lancesContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  lancesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  noBidsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  lanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EEB16C',
  },
  lanceDate: {
    fontSize: 12,
    color: '#999',
  },
}); 