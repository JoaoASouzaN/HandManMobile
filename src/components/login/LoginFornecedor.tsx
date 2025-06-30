import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ImageBackground,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { useBiometric } from '../../hooks/useBiometric';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

interface InputWithLabelProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address';
    editable?: boolean;
}

const InputWithLabel: React.FC<InputWithLabelProps> = ({
    label,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType = 'default',
    editable = true,
}) => {
    return (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                editable={editable}
            />
        </View>
    );
};

interface LoginScreenProps {
    onBack: () => void;
    onNavigate: (screen: string) => void;
    currentScreen: string;
}

const LoginFornecedor: React.FC<LoginScreenProps> = ({ onBack, onNavigate, currentScreen }) => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
    const { loginFornecedor } = useAuth();
    const { isBiometricAvailable, authenticateWithBiometrics, checkBiometricAvailability } = useBiometric();
    console.log(hasStoredCredentials)

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                console.log('=== Iniciando verificação de autenticação ===');
                // Força uma nova verificação de biometria
                await checkBiometricAvailability();
                console.log('Status da biometria após verificação:', isBiometricAvailable);
                
                // Verifica credenciais salvas
                const savedEmail = await AsyncStorage.getItem('lastLoginEmailFornecedor');
                const savedPassword = await AsyncStorage.getItem('lastLoginPasswordFornecedor');
                
                console.log('=== Status das credenciais ===');
                console.log('Email salvo:', savedEmail ? 'Sim' : 'Não');
                console.log('Senha salva:', savedPassword ? 'Sim' : 'Não');
                console.log('Biometria disponível:', isBiometricAvailable);

                // Apenas marca que existem credenciais, mas não as exibe
                setHasStoredCredentials(!!savedEmail && !!savedPassword);

                if (savedEmail && savedPassword && isBiometricAvailable) {
                    console.log('Iniciando autenticação biométrica...');
                    handleBiometricLogin();
                } else {
                    console.log('Condições para biometria não atendidas');
                    if (!isBiometricAvailable) console.log('Biometria não disponível');
                    if (!savedEmail || !savedPassword) console.log('Credenciais não encontradas');
                }
            } catch (error) {
                console.error('Erro durante a inicialização:', error);
            }
        };

        initializeAuth();
    }, [isBiometricAvailable]);

    const handleBiometricLogin = async () => {
        if (!isBiometricAvailable) {
            console.log('Tentativa de autenticação biométrica quando não disponível');
            return;
        }

        try {
            console.log('=== Iniciando login biométrico ===');
            setLoading(true);

            const success = await authenticateWithBiometrics();
            console.log('Resultado da autenticação biométrica:', success);
            
            if (success) {
                const savedEmail = await AsyncStorage.getItem('lastLoginEmailFornecedor');
                const savedPassword = await AsyncStorage.getItem('lastLoginPasswordFornecedor');
                
                if (savedEmail && savedPassword) {
                    console.log('Tentando login com credenciais salvas');
                    const result = await loginFornecedor(savedEmail, savedPassword);
                    
                    if (result.success) {
                        console.log('Login biométrico bem-sucedido!');
                        onNavigate('MainApp');
                    } else {
                        console.log('Falha no login com credenciais salvas:', result.message);
                        Alert.alert('Erro', 'Credenciais inválidas. Por favor, faça login manualmente.');
                        // Limpa as credenciais inválidas
                        await AsyncStorage.removeItem('lastLoginEmailFornecedor');
                        await AsyncStorage.removeItem('lastLoginPasswordFornecedor');
                        setHasStoredCredentials(false);
                    }
                }
            } else {
                console.log('Autenticação biométrica cancelada ou falhou');
            }
        } catch (error) {
            console.error('Erro durante login biométrico:', error);
            Alert.alert('Erro', 'Ocorreu um erro na autenticação biométrica. Por favor, faça login manualmente.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !senha) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }

        setLoading(true);
        try {
            console.log('=== Iniciando login manual ===');
            const result = await loginFornecedor(email, senha);

            if (result.success) {
                console.log('Login manual bem-sucedido, salvando credenciais');
                await AsyncStorage.setItem('lastLoginEmailFornecedor', email);
                await AsyncStorage.setItem('lastLoginPasswordFornecedor', senha);
                setHasStoredCredentials(true);
                
                Alert.alert('Login realizado com sucesso!');
                onNavigate('MainApp');
            } else {
                console.log('Falha no login manual:', result.message);
                Alert.alert('Erro de login', result.message);
            }
        } catch (error) {
            console.error('Erro durante login manual:', error);
            Alert.alert('Erro', 'Ocorreu um erro ao tentar fazer login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView 
            contentContainerStyle={styles.container} 
            showsVerticalScrollIndicator={false}
        >
            <LinearGradient
                colors={['#f8f9fa', '#e9ecef']}
                style={styles.gradientBackground}
            >
                <View style={styles.headerContainer}>
                    <Icon name="store" size={40} color="#2c3e50" style={styles.headerIcon} />
                    <Text style={styles.title}>HANDYMAN</Text>
                    <Text style={styles.subtitle}>Área do Fornecedor</Text>
                    <Text style={styles.description}>Gerencie seus serviços e clientes</Text>
                </View>

                <View style={styles.card}>
                    <InputWithLabel
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        editable={!loading}
                    />
                    
                    <View style={styles.passwordContainer}>
                        <InputWithLabel
                            label="Senha"
                            value={senha}
                            onChangeText={setSenha}
                            secureTextEntry
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.loginButtonText}>Entrar</Text>
                        )}
                    </TouchableOpacity>

                    {/* Botão de Login Biométrico */}
                    {hasStoredCredentials && isBiometricAvailable && (
                        <TouchableOpacity
                            style={[styles.biometricButton, loading && styles.buttonDisabled]}
                            onPress={handleBiometricLogin}
                            disabled={loading}
                        >
                            <Icon name="fingerprint" size={24} color="#FFFFFF" style={styles.biometricIcon} />
                            <Text style={styles.biometricButtonText}>Entrar com Digital</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Não tem uma conta? </Text>
                        <TouchableOpacity onPress={() => onNavigate('CadastroFornecedor')}>
                            <Text style={styles.registerLink}>Cadastre-se como Fornecedor</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    gradientBackground: {
        flex: 1,
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    headerIcon: {
        marginBottom: 10,
        color: '#B54708',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#B54708',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 24,
        color: '#B54708',
        textAlign: 'center',
        marginBottom: 5,
    },
    description: {
        fontSize: 16,
        color: '#B54708',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#EEB16C',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#FFE1C5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#FFD4A3',
    },
    passwordContainer: {
        marginBottom: 20,
    },
    loginButton: {
        backgroundColor: '#7A2D00',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        paddingHorizontal: 10,
    },
    registerText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
    },
    registerLink: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    biometricButton: {
        backgroundColor: '#7A2D00',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    biometricIcon: {
        marginRight: 10,
    },
    biometricButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default LoginFornecedor;