import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../../navigation/TabNavigation';
import { LeilaoService } from '../../services/LeilaoService';
import { Leilao } from '../../types/leilao';
import { LeilaoImage } from './LeilaoImage';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.75; // 75% da largura da tela
const CARD_SPACING = 12;

type LeilaoCarouselNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Leilões'>;

export const LeilaoCarousel: React.FC = () => {
  const [leiloes, setLeiloes] = useState<Leilao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigation = useNavigation<LeilaoCarouselNavigationProp>();

  const buscarLeiloes = async () => {
    try {
      console.log('Iniciando busca de leilões...');
      const data = await LeilaoService.buscarLeiloes();
      console.log('Leilões recebidos:', data);
      // Pegar apenas os primeiros 5 leilões para o carrossel
      setLeiloes(data.slice(0, 5));
      console.log('Leilões definidos no estado:', data.slice(0, 5));
    } catch (error: any) {
      console.error('Erro ao buscar leilões:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarLeiloes();
  }, []);

  const handleLeilaoPress = (leilao: Leilao) => {
    console.log('Tentando navegar para detalhes do leilão:', leilao.id);
    try {
      navigation.navigate('Leilões', {
        screen: 'LeilaoDetalhes',
        params: { id: leilao.id }
      });
      console.log('Navegação executada com sucesso');
    } catch (error) {
      console.error('Erro na navegação:', error);
    }
  };

  const handleVerTodos = () => {
    console.log('Tentando navegar para lista de leilões');
    try {
      navigation.navigate('Leilões', {
        screen: 'LeiloesList',
        params: undefined
      });
      console.log('Navegação para lista executada com sucesso');
    } catch (error) {
      console.error('Erro na navegação para lista:', error);
    }
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

  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderLeilaoCard = ({ item: leilao }: { item: Leilao }) => {
    console.log('Renderizando card do leilão:', leilao.id, leilao.titulo);
    const valorAtual = leilao.lances.length > 0
      ? leilao.lances[leilao.lances.length - 1].valor
      : leilao.valorDesejado;

    return (
      <TouchableOpacity
        style={styles.leilaoCard}
        onPress={() => {
          console.log('Card clicado:', leilao.id);
          handleLeilaoPress(leilao);
        }}
      >
        <LeilaoImage
          src={leilao.imagemCapa || leilao.imagem}
          alt={leilao.titulo}
          style={styles.leilaoImage}
        />
        <View style={styles.leilaoContent}>
          <Text style={styles.leilaoTitle} numberOfLines={1}>
            {leilao.titulo}
          </Text>
          <Text style={styles.leilaoDescription} numberOfLines={2}>
            {leilao.descricao}
          </Text>
          <View style={styles.leilaoInfo}>
            <Text style={styles.leilaoPrice}>
              R$ {valorAtual.toFixed(2)}
            </Text>
            <Text style={styles.leilaoTime}>
              {tempoRestante(leilao.prazoLimite || leilao.tempoFinalizacao || leilao.data_final || '')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || leiloes.length === 0) {
    console.log('LeilaoCarousel: loading ou sem leilões. Loading:', loading, 'Leilões:', leiloes.length);
    return null; // Não mostrar nada se estiver carregando ou não houver leilões
  }

  console.log('LeilaoCarousel: renderizando com', leiloes.length, 'leilões');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="gavel" size={24} color="#EEB16C" />
          <Text style={styles.title}>Leilões em Destaque</Text>
        </View>
        <TouchableOpacity style={styles.verTodosButton} onPress={handleVerTodos}>
          <Text style={styles.verTodosText}>Ver Todos</Text>
          <Icon name="chevron-right" size={16} color="#EEB16C" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={leiloes}
        keyExtractor={(item) => item.id}
        renderItem={renderLeilaoCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContainer}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Indicadores de página */}
      {leiloes && Array.isArray(leiloes) && leiloes.length > 1 && (
        <View style={styles.paginationContainer}>
          {leiloes.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  verTodosButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verTodosText: {
    fontSize: 14,
    color: '#EEB16C',
    fontWeight: 'bold',
    marginRight: 4,
  },
  carouselContainer: {
    marginBottom: 8,
  },
  leilaoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    overflow: 'hidden',
    width: CARD_WIDTH,
    marginHorizontal: CARD_SPACING / 2,
  },
  leilaoImage: {
    height: 120,
  },
  leilaoContent: {
    padding: 12,
  },
  leilaoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  leilaoDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  leilaoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leilaoPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EEB16C',
  },
  leilaoTime: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#EEB16C',
  },
}); 