import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface LeilaoImageProps {
  src?: string;
  alt?: string;
  style?: any;
  showIcon?: boolean;
}

export const LeilaoImage: React.FC<LeilaoImageProps> = ({ 
  src, 
  alt, 
  style, 
  showIcon = true 
}) => {
  const [imageError, setImageError] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageSource = () => {
    if (imageError || !src) {
      // Imagem padrão baseada na categoria ou imagem genérica
      return { uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' };
    }
    return { uri: src };
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={getImageSource()}
        style={styles.image}
        resizeMode="cover"
        onError={handleImageError}
      />
      {showIcon && (
        <View style={styles.iconContainer}>
          <Icon name="gavel" size={20} color="#fff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  iconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
}); 