import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LeilaoImage } from './LeilaoImage';
import { Leilao } from '../../types/leilao';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeilaoCardProps {
  leilao: Leilao;
  onPress: () => void;
}

export const LeilaoCard: React.FC<LeilaoCardProps> = ({ leilao, onPress }) => {
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

  const valorAtual = leilao.lances.length > 0
    ? leilao.lances[leilao.lances.length - 1].valor
    : leilao.valorDesejado;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <LeilaoImage
        src={leilao.imagemCapa || leilao.imagem}
        alt={leilao.titulo}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {leilao.titulo}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {leilao.descricao}
        </Text>
        <View style={styles.infoContainer}>
          <Text style={styles.price}>
            R$ {valorAtual.toFixed(2)}
          </Text>
          <Text style={styles.bids}>
            {leilao.lances.length} lance{leilao.lances.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.timeLeft}>
          Encerra {tempoRestante(leilao.prazoLimite || leilao.tempoFinalizacao || leilao.data_final || '')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
  },
  image: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EEB16C',
  },
  bids: {
    fontSize: 12,
    color: '#999',
  },
  timeLeft: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
}); 