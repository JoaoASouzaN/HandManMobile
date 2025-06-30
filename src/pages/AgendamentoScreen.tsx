import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FornecedorStackParamList } from '../navigation/FornecedorStackNavigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { FornecedorService } from '../services/FornecedoresService';
import { AgendamentoService } from '../services/AgendamentoServico';

import { Loading } from '../components/Loading';
import DropDownPicker from 'react-native-dropdown-picker';

interface ImagemType {
    uri: string;
    type?: string;
    fileName?: string;
}

type AgendamentoScreenRouteProp = RouteProp<FornecedorStackParamList, 'AgendamentoScreen'>;
type AgendamentoScreenNavigationProp = NativeStackNavigationProp<FornecedorStackParamList, 'AgendamentoScreen'>;

export const AgendamentoScreen = () => {
    const navigation = useNavigation<AgendamentoScreenNavigationProp>();
    const route = useRoute<AgendamentoScreenRouteProp>();

    const { fornecedorId } = route.params;

    const [data, setData] = useState(new Date());
    const [horario, setHorario] = useState('');
    const [endereco, setEndereco] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [open,setOpen] = useState(false);
    const [imagem, setImagem] = useState<ImagemType | undefined>(undefined);

    const [fornecedor, setFornecedor] = useState<{ label: string; value: string }[]>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('');

    const handleConfirmar = async () => {
        if (!categoriaSelecionada || !horario || !endereco || !fornecedorId) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);
        try {
            // Criar data e horário combinados
            const [hora, minuto] = horario.split(':').map(Number);
            const dataHora = new Date(data);
            dataHora.setHours(hora, minuto, 0, 0);

            // Verificar conflitos de horário
            try {
                const conflitos = await AgendamentoService.verificarConflitosHorario(
                    fornecedorId,
                    data,
                    dataHora
                );

                if (conflitos.hasConflict) {
                    Alert.alert(
                        'Conflito de Horário',
                        conflitos.message || 'Você já tem um compromisso agendado neste horário.',
                        [{ text: 'OK' }]
                    );
                    setLoading(false);
                    return;
                }
            } catch (conflitoError: any) {
                if (conflitoError.response?.status === 409) {
                    Alert.alert(
                        'Conflito de Horário',
                        conflitoError.response.data.error || 'Conflito de horário detectado!',
                        [{ text: 'OK' }]
                    );
                    setLoading(false);
                    return;
                }
                // Se não for erro de conflito, continua com o agendamento
                console.warn('Erro ao verificar conflitos:', conflitoError);
            }

            navigation.navigate('ConfirmacaoScreen', {
                fornecedorId,
                data: data.toLocaleDateString(),
                horario,
                endereco,
                imagem,
                categoria: categoriaSelecionada,
            });
        } catch (error: any) {
            console.error('Erro ao verificar conflitos:', error);
            Alert.alert('Erro', 'Erro ao verificar disponibilidade. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleGetFornecedor = async () => {
        setLoading(true);
        try {
            const fornecedor = await FornecedorService.getFornecedorPorId(fornecedorId);
            
            if (!fornecedor) return;
    
            const categoriasFormatadas = fornecedor.categoria_servico && Array.isArray(fornecedor.categoria_servico) 
                ? fornecedor.categoria_servico.map((cat: string) => ({
                    label: cat,
                    value: cat,
                }))
                : [];
    
            setFornecedor(categoriasFormatadas);
    
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        handleGetFornecedor();
    }, [fornecedorId])

    const handleImageUpload = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert("Erro", "Permissão necessária para acessar a galeria de imagens");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
                const selectedImage = result.assets[0];
                setImagem({
                    uri: selectedImage.uri,
                    type: 'image/jpeg',
                    fileName: selectedImage.uri.split('/').pop() || 'imagem.jpg'
                });
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            Alert.alert('Erro', 'Não foi possível selecionar a imagem');
        }
    };

    if (loading) {
        return <Loading />;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Agendar Serviço</Text>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Categoria</Text>
                <DropDownPicker
                    open={open}
                    value={categoriaSelecionada}
                    items={fornecedor}
                    setOpen={setOpen}
                    setValue={setCategoriaSelecionada}
                    setItems={setFornecedor}
                    listMode="SCROLLVIEW"
                    placeholder="Selecione uma categoria"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Data</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text>{data.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={data}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) {
                                setData(selectedDate);
                            }
                        }}
                    />
                )}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Horário</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 14:00"
                    value={horario}
                    onChangeText={setHorario}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Descrição</Text>
                <TextInput
                    style={[styles.input, styles.addressInput]}
                    placeholder="Digite a descrição do serviço"
                    value={endereco}
                    onChangeText={setEndereco}
                    multiline
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Imagem</Text>
                <TouchableOpacity style={styles.imageButton} onPress={handleImageUpload}>
                    <Text>Upload de Imagem</Text>
                </TouchableOpacity>
                {imagem && <Image source={{ uri: imagem.uri }} style={styles.image} />}
            </View>

            <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmar}
            >
                <Text style={styles.confirmButtonText}>Confirmar Agendamento</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#A75C00',
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    addressInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateButton: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    imageButton: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    image: {
        width: 100,
        height: 100,
        marginTop: 10,
    },
    confirmButton: {
        backgroundColor: '#AC5906',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 