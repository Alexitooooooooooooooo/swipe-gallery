import React, { useState, useEffect } from "react";
import Swiper from 'react-native-deck-swiper';
import { View, Image, Text as RNText, Dimensions, ActivityIndicator, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { RotateCcw, X, Check } from "lucide-react-native";
import * as MediaLibrary from 'expo-media-library';

const { width, height } = Dimensions.get('window');

export default function GalleryScreen() {
  const [photoStack, setPhotoStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhotosStack() {
      try {
        // Pedimos las primeras 20 fotos para agarrar 5 random
        const { assets } = await MediaLibrary.getAssetsAsync({
          first: 20,
          mediaType: 'photo',
        });

        let uris: string[] = [];
        if (assets && assets.length > 0) {
          // Elegimos 5 fotos random, sin repetir
          const shuffled = assets.sort(() => 0.5 - Math.random());
          uris = shuffled.slice(0, 5).map(asset => asset.uri);
        }
        // Si no hay suficientes fotos, rellenamos con gatitos
        while (uris.length < 5) {
          uris.push('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop');
        }
        setPhotoStack(uris);
      } catch (error) {
        console.warn('Error accediendo a galería:', error);
        // Fallback: 5 gatitos
        setPhotoStack(Array(5).fill('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop'));
      } finally {
        setLoading(false);
      }
    }
    fetchPhotosStack();
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
              height: height * 0.75,
              elevation: 10, // Sombra profunda en Android
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
            }}
          >
            {/* Swiper solo para la imagen, manteniendo la estructura original */}
            <View style={{ flex: 1 }}>
              <Swiper
                cards={photoStack}
                renderCard={(card) => (
                  <Image
                    source={{ uri: card }}
                    style={{ width: '100%', height: '100%', borderRadius: 24 }}
                    resizeMode="cover"
                  />
                )}
                stackSize={2}
                cardIndex={0}
                backgroundColor="transparent"
                stackSeparation={15}
                showSecondCard={true}
                disableTopSwipe={false}
                disableBottomSwipe={false}
                containerStyle={{ flex: 1 }}
                cardHorizontalMargin={0}
                cardVerticalMargin={0}
                cardStyle={{ borderRadius: 24, overflow: 'hidden', flex: 1, width: '100%' }}
              />
              {/* Contenedor de botones sobrepuesto debajo de la foto */}
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 }}>
                <View
                  className="px-4 py-6 flex-row justify-center items-center gap-6"
                  style={{
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                    borderLeftWidth: 2,
                    borderRightWidth: 2,
                    borderBottomWidth: 2,
                    borderColor: '#e5e7eb', // gray-200
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    marginTop: 32,
                  }}
                >
                  {/* Botón Deshacer */}
                  <TouchableOpacity className="w-16 h-16 rounded-full border-2 border-gray-400 items-center justify-center bg-gray-300 shadow-lg">
                    <RotateCcw size={24} color="#ffffff" strokeWidth={2.5} />
                  </TouchableOpacity>
                  {/* Botón Rechazar */}
                  <TouchableOpacity className="w-16 h-16 rounded-full border-2 border-[#ef4444] items-center justify-center bg-[#ef4444] shadow-lg">
                    <X size={28} color="#ffffff" strokeWidth={2.5} />
                  </TouchableOpacity>
                  {/* Botón Conservar */}
                  <TouchableOpacity className="w-16 h-16 rounded-full border-2 border-[#7c3aed] items-center justify-center bg-[#7c3aed] shadow-lg">
                    <Check size={28} color="#ffffff" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
