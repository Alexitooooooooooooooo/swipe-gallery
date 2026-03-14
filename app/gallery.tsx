import React, { useState, useEffect } from "react";
import Swiper from 'react-native-deck-swiper';
import { View, Image as RNImage, Text as RNText, Dimensions, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { RotateCcw, X, Check, Trash2 } from "lucide-react-native";
import * as MediaLibrary from 'expo-media-library';
import { Image as ExpoImage } from "expo-image";





const { width, height } = Dimensions.get('window');

export default function GalleryScreen() {
  const [photoStack, setPhotoStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletephotos, setDeletePhotos] = useState<string[]>([]);
  const [keepphotos, setKeepPhotos] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'gallery' | 'delete'>('gallery');
  const swiperRef = React.useRef<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const currentCardIndexRef = React.useRef(0);
  const swipeLockRef = React.useRef(false);

  const preloadUris = async (uris: string[]) => {
    await Promise.all(
      uris.map(async (uri) => {
        try {
          await ExpoImage.prefetch(uri);
        } catch {
          // Ignoramos errores puntuales de prefetch para no bloquear la UI
        }
      })
    );
  };

  // Rehacer: elimina la última foto de deletephotos o keepphotos y la pone al frente del stack
  const handleUndo = () => {
    if (swipeLockRef.current) return;
    const lastDeleted = deletephotos[deletephotos.length - 1];
    const lastKept = keepphotos[keepphotos.length - 1];

    if (lastDeleted) {
      void ExpoImage.prefetch(lastDeleted);
      setDeletePhotos(prev => prev.slice(0, -1));
      setPhotoStack(prev => [lastDeleted, ...prev]);
      console.log("Foto restaurada (eliminada):", lastDeleted);
    } else if (lastKept) {
      void ExpoImage.prefetch(lastKept);
      setKeepPhotos(prev => prev.slice(0, -1));
      setPhotoStack(prev => [lastKept, ...prev]);
      console.log("Foto restaurada (conservada):", lastKept);
    }
  };

  const managephotodelete = (cardIndex: number) => {
    const uri = photoStack[cardIndex];
    if (!uri) {
      swipeLockRef.current = false;
      return;
    }
    setDeletePhotos(prev => {
      const updated = [...prev, uri];
      console.log("Fotos a eliminar:", updated);
      return updated;
    });
    currentCardIndexRef.current = cardIndex + 1;
    swipeLockRef.current = false;
  };

  const managephotokeep = (cardIndex: number) => {
    const uri = photoStack[cardIndex];
    if (!uri) {
      swipeLockRef.current = false;
      return;
    }
    setKeepPhotos(prev => {
      const updated = [...prev, uri];
      console.log("Fotos a conservar:", updated);
      return updated;
    });
    currentCardIndexRef.current = cardIndex + 1;
    swipeLockRef.current = false;
  };
  

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
        while (uris.length < 10) {
          uris.push('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop');
        }

        await preloadUris(uris);
        setPhotoStack(uris);
      } catch (error) {
        console.warn('Error accediendo a galería:', error);
        // Fallback: 5 gatitos
        const fallbackUris = Array(5).fill('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop');
        await preloadUris(fallbackUris);
        setPhotoStack(fallbackUris);
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
        <RNImage
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
            <View style={{ flex: 1 }}>
              {/* Tabs de vista: Galería / A eliminar */}
              <View className="flex-row px-4 pt-3 pb-2 justify-between items-center">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full ${
                    viewMode === 'gallery' ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                  onPress={() => setViewMode('gallery')}
                >
                  <Text className={viewMode === 'gallery' ? 'text-white font-semibold' : 'text-gray-700 font-semibold'}>
                    Galería
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`px-4 py-2 rounded-full flex-row items-center ${
                    viewMode === 'delete' ? 'bg-red-500' : 'bg-gray-200'
                  } ${deletephotos.length === 0 ? 'opacity-40' : ''}`}
                  disabled={deletephotos.length === 0}
                  onPress={() => setViewMode('delete')}
                >
                  <Text className={viewMode === 'delete' ? 'text-white font-semibold' : 'text-gray-700 font-semibold'}>
                    A eliminar ({deletephotos.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Swiper siempre montado para evitar reseteos/parpadeos */}
              <View
                style={{
                  flex: 1,
                  opacity: viewMode === 'gallery' ? 1 : 0,
                }}
                pointerEvents={viewMode === 'gallery' ? 'auto' : 'none'}
              >
                <View style={{ flex: 1 }}>
                  <Swiper
                    ref={swiperRef}
                    cards={photoStack}
                    renderCard={(card) =>
                      card ? (
                        <ExpoImage
                          key={card}
                          source={card}
                          style={{ width: '100%', height: '100%', borderRadius: 24 }}
                          contentFit="cover"
                          transition={0}
                          cachePolicy="memory-disk"
                          recyclingKey={card}
                        />
                      ) : (
                        <View style={{ width: '100%', height: '100%', borderRadius: 24, backgroundColor: '#f3f4f6' }} />
                      )
                    }
                    onSwipedLeft={managephotodelete}
                    onSwipedRight={managephotokeep}
                    onSwipedAll={() => {
                      swipeLockRef.current = false;
                    }}
                    stackSize={2}
                    backgroundColor="transparent"
                    animateCardOpacity={false}
                    stackSeparation={15}
                    showSecondCard={true}
                    disableTopSwipe={true}
                    disableBottomSwipe={true}
                    horizontalThreshold={width * 0.25}
                    containerStyle={{ flex: 1 }}
                    cardHorizontalMargin={0}
                    cardVerticalMargin={0}
                    cardStyle={{ borderRadius: 24, overflow: 'hidden', flex: 1, width: '100%' }}
                  />
                </View>

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
                      borderColor: '#e5e7eb',
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
                    {/* Botón Deshacer funcional */}
                    <TouchableOpacity
                      className={`w-16 h-16 rounded-full border-2 border-gray-400 items-center justify-center shadow-lg ${
                        (deletephotos.length === 0 && keepphotos.length === 0) ? 'bg-gray-200 opacity-50' : 'bg-gray-300'
                      }`}
                      onPress={handleUndo}
                      disabled={deletephotos.length === 0 && keepphotos.length === 0}
                    >
                      <RotateCcw size={24} color="#ffffff" strokeWidth={2.5} />
                    </TouchableOpacity>

                    {/* Botón Eliminar funcional */}
                    <TouchableOpacity
                      className="w-16 h-16 rounded-full border-2 border-[#ef4444] items-center justify-center bg-[#ef4444] shadow-lg"
                      onPress={() => {
                        if (swipeLockRef.current) return;
                        swipeLockRef.current = true;
                        swiperRef.current?.swipeLeft();
                      }}
                    >
                      <X size={28} color="#ffffff" strokeWidth={2.5} />
                    </TouchableOpacity>

                    {/* Botón Conservar funcional */}
                    <TouchableOpacity
                      className="w-16 h-16 rounded-full border-2 border-[#7c3aed] items-center justify-center bg-[#7c3aed] shadow-lg"
                      onPress={() => {
                        if (swipeLockRef.current) return;
                        swipeLockRef.current = true;
                        swiperRef.current?.swipeRight();
                      }}
                    >
                      <Check size={28} color="#ffffff" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {viewMode === 'delete' && (
                <View style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0 }}>
                  <View style={{ flex: 1 }}>
                    <ScrollView className="flex-1 px-4 pb-6">
                      <View className="flex-row flex-wrap justify-between mt-2">
                        {deletephotos.map((uri, index) => (
                          <View
                            key={uri + index}
                            className="mb-4"
                            style={{
                              width: (width * 0.92 - 60) / 4,
                              marginRight: (index % 4 !== 3) ? 12 : 0,
                              position: 'relative',
                            }}
                          >
                            <ExpoImage
                              key={uri + index}
                              source={uri}
                              style={{ width: '100%', height: 70, borderRadius: 10 }}
                              contentFit="cover"
                              transition={0}
                              cachePolicy="memory-disk"
                              recyclingKey={uri}
                            />
                            <TouchableOpacity
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: '#ef4444',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.12,
                                shadowRadius: 2,
                              }}
                              onPress={() => {
                                setDeletePhotos(prev => prev.filter((item, i) => i !== index));
                              }}
                            >
                              <X size={14} color="#fff" strokeWidth={2.5} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                    {/* Botón principal rojo eliminar como footer fijo */}
                    <View style={{ width: '100%', alignItems: 'center', position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 16, backgroundColor: 'transparent' }}>
                      <TouchableOpacity
                        className={`flex-row items-center justify-center bg-[#ef4444] border-2 border-[#ef4444] rounded-full shadow-lg px-6 py-3 ${deletephotos.length === 0 ? 'opacity-50' : ''}`}
                        style={{ minWidth: 180 }}
                        onPress={() => {
                          if (deletephotos.length === 0) return;
                          setShowConfirmModal(true);
                        }}
                        disabled={deletephotos.length === 0}
                      >
                        <Trash2 size={28} color="#fff" strokeWidth={2.5} />
                        <Text className="text-white text-lg font-semibold ml-2">
                          Eliminar
                        </Text>
                        <View className="ml-3 bg-white rounded-full px-3 py-1">
                          <Text className="text-[#ef4444] font-bold text-base">
                            {deletephotos.length}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Modal de confirmación global, por encima de todo */}
      {showConfirmModal && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 16,
              width: 320,
              maxWidth: '90%',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <RNText
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827',
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              Eliminar
            </RNText>
            <RNText
              style={{
                fontSize: 14,
                color: '#374151',
                textAlign: 'center',
                marginBottom: 18,
              }}
            >
              ¿Eliminar {deletephotos.length} elemento{deletephotos.length !== 1 ? 's' : ''} seleccionado{deletephotos.length !== 1 ? 's' : ''}? Esta acción no se puede deshacer.
            </RNText>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  marginRight: 6,
                  borderRadius: 999,
                  backgroundColor: '#4b5563',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => setShowConfirmModal(false)}
              >
                <RNText style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                  Cancelar
                </RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  marginLeft: 6,
                  borderRadius: 999,
                  backgroundColor: '#ef4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  setDeletePhotos([]);
                  setShowConfirmModal(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={20} color="#fff" strokeWidth={2.5} />
                  <RNText style={{ color: '#fff', fontWeight: '600', fontSize: 14, marginLeft: 6 }}>
                    Eliminar
                  </RNText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
