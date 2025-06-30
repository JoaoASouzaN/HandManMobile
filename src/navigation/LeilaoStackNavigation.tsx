import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeiloesScreen } from '../pages/LeiloesScreen';
import { LeilaoDetalhesScreen } from '../pages/LeilaoDetalhesScreen';
import { CriarLeilaoScreen } from '../pages/CriarLeilaoScreen';
import { MeusLeiloesScreen } from '../pages/MeusLeiloesScreen';

export type LeilaoStackParamList = {
    LeiloesList: undefined;
    LeilaoDetalhes: { id: string };
    CriarLeilao: undefined;
    MeusLeiloes: undefined;
};

const Stack = createNativeStackNavigator<LeilaoStackParamList>();

export const LeilaoStackNavigation = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen name="LeiloesList" component={LeiloesScreen} />
            <Stack.Screen name="LeilaoDetalhes" component={LeilaoDetalhesScreen} />
            <Stack.Screen name="CriarLeilao" component={CriarLeilaoScreen} />
            <Stack.Screen name="MeusLeiloes" component={MeusLeiloesScreen} />
        </Stack.Navigator>
    );
}; 