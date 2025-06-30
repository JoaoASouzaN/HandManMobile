import React, { useRef, useState } from 'react';
import { View, Image, FlatList, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const { width } = Dimensions.get('window');

interface CarroselProps {
  imagens: string[] | undefined;
}

export const Carrosel = ({ imagens }: CarroselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<any>(null); // ref para controlar o carrossel

  const imagensAlteradas =
    imagens && Array.isArray(imagens) 
      ? imagens.map((ima: string) => ({
          uri: ima,
        }))
      : [];

  const handleThumbnailPress = (index: number) => {
    setCurrentIndex(index);
    carouselRef.current?.scrollTo?.({ index, animated: true });
  };

  return (
    <View>
      <Carousel
        ref={carouselRef}
        width={width}
        height={350}
        data={imagensAlteradas}
        scrollAnimationDuration={500}
        onSnapToItem={setCurrentIndex}
        renderItem={({ item }) => (
          <Image source={{ uri: item.uri }} style={styles.imagemPrincipal} />
        )}
      />

      <FlatList
        data={imagensAlteradas}
        horizontal
        contentContainerStyle={styles.thumbsContainer}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => handleThumbnailPress(index)}>
            <Image
              source={{ uri: item.uri }}
              style={[
                styles.thumbnail,
                currentIndex === index && styles.thumbSelecionada,
              ]}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  imagemPrincipal: {
    width: '90%',
    alignSelf:'center',
    height: 350,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  thumbsContainer: {
    marginTop: 10,
    marginBottom:30,
    paddingHorizontal: 20,
  },
  thumbnail: {
    width: 70,
    height: 70,
    marginRight: 10,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbSelecionada: {
    borderColor: '#A75C00',
  },
});
