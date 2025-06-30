import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { AgendaFornecedor } from '../components/Agenda/AgendaFornecedor';
import { useGetToken } from '../hooks/useGetToken';
import { AgendaUsuario } from '../components/Agenda/AgendaUsuario';


export const AgendaScreen = () => {
    const token = useGetToken();

    // Se o token ainda está carregando, mostra loading
    if (token === undefined) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#EEB16C" />
            </View>
        );
    }

    return (
        token?.role === 'Fornecedor' ? (
            <AgendaFornecedor />
          ) : (
            <AgendaUsuario />
          )
    )
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

