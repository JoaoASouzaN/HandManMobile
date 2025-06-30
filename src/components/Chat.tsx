import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Keyboard,
} from 'react-native';

import { io, Socket } from 'socket.io-client';
import { useGetToken } from '../hooks/useGetToken';
import axios from 'axios';
import { API_URL } from '../constants/ApiUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import imagemDefault from '../assets/carpintaria.png';

interface Mensagem {
    _id: string;
    remetenteId: string;
    destinatarioId: string;
    nomeDestinatario: string;
    texto: string;
    dataEnvio: string;
}

interface ChatProps {
    idFornecedor: string;
}

interface Usuario {
    id: string;
    picture: string;
    nome: string;
}

const Chat: React.FC<ChatProps> = ({ idFornecedor }) => {
    const [mensagem, setMensagem] = useState('');
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [destinatarioId, setDestinatarioId] = useState(idFornecedor);
    console.log(setDestinatarioId)
    const flatListRef = useRef<FlatList>(null);
    const socketRef = useRef<Socket | null>(null);

    const token = useGetToken();
    const nomeRemetente = token?.nome;
    const remetenteId = token?.id;

    const buscarConversas = async () => {
        try {
            const tokenVerify = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`${API_URL}/mensagem/buscar-usuarios-conversas/${token?.id}`, {
                headers: {
                    Authorization: tokenVerify
                }
            });
            setUsuarios(response.data);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        buscarConversas();
    }, []);

    useEffect(() => {
        const socket = io(`${API_URL}`);
        socketRef.current = socket;

        if (remetenteId) {
            socket.emit('join', remetenteId);
        }

        socket.on('nova_mensagem', (msg: Mensagem) => {
            setMensagens((prev) => [...prev, msg]);
        });

        return () => {
            socket.disconnect();
        };
    }, [remetenteId]);

    useEffect(() => {
        const fetchHistorico = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/mensagem/conversa/${remetenteId}/${destinatarioId}`
                );
                if (!response.ok) throw new Error('Erro ao buscar histórico');

                const historico: Mensagem[] = await response.json();
                setMensagens(historico);
            } catch (error) {
                console.error('Erro ao carregar histórico de mensagens:', error);
            }
        };

        if (remetenteId && destinatarioId) {
            fetchHistorico();
        }
    }, [remetenteId, destinatarioId]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }
        );

        return () => {
            keyboardDidShowListener.remove();
        };
    }, []);

    const enviarMensagem = () => {
        if (!remetenteId || !destinatarioId || !mensagem.trim()) return;

        socketRef.current?.emit('mensagem', {
            remetenteId,
            destinatarioId,
            nomeDestinatario: nomeRemetente,
            texto: mensagem,
        });

        setMensagem('');
    };

    const formatarData = (dataISO: string) => {
        const data = new Date(dataISO);
        return data.toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    };

    const renderMensagem = ({ item: msg }: { item: Mensagem }) => (
        <View style={[
            styles.mensagemContainer,
            msg.remetenteId === remetenteId ? styles.mensagemEnviada : styles.mensagemRecebida
        ]}>
            <View style={styles.mensagemHeader}>
                <Image
                    source={
                        msg.remetenteId === token?.id
                            ? { uri: token?.imagemPerfil || imagemDefault }
                            : { uri: usuarios.find(u => u.id === msg.remetenteId)?.picture || imagemDefault }
                    }
                    style={styles.avatar}
                />
                <Text style={styles.nomeRemetente}>
                    {msg.remetenteId === remetenteId ? 'Você' : msg.nomeDestinatario}
                </Text>
            </View>
            <View style={styles.mensagemBalao}>
                <Text style={styles.mensagemTexto}>{msg.texto}</Text>
            </View>
            <Text style={styles.mensagemData}>{formatarData(msg.dataEnvio)}</Text>
        </View>
    );
    //possivel impementação para fornecedor para mostrar
    /*
    const renderUsuario = ({ item: usu }: { item: Usuario }) => (
        <TouchableOpacity
            style={[
                styles.usuarioItem,
                destinatarioId === usu.id && styles.usuarioSelecionado
            ]}
            onPress={() => {
                setDestinatarioId(usu.id);
                setMensagens([]);
            }}
        >
            <Image
                source={{ uri: usu.picture || 'https://via.placeholder.com/50' }}
                style={styles.avatar}
            />
            <Text style={styles.nomeUsuario}>{usu.nome}</Text>
        </TouchableOpacity>
    );
    */
    return (
        <View style={styles.mainContainer}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.tituloSecao}>Chat</Text>
                    </View>
                    
                    <FlatList
                        ref={flatListRef}
                        data={mensagens}
                        renderItem={renderMensagem}
                        keyExtractor={(item) => item._id}
                        style={styles.mensagensLista}
                        contentContainerStyle={styles.mensagensContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                        keyboardShouldPersistTaps="handled"
                    />

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Digite sua mensagem..."
                            value={mensagem}
                            onChangeText={setMensagem}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={styles.botaoEnviar}
                            onPress={enviarMensagem}
                        >
                            <Text style={styles.botaoEnviarTexto}>Enviar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    tituloSecao: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    mensagensLista: {
        flex: 1,
    },
    mensagensContent: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        flexGrow: 1,
    },
    mensagemContainer: {
        marginVertical: 5,
        maxWidth: '80%',
    },
    mensagemEnviada: {
        alignSelf: 'flex-end',
    },
    mensagemRecebida: {
        alignSelf: 'flex-start',
    },
    mensagemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    nomeRemetente: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 5,
        color: '#666',
    },
    mensagemBalao: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    mensagemTexto: {
        fontSize: 16,
        color: '#333',
    },
    mensagemData: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        maxHeight: 100,
        backgroundColor: '#f9f9f9',
    },
    botaoEnviar: {
        backgroundColor: '#A75C00',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    botaoEnviarTexto: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 5,
    },
    usuarioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    usuarioSelecionado: {
        backgroundColor: '#f0f0f0',
    },
    nomeUsuario: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default Chat; 