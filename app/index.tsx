import React, { useState } from "react";
import { View, Image, Text as RNText, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Play, Loader2 } from "lucide-react-native";
import * as MediaLibrary from 'expo-media-library';

export default function App({ onNavigate }: { onNavigate: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  // Custom Hook request to get strictly photos:
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo']
  });

  const handlePress = async () => {
    setIsLoading(true);

    try {
      if (!permissionResponse || permissionResponse.status !== 'granted') {
        const response = await requestPermission();
        if (response.granted) {
          onNavigate();
        } else {
          Alert.alert("Permiso Denegado", "Lo siento, necesitamos tu galería para seguir.");
        }
      } else {
        onNavigate();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Problema solicitando permisos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Main Content Area */}
      <View className="flex-1 justify-center px-6">

        {/* Top Logo - Centered */}
        <View className="items-center mb-16">
          <Image
            source={require('../assets/logo.png')}
            className="w-56 h-56"
            resizeMode="contain"
          />
        </View>

        {/* Title Area - Left Aligned */}
        <View className="mb-2 flex-col">
          <Text className="text-black font-extrabold text-[40px] leading-[44px]">
            ¡Te damos la
          </Text>
          <Text className="text-black font-extrabold text-[40px] leading-[44px] mb-4">
            bienvenida a Photo Swipe!
          </Text>

          <Text className="text-gray-500 font-medium text-lg">
            Organiza tu galería. Limpieza Inteligente.
          </Text>
        </View>

      </View>

      {/* Bottom Actions Area */}
      <View className="px-6 pb-12">
        {/* Action Button */}
        <Button
          onPress={handlePress}
          disabled={isLoading}
        >
          {isLoading ? (
            <View className="pointer-events-none animate-spin mr-2">
              <Loader2 className="text-white" size={20} color="white" />
            </View>
          ) : (
            <Play className="text-white mr-2" size={20} color="white" />
          )}
          <Text>
            {isLoading ? "Cargando..." : "Continuar"}
          </Text>
        </Button>

      </View>
    </SafeAreaView>
  );
}