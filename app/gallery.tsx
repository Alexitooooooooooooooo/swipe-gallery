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
const BATCH_SIZE = 20;
const LOAD_MORE_THRESHOLD = 5;
const DELETE_RECOMMENDATION_LIMIT = 30;

type GalleryAsset = {
  id: string;
  uri: string;
};

export default function GalleryScreen() {
  const [photoStack, setPhotoStack] = useState<GalleryAsset[]>([]);
  const [showSimulated, setShowSimulated] = useState(false);
  const [disableActions, setDisableActions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletephotos, setDeletePhotos] = useState<GalleryAsset[]>([]);
  const [keepphotos, setKeepPhotos] = useState<GalleryAsset[]>([]);
  const [viewMode, setViewMode] = useState<'gallery' | 'delete'>('gallery');
  const swiperRef = React.useRef<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const currentCardIndexRef = React.useRef(0);
  const swipeLockRef = React.useRef(false);
  const isLoadingMoreRef = React.useRef(false);
  const limitModalShownRef = React.useRef(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalImages, setTotalImages] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<number>(0);

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
      void ExpoImage.prefetch(lastDeleted.uri);
      setDeletePhotos(prev => prev.slice(0, -1));
      setPhotoStack(prev => [lastDeleted, ...prev]);
      setShowSimulated(false);
      setDisableActions(false);
      console.log("Foto restaurada (eliminada):", lastDeleted.uri);
    } else if (lastKept) {
      void ExpoImage.prefetch(lastKept.uri);
      setKeepPhotos(prev => prev.slice(0, -1));
      setPhotoStack(prev => [lastKept, ...prev]);
      setShowSimulated(false);
      setDisableActions(false);
      console.log("Foto restaurada (conservada):", lastKept.uri);
    }
  };

  const loadMorePhotos = async (isInitial = false) => {
    if (isLoadingMoreRef.current) return;
    if (!isInitial && !hasNextPage) return;

    // Verifica si ya cargamos todas las imágenes
    if (totalImages !== null && loadedImages >= totalImages) {
      setHasNextPage(false);
      setNextCursor(undefined);
      isLoadingMoreRef.current = false;
      if (isInitial) setLoading(false);
      return;
    }

    isLoadingMoreRef.current = true;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log("Permiso denegado");
        isLoadingMoreRef.current = false;
        return;
      }

      let batchSize = BATCH_SIZE;
      // Si no tenemos el total, lo pedimos
      if (totalImages === null) {
        const totalInfo = await MediaLibrary.getAssetsAsync({ first: 1, mediaType: 'photo' });
        setTotalImages(totalInfo.totalCount ?? 0);
        console.log('Total de imágenes en el dispositivo:', totalInfo.totalCount ?? 0);
        if ((totalInfo.totalCount ?? 0) < BATCH_SIZE) {
          batchSize = totalInfo.totalCount ?? 0;
        }
      } else if (isInitial && totalImages < BATCH_SIZE) {
        batchSize = totalImages;
      }

      // Si ya tenemos el total y quedan menos de un batch, ajusta el batch
      if (totalImages !== null && loadedImages + batchSize > totalImages) {
        batchSize = totalImages - loadedImages;
      }

      if (batchSize <= 0) {
        setHasNextPage(false);
        setNextCursor(undefined);
        isLoadingMoreRef.current = false;
        if (isInitial) setLoading(false);
        return;
      }

      const { assets, endCursor, hasNextPage: morePages } = await MediaLibrary.getAssetsAsync({
        first: batchSize,
        mediaType: 'photo',
        after: isInitial ? undefined : nextCursor,
      });

      const mappedAssets: GalleryAsset[] = (assets ?? []).map((asset) => ({
        id: asset.id,
        uri: asset.uri,
      }));

      // Si no hay assets y no hay más páginas, no cargar más
      if (mappedAssets.length === 0 && !morePages) {
        setHasNextPage(false);
        setNextCursor(undefined);
        isLoadingMoreRef.current = false;
        if (isInitial) setLoading(false);
        return;
      }

      if (mappedAssets.length > 0) {
        await preloadUris(mappedAssets.map((asset) => asset.uri));
        let newStack = isInitial ? mappedAssets : [...photoStack, ...mappedAssets];
        // Si ya llegamos al total, agregamos la simulada
        if (loadedImages + mappedAssets.length >= (totalImages ?? 0)) {
          newStack = [...newStack, { id: 'simulated', uri: 'simulated' }];
        }
        setPhotoStack(newStack);
        setLoadedImages((prev) => prev + mappedAssets.length);
      } else if (isInitial) {
        setPhotoStack([]);
      }
      setNextCursor(endCursor ?? undefined);
      setHasNextPage(morePages && (totalImages === null || loadedImages + mappedAssets.length < totalImages));
    } catch (error) {
      console.warn('Error cargando fotos:', error);
    } finally {
      isLoadingMoreRef.current = false;
      if (isInitial) setLoading(false);
    }
  };

  const maybeLoadMorePhotos = (nextCardIndex: number) => {
    const remainingCards = photoStack.length - nextCardIndex;
    if (remainingCards <= LOAD_MORE_THRESHOLD && hasNextPage) {
      void loadMorePhotos(false);
    }
  };

  const managephotodelete = (cardIndex: number) => {
    const asset = photoStack[cardIndex];
    if (!asset) {
      swipeLockRef.current = false;
      return;
    }
    setDeletePhotos(prev => {
      const updated = [...prev, asset];
      console.log("Fotos a eliminar:", updated);
      return updated;
    });
    const nextCardIndex = cardIndex + 1;
    currentCardIndexRef.current = nextCardIndex;
    maybeLoadMorePhotos(nextCardIndex);
    swipeLockRef.current = false;
  };

  const managephotokeep = (cardIndex: number) => {
    const asset = photoStack[cardIndex];
    if (!asset) {
      swipeLockRef.current = false;
      return;
    }
    setKeepPhotos(prev => {
      const updated = [...prev, asset];
      console.log("Fotos a conservar:", updated);
      return updated;
    });
    const nextCardIndex = cardIndex + 1;
    currentCardIndexRef.current = nextCardIndex;
    maybeLoadMorePhotos(nextCardIndex);
    swipeLockRef.current = false;
  };

  const handleDeleteSelected = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status === 'granted') {
        const idsToDelete = deletephotos.map((asset) => asset.id);
        if (idsToDelete.length === 0) {
          setShowConfirmModal(false);
          return;
        }

        const success = await MediaLibrary.deleteAssetsAsync(idsToDelete);

        if (success) {
          console.log("Imagen(es) eliminada(s) con éxito");
          setDeletePhotos([]);
        } else {
          console.log("El usuario canceló la eliminación o hubo un error");
        }
      } else {
        console.log("Permiso denegado");
      }
    } catch (error) {
      console.error("Error al intentar eliminar:", error);
    } finally {
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    void loadMorePhotos(true);
  }, []);

  useEffect(() => {
    if (deletephotos.length >= DELETE_RECOMMENDATION_LIMIT && !limitModalShownRef.current) {
      setShowRecommendationModal(true);
      limitModalShownRef.current = true;
    }

    if (deletephotos.length < DELETE_RECOMMENDATION_LIMIT) {
      limitModalShownRef.current = false;
    }
  }, [deletephotos.length]);

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

              {/* Swiper y mensaje de no hay más fotos */}
              <View
                style={{
                  flex: 1,
                  opacity: viewMode === 'gallery' ? 1 : 0,
                }}
                pointerEvents={viewMode === 'gallery' ? 'auto' : 'none'}
              >
                <View style={{ flex: 1 }}>
                  {photoStack.length === 0 && !hasNextPage ? (
                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: '#f3f4f6' }}>
                      <RNText style={{ fontSize: 18, color: '#7c3aed', fontWeight: 'bold', textAlign: 'center' }}>
                        No hay más fotos que verificar
                      </RNText>
                    </View>
                  ) : (
                    <Swiper
                      ref={swiperRef}
                      cards={photoStack}
                      renderCard={(card, index) =>
                        card && card.id !== 'simulated' ? (
                          <ExpoImage
                            key={card.id}
                            source={card.uri}
                            style={{ width: '100%', height: '100%', borderRadius: 24 }}
                            contentFit="cover"
                            transition={0}
                            cachePolicy="memory-disk"
                            recyclingKey={card.id}
                          />
                        ) : card && card.id === 'simulated' ? (
                          <View style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 24,
                            backgroundColor: '#f3f4f6',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 50,
                          }}>
                            <RNText style={{ fontSize: 22, color: '#7c3aed', fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
                              No hay más imágenes que verificar
                            </RNText>
                          </View>
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
                      swipeBackCard={false}
                      disableLeftSwipe={showSimulated}
                      disableRightSwipe={showSimulated}
                      disableTopSwipe={true}
                      disableBottomSwipe={true}
                      onSwiped={(cardIndex) => {
                        // Si la siguiente es la simulada, deshabilita acciones
                        if (photoStack[cardIndex + 1] && photoStack[cardIndex + 1].id === 'simulated') {
                          setShowSimulated(true);
                          setDisableActions(true);
                        } else {
                          setShowSimulated(false);
                          setDisableActions(false);
                        }
                      }}
                    />
                  )}
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
                      className={`w-16 h-16 rounded-full border-2 items-center justify-center shadow-lg ${
                        (deletephotos.length === 0 && keepphotos.length === 0) ? 'bg-gray-200 opacity-50' : 'bg-gray-300'
                      }`}
                      onPress={handleUndo}
                      disabled={deletephotos.length === 0 && keepphotos.length === 0}
                    >
                      <RotateCcw size={24} color={showSimulated ? '#a1a1aa' : '#ffffff'} strokeWidth={2.5} />
                    </TouchableOpacity>

                    {/* Botón Eliminar funcional */}
                    <TouchableOpacity
                      className="w-16 h-16 rounded-full border-2 items-center justify-center shadow-lg"
                      onPress={() => {
                        if (swipeLockRef.current) return;
                        if (disableActions) return;
                        swiperRef.current?.swipeLeft();
                      }}
                      disabled={disableActions || showSimulated || photoStack.length === 0 && !hasNextPage}
                      style={disableActions || showSimulated || photoStack.length === 0 && !hasNextPage ? { opacity: 0.25, backgroundColor: '#ef4444', borderColor: '#ef4444' } : { backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                    >
                      <X size={28} color={disableActions || showSimulated || photoStack.length === 0 && !hasNextPage ? '#ffffff' : '#ffffff'} strokeWidth={2.5} />
                    </TouchableOpacity>

                    {/* Botón Conservar funcional */}
                    <TouchableOpacity
                      className="w-16 h-16 rounded-full border-2 items-center justify-center shadow-lg"
                      onPress={() => {
                        if (swipeLockRef.current) return;
                        if (disableActions) return;
                        swiperRef.current?.swipeRight();
                      }}
                      disabled={disableActions || showSimulated || photoStack.length === 0 && !hasNextPage}
                      style={disableActions || showSimulated || photoStack.length === 0 && !hasNextPage ? { opacity: 0.25, backgroundColor: '#7c3aed', borderColor: '#7c3aed' } : { backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                    >
                      <Check size={28} color={disableActions || showSimulated || photoStack.length === 0 && !hasNextPage ? '#ffffff' : '#ffffff'} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {viewMode === 'delete' && (
                <View style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0 }}>
                  <View style={{ flex: 1 }}>
                    <ScrollView className="flex-1 px-4 pb-6">
                      <View className="flex-row flex-wrap justify-between mt-2">
                        {deletephotos.map((asset, index) => (
                          <View
                            key={asset.id + index}
                            className="mb-4"
                            style={{
                              width: (width * 0.92 - 60) / 4,
                              marginRight: (index % 4 !== 3) ? 12 : 0,
                              position: 'relative',
                            }}
                          >
                            <ExpoImage
                              key={asset.id + index}
                              source={asset.uri}
                              style={{ width: '100%', height: 70, borderRadius: 10 }}
                              contentFit="cover"
                              transition={0}
                              cachePolicy="memory-disk"
                              recyclingKey={asset.id}
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
                                setDeletePhotos(prev => prev.filter((item) => item.id !== asset.id));
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
                  void handleDeleteSelected();
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

      {showRecommendationModal && (
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
            zIndex: 101,
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
              Recomendación
            </RNText>
            <RNText
              style={{
                fontSize: 14,
                color: '#374151',
                textAlign: 'center',
                marginBottom: 18,
              }}
            >
              Tienes {deletephotos.length} fotos marcadas para eliminar. Te recomendamos borrarlas ahora para mantener el flujo ágil.
            </RNText>

            <TouchableOpacity
              style={{
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: '#4b5563',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => setShowRecommendationModal(false)}
            >
              <RNText style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                Aceptar
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
