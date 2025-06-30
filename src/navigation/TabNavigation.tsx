import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../pages/HomeScrenn';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PerfilScreen from '../pages/PerfilScreen';
import { ServicoScreen } from '../pages/ServicoScreen';
import { FornecedorStackParamList,FornecedorStackNavigation } from './FornecedorStackNavigation';
import { LeilaoStackNavigation, LeilaoStackParamList } from './LeilaoStackNavigation';
import { AgendaScreen } from '../pages/AgendaScreen';
import MeusServicosScreen from '../pages/MeusServicosScreen';

export type RootTabParamList = {
    Home: undefined;
    Serviços: undefined;
    Leilões: {
        screen: keyof LeilaoStackParamList;
        params: LeilaoStackParamList[keyof LeilaoStackParamList];
    };
    Agenda: undefined;
    MeusServicos: undefined;
    Perfil: undefined;
    FornecedorStack: {
        screen: keyof FornecedorStackParamList;
        params: FornecedorStackParamList[keyof FornecedorStackParamList];
    };
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export const TabNavigation = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#EEB16C',
                    height: 60,
                    paddingBottom: 5,
                    ...Platform.select({
                        ios: {
                            shadowColor: 'black',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                        },
                        android: {
                            elevation: 5,
                        },
                    }),
                },
                tabBarActiveTintColor: 'yellow',
                tabBarInactiveTintColor: 'white',
            }}
        >
            <Tab.Screen
                name='Home'
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name='Serviços'
                component={ServicoScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="tools" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name='Leilões'
                component={LeilaoStackNavigation}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="gavel" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name='Agenda'
                component={AgendaScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name='MeusServicos'
                component={MeusServicosScreen}
                options={{
                    tabBarLabel: 'Meus Serviços',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="clipboard-list" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name='Perfil'
                component={PerfilScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="account" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name='FornecedorStack'
                component={FornecedorStackNavigation}
                options={{
                    tabBarButton: () => null,
                    tabBarStyle: { display: 'none' },
                    tabBarItemStyle: { display: 'none' },
                }}
            />
        </Tab.Navigator>
    );
}; 