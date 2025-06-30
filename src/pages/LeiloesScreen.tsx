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
  Dimensions,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { LeilaoCard } from '../components/leilao/LeilaoCard';
import { LeilaoService } from '../services/LeilaoService';
import { Leilao } from '../types/leilao';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.85; // 85% da largura da tela
const CARD_SPACING = 16;

export const LeiloesScreen: React.FC = () => {
  const [leiloes, setLeiloes] = useState<Leilao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigation = useNavigation<any>();

  const buscarLeiloes = async () => {
    try {
      const data = await LeilaoService.buscarLeiloes();
      setLeiloes(data);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao carregar leilões');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await buscarLeiloes();
    setRefreshing(false);
  };

  useEffect(() => {
    buscarLeiloes();
  }, []);

  const handleLeilaoPress = (leilao: Leilao) => {
    navigation.navigate('LeilaoDetalhes', { id: leilao.id });
  };

  const handleCriarLeilao = () => {
    navigation.navigate('CriarLeilao');
  };

  const handleMeusLeiloes = () => {
    navigation.navigate('MeusLeiloes');
  };

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EEB16C" />
        <Text style={styles.loadingText}>Carregando leilões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leilões Disponíveis</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMeusLeiloes}
          >
            <Icon name="account" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCriarLeilao}
          >
            <Icon name="plus" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {leiloes.length > 0 ? (
        <View style={styles.carouselContainer}>
          <FlatList
            data={leiloes}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.cardWrapper}>
                <LeilaoCard
                  leilao={item}
                  onPress={() => handleLeilaoPress(item)}
                />
              </View>
            )}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#EEB16C']}
                tintColor="#EEB16C"
              />
            }
          />
          
          {/* Indicadores de página */}
          <View style={styles.paginationContainer}>
            {leiloes && Array.isArray(leiloes) && leiloes.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhum leilão disponível no momento
          </Text>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
    padding: 8,
  },
  carouselContainer: {
    flex: 1,
    paddingVertical: 20,
  },
  carouselContent: {
    paddingHorizontal: CARD_SPACING / 2,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_SPACING / 2,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#EEB16C',
    width: 12,
    height: 12,
    borderRadius: 6,
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
  },
}); 