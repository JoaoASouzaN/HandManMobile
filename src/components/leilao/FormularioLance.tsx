import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LeilaoService } from '../../services/LeilaoService';
import { useGetToken } from '../../hooks/useGetToken';

interface FormularioLanceProps {
  idLeilao: string;
  valorAtual: number;
  onLanceRealizado?: () => void;
}

export const FormularioLance: React.FC<FormularioLanceProps> = ({
  idLeilao,
  valorAtual,
  onLanceRealizado,
}) => {
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);
  const token = useGetToken();

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Erro', 'Você precisa estar logado para fazer um lance');
      return;
    }

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return;
    }

    if (valorNumerico <= valorAtual) {
      Alert.alert('Erro', 'O lance deve ser maior que o valor atual');
      return;
    }

    setLoading(true);
    try {
      await LeilaoService.fazerLance(idLeilao, { valor: valorNumerico });
      Alert.alert('Sucesso', 'Lance realizado com sucesso!');
      setValor('');
      onLanceRealizado?.();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao fazer lance');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Faça login para participar deste leilão
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fazer Lance</Text>
      <Text style={styles.currentPrice}>
        Valor atual: R$ {valorAtual.toFixed(2)}
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Digite o valor do seu lance"
        value={valor}
        onChangeText={setValor}
        keyboardType="numeric"
        editable={!loading}
      />
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Fazer Lance</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    color: '#EEB16C',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#EEB16C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 