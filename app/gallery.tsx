import React, { useState, useEffect } from "react";
import { View, Image, Text as RNText, Dimensions, ActivityIndicator, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { RotateCcw, X, Check } from "lucide-react-native";
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');

export default function GalleryScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRandomPhoto() {
      try {
        // Pedimos las primeras 20 fotos para agarrar una random
        const { assets } = await MediaLibrary.getAssetsAsync({
          first: 20,
          mediaType: 'photo',
        });

        if (assets && assets.length > 0) {
          const randomIndex = Math.floor(Math.random() * assets.length);
          setPhotoUri(assets[randomIndex].uri);
        } else {
          // Si no tiene fotos, usamos un gatito sueco de prueba
          setPhotoUri('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop');
        }
      } catch (error) {
        console.warn('Error accediendo a galería:', error);
        // Fallback por si sigue limitando Expo Go
        setPhotoUri('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop');
      } finally {
        setLoading(false);
      }
    }
    fetchRandomPhoto();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <StatusBar style="dark" />

      {/* 
        Tinder-Style Header
        Solo el logo centrado en la parte superior, sin borde para que la carta se superponga
      */}
      <View className="w-full items-center justify-start pt-4 bg-transparent z-10 relative">
        <Image
          source={require('../assets/titulo.png')}
          className="w-56 h-24"
          resizeMode="contain"
        />
      </View>

      {/* Área del Recuadro de la Galería (Superpuesto el título) */}
      <View className="flex-1 items-center justify-center -mt-16 z-20">
        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <View
            className="bg-white rounded-3xl overflow-hidden shadow-2xl"
            style={{
              width: width * 0.92,
              height: height * 0.70,
              elevation: 10, // Sombra profunda en Android
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
            }}
          >
            {/* Foto ocupando casi toda la carta */}
            <Image
              source={{ uri: photoUri || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop' }}
              className="w-full flex-1"
              resizeMode="cover"
            />

            {/* Banda inferior con los botones circulares (Swipe Actions) */}
            <View className="px-4 py-5 flex-row justify-center items-center gap-6 border-t border-gray-100 dark:border-gray-800">

              {/* Botón Deshacer */}
              <TouchableOpacity className="w-16 h-16 rounded-full border-2 border-gray-400 items-center justify-center bg-gray-300 shadow-lg">
                <RotateCcw size={30} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Botón Rechazar */}
              <TouchableOpacity className="w-16 h-16 rounded-full border-2 border-[#ef4444] items-center justify-center bg-[#ef4444] shadow-lg">
                <X size={34} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Botón Conservar */}
              <TouchableOpacity className="w-16 h-16 rounded-full border-2 border-[#7c3aed] items-center justify-center bg-[#7c3aed] shadow-lg">
                <Check size={34} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>

            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
