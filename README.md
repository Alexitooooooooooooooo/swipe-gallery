# Photo Swipe 📸✨

¡Bienvenido a **Photo Swipe**! Una aplicación móvil moderna orientada a ayudarte a organizar tu galería de fotos de forma inteligente.

## 🚀 Tecnologías que usamos

Este proyecto está construido con la arquitectura más potente para desarrollo móvil actual (y para que vuele de rápido):

- **React Native (Expo)**: Nuestro núcleo móvil. Hacemos componentes con Javascript/Typescript y Expo se encarga de compilarlos para iOS y Android como aplicaciones nativas.
- **NativeWind v4 (Tailwind CSS)**: Nos permite, por primera vez, estilizar nuestras interfaces con clases de Tailwind como `flex-1`, `bg-black` o `text-white` sin pelear con StyleSheet en todos lados.
- **React Native Reusables (Shadcn)**: Importamos componentes listos como `<Button>` o `<Text>`, súper flexibles, y completamente inyectables a nuestro tema general.
- **Lucide Icons**: ¡Íconos limpios y ultra ligeros, súper fáciles de manejar!

---

## 📂 Archivos Claves del Sistema

Aquí tienes explicado, como para un niño de 5 años, qué hace cada parte que programamos:

### 1. La Pantalla Principal (`app/index.tsx`)
Esta es la interfaz visual principal donde le damos la bienvenida al usuario al mejor estilo *Bitget/Onboarding*.
- **Estructura Segura**: Usamos `<SafeAreaView>` para asegurarnos que la app no quede tapada por el marco del celular (o bajo la barra de batería arriba).
- **El Estado de Carga `isLoading`**: Como magia transparente. Cuando pulsas el botón "Continuar", disparamos `setIsLoading(true)`. Eso hace que el código reemplace automáticamente el ícono del reproductor o `Play` por el `Loader2` girando (`animate-spin`), ¡y desactiva momentáneamente la posibilidad de presionar doble clic con `disabled={isLoading}`!
- **Clases en todos lados**: Todo está ordenado usando layouts `flex` espaciando elegantemente cada letra hacia la izquierda y ajustando la imagen central.

### 2. El Cerebro Visual: El Tema (`global.css` y `lib/theme.ts`)
- **`global.css`**: Aquí configuramos variables en código de colores, donde decimos *exactamente* cuál es nuestro color "Primary", nuestro color "Destructive", etc.
- **`lib/theme.ts`**: Es el diccionario de Typescript que lee nuestros colores y se los pasa a nuestro `<ThemeProvider>` en **`App.tsx`**.
¿Por qué hacer esto tan largo?
Porque de esta forma, cuando le decimos a un `<Button>` "Sé tú mismo" (variant por defecto), él no hace falta que le digamos color morado o azul; él **sabe** ir a buscar la variable Primary de `global.css` y la usa como fondo. *Pura arquitectura escalable.*

### 3. El Configurador de Clases (`tailwind.config.js`)
Configura qué carpetas tienen nuestros archivos de código para revisarlos y transformar cada clase (como `text-gray-500`) en CSS nativo a través de *NativeWind*.

---

¡Disfruta el código! 🤘 Todo está optimizado.
