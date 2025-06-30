import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { typeFornecedor } from "../model/Fornecedor";
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import ImagemPadrao from '../assets/pexels-photo-1216589.webp'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { FornecedorStackParamList } from '../navigation/FornecedorStackNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Carrosel } from './Carrosel';

interface DetalhesFornecedorProps {
    fornecedor: typeFornecedor | undefined;
}

type ExibirFornecedorScreenRouteProp = RouteProp<FornecedorStackParamList, 'ExibirFornecedorScreen'>;
type ExibirFornecedorScreenNavigationProp = NativeStackNavigationProp<FornecedorStackParamList, 'ExibirFornecedorScreen'>;

export const DetalhesFornecedor = ({ fornecedor }: DetalhesFornecedorProps) => {
    const navigation = useNavigation<ExibirFornecedorScreenNavigationProp>();
    const route = useRoute<ExibirFornecedorScreenRouteProp>();
    console.log(route);

    const handleVoltar = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    { name: 'Serviços' }
                ],
            })
        );
    };

    const handleAgendar = () => {
        navigation.navigate('LocalizacaoScreen', { 
            fornecedorId: fornecedor?.id_fornecedor 
        });
    };

    const dadosFornecedor = fornecedor;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleVoltar} >
                    <Ionicons name="arrow-back" size={24} color="#AC5906" />
                </TouchableOpacity>
                <Text style={styles.title}>Detalhes</Text>
                <TouchableOpacity>
                    <MaterialCommunityIcons name="heart-outline" size={24} color="#AC5906" />
                </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
                <Image
                    source={dadosFornecedor?.imagemIlustrativa ? { uri: dadosFornecedor.imagemIlustrativa } : ImagemPadrao}
                    style={styles.fornecedorImage}
                />
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.fornecedorNome}>{dadosFornecedor?.nome}</Text>
                <View style={styles.ratingContainer}>
                    <Text style={styles.fornecedorValor}>R$ {dadosFornecedor?.valor} a hora</Text>
                    <View style={styles.starRating}>
                        <Feather name="star" size={16} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingText}>{dadosFornecedor?.media_avaliacoes}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.contactButtonBrown}
                onPress={handleAgendar}
            >
                <Text style={styles.contactButtonBrownText}>Entre em contato</Text>
            </TouchableOpacity>

            <View style={styles.especialidadesSection}>
                <Text style={styles.sectionTitle}>Especialidades:</Text>
                <Text style={styles.especialidadesText}>{dadosFornecedor?.sub_descricao}</Text>
            </View>
            {dadosFornecedor?.imagemServicos && dadosFornecedor?.imagemServicos.length > 0 && (
                <Carrosel imagens={dadosFornecedor?.imagemServicos}/>
            )}
            
            <View style={styles.servicesOfferedSection}>
                <View style={styles.servicesOfferedCard}>
                    <Text style={styles.servicesOfferedTitle}>Este serviço é oferecido por um profissional.</Text>
                    {dadosFornecedor?.categoria_servico && Array.isArray(dadosFornecedor.categoria_servico) && dadosFornecedor.categoria_servico.map((servico, index) => (
                        <View key={index} style={styles.serviceItem}>
                            <Text style={styles.serviceItemText}>{servico}</Text>
                        </View>
                    ))}
                </View>
            </View>


            <View style={styles.aboutMeSection}>
                <Text style={styles.sectionTitle}>Sobre mim:</Text>
                <Text style={styles.aboutMeText}>{dadosFornecedor?.descricao}</Text>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDF8F2',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        paddingTop: 40,
        backgroundColor: '#FDF8F2',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#AC5906',
    },
    imageContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    fornecedorImage: {
        width: 250,
        height: 250,
        borderRadius: 150,
    },
    infoSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    fornecedorNome: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fornecedorValor: {
        fontSize: 16,
        marginBottom: 10,
        color: '#666',
    },
    starRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 16,
        color: '#444',
        fontWeight: '500',
    },
    contactButtonGreen: {
        marginHorizontal: 20,
        backgroundColor: '#8FBC8F',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    contactButtonGreenText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    especialidadesSection: {
        paddingHorizontal: 20,
        marginBottom: 40,
        marginTop: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#AC5906',
        marginBottom: 10,
    },
    especialidadesText: {
        fontSize: 16,
        color: '#666',
    },
    contactButtonBrown: {
        marginHorizontal: 20,
        backgroundColor: '#AC5906',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    contactButtonBrownText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    servicesOfferedSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    servicesOfferedCard: {
        backgroundColor: '#FDF2E9',
        borderRadius: 8,
        padding: 15,
        elevation: 1,
    },
    servicesOfferedTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#AC5906',
        marginBottom: 10,
        textAlign: 'center',
    },
    serviceItem: {
        borderWidth: 1,
        borderColor: '#AC5906',
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginBottom: 10,
        alignItems: 'center',
    },
    serviceItemText: {
        fontSize: 15,
        color: '#AC5906',
    },
    aboutMeSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    aboutMeText: {
        fontSize: 16,
        color: '#666',
    },
});