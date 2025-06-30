import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LeilaoService } from '../services/LeilaoService';
import { CriarLeilaoData } from '../types/leilao';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CATEGORIAS = [
  'Limpeza',
  'Jardinagem',
  'Elétrica',
  'Encanamento',
  'Carpintaria',
  'Pintura',
  'Mudanças',
  'Outros',
];

export const CriarLeilaoScreen: React.FC = () => {
  const [formData, setFormData] = useState<CriarLeilaoData>({
    titulo: '',
    descricao: '',
    valorDesejado: 0,
    detalhes: '',
    prazoLimite: '',
    categoria: '',
  });
  const [loading, setLoading] = useState(false);
  const [showCategorias, setShowCategorias] = useState(false);
  const navigation = useNavigation<any>();

  const handleInputChange = (field: keyof CriarLeilaoData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validações
    if (!formData.titulo.trim()) {
      Alert.alert('Erro', 'Por favor, insira um título');
      return;
    }
    if (!formData.descricao.trim()) {
      Alert.alert('Erro', 'Por favor, insira uma descrição');
      return;
    }
    if (formData.valorDesejado <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return;
    }
    if (!formData.categoria) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria');
      return;
    }
    if (!formData.prazoLimite) {
      Alert.alert('Erro', 'Por favor, insira um prazo limite');
      return;
    }

    setLoading(true);
    try {
      await LeilaoService.criarLeilao(formData);
      Alert.alert('Sucesso', 'Leilão criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar leilão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Leilão</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Informações Básicas</Text>

        <TextInput
          style={styles.input}
          placeholder="Título do leilão"
          value={formData.titulo}
          onChangeText={(value) => handleInputChange('titulo', value)}
          maxLength={100}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descrição do serviço"
          value={formData.descricao}
          onChangeText={(value) => handleInputChange('descricao', value)}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <TextInput
          style={styles.input}
          placeholder="Valor desejado (R$)"
          value={formData.valorDesejado > 0 ? formData.valorDesejado.toString() : ''}
          onChangeText={(value) => handleInputChange('valorDesejado', parseFloat(value) || 0)}
          keyboardType="numeric"
        />

        <View style={styles.categoriaContainer}>
          <TouchableOpacity
            style={styles.categoriaButton}
            onPress={() => setShowCategorias(!showCategorias)}
          >
            <Text style={[styles.categoriaText, !formData.categoria && styles.placeholder]}>
              {formData.categoria || 'Selecione uma categoria'}
            </Text>
            <Icon name={showCategorias ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
          </TouchableOpacity>

          {showCategorias && (
            <View style={styles.categoriasList}>
              {CATEGORIAS.map((categoria) => (
                <TouchableOpacity
                  key={categoria}
                  style={styles.categoriaItem}
                  onPress={() => {
                    handleInputChange('categoria', categoria);
                    setShowCategorias(false);
                  }}
                >
                  <Text style={styles.categoriaItemText}>{categoria}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Prazo limite (YYYY-MM-DD)"
          value={formData.prazoLimite}
          onChangeText={(value) => handleInputChange('prazoLimite', value)}
        />

        <Text style={styles.sectionTitle}>Detalhes Adicionais</Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Detalhes adicionais sobre o serviço"
          value={formData.detalhes}
          onChangeText={(value) => handleInputChange('detalhes', value)}
          multiline
          numberOfLines={4}
          maxLength={1000}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Criar Leilão</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriaContainer: {
    marginBottom: 16,
  },
  categoriaButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriaText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  categoriasList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  categoriaItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriaItemText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#EEB16C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 