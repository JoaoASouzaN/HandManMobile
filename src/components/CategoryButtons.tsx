import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

interface CategoryButtonsProps {
  categories: string[]; // Assuming categories are strings for now
  onSelectCategory?: (category: string) => void;
  loading?: boolean;
}

export const CategoryButtons = ({ categories, onSelectCategory, loading = false }: CategoryButtonsProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(''); 

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category); 
    if (onSelectCategory) {
      onSelectCategory(category); 
    }
  };

  // Verificar se categories é um array válido
  const validCategories = categories && Array.isArray(categories) ? categories : [];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {validCategories.map((category, index) => {
          const isSelected = category === selectedCategory; 
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.button, 
                isSelected && styles.selectedButton,
                isSelected && loading && styles.loadingButton
              ]} 
              onPress={() => handleSelectCategory(category)}
              disabled={loading}
            >
              <Text style={[
                styles.buttonText, 
                isSelected && styles.selectedButtonText,
                isSelected && loading && styles.loadingButtonText
              ]}>
                {category}
              </Text>
              {isSelected && loading && (
                <ActivityIndicator 
                  size="small" 
                  color="#fbe6d4" 
                  style={styles.loadingIndicator}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#fbe6d4', // Default background color
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  selectedButton: {
    backgroundColor: '#a64b00', // Background color when selected
  },
  loadingButton: {
    backgroundColor: '#8B4513', // Cor mais escura durante o loading
  },
  buttonText: {
    color: '#a64b00', // Default text color
    fontSize: 14,
    fontWeight: '600',
  },
  selectedButtonText: {
    color: '#fbe6d4', // Text color when selected
  },
  loadingButtonText: {
    color: '#fbe6d4',
    marginRight: 8,
  },
  loadingIndicator: {
    marginLeft: 4,
  }
}); 