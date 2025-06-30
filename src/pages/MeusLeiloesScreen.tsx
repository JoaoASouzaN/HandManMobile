import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LeilaoService } from '../services/LeilaoService';
import { Leilao } from '../types/leilao';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const MeusLeiloesScreen: React.FC = () => {
  const [leiloes, setLeiloes] = useState<Leilao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const buscarMeusLeiloes = async () => {
    try {
      const data = await LeilaoService.buscarMeusLeiloes();
      setLeiloes(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar seus leilões');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await buscarMeusLeiloes();
    setRefreshing(false);
  };

  useEffect(() => {
    buscarMeusLeiloes();
  }, []);

  const handleLeilaoPress = (leilao: Leilao) => {
    navigation.navigate('LeilaoDetalhes', { id: leilao.id });
  };

  const renderLeilaoItem = ({ item }: { item: Leilao }) => {
    const valorAtual = item.lances.length > 0
      ? item.lances[item.lances.length - 1].valor
      : item.valorDesejado;

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

    return (
      <TouchableOpacity
        style={styles.leilaoItem}
        onPress={() => handleLeilaoPress(item)}
      >
        <View style={styles.leilaoHeader}>
          <Text style={styles.leilaoTitle} numberOfLines={2}>
            {item.titulo}
          </Text>
          <View style={styles.statusContainer}>
            <Icon name="gavel" size={16} color="#EEB16C" />
            <Text style={styles.statusText}>Ativo</Text>
          </View>
        </View>

        <View style={styles.leilaoInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Valor atual:</Text>
            <Text style={styles.infoValue}>R$ {valorAtual.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lances:</Text>
            <Text style={styles.infoValue}>{item.lances.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Encerra:</Text>
            <Text style={styles.infoValue}>
              {tempoRestante(item.prazoLimite || item.tempoFinalizacao || item.data_final || '')}
            </Text>
          </View>
        </View>

        <View style={styles.leilaoFooter}>
          <Text style={styles.categoria}>{item.categoria}</Text>
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>Ver Detalhes</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EEB16C" />
        <Text style={styles.loadingText}>Carregando seus leilões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Meus Leilões</Text>
      </View>

      <FlatList
        data={leiloes}
        keyExtractor={(item) => item.id}
        renderItem={renderLeilaoItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EEB16C']}
            tintColor="#EEB16C"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="gavel" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              Você ainda não criou nenhum leilão
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                navigation.navigate('CriarLeilao');
              }}
            >
              <Text style={styles.createButtonText}>Criar Primeiro Leilão</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  leilaoItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leilaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leilaoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#EEB16C',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  leilaoInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  leilaoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  categoria: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewButton: {
    backgroundColor: '#EEB16C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#EEB16C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 