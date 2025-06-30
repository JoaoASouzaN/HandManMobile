import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MyJwtPayload {
    id: string;
    nome: string;
    email: string;
    imagemPerfil: string;
    role: string;
}

export const useGetToken = () => {
    const [tokenData, setTokenData] = useState<MyJwtPayload | null | undefined>(undefined); // undefined = carregando

    useEffect(() => {
        const getToken = async () => {
            try {
                const token = await AsyncStorage.getItem("userToken");
                console.log("Token obtido:", token);
                
                if (token) {
                    const decodedToken = jwtDecode<MyJwtPayload>(token);
                    console.log("Token decodificado:", decodedToken);
                    setTokenData(decodedToken);
                } else {
                    setTokenData(null); // Não logado
                }
            } catch (error) {
                console.error("Erro ao obter ou decodificar o token:", error);
                setTokenData(null); // Em caso de erro, assume não logado
            }
        };

        getToken();
    }, []);

    return tokenData;
};
