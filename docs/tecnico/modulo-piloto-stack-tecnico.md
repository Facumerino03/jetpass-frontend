# Jetpass — Módulo del Piloto: Análisis Técnico en Profundidad

> **Componente:** `jetpass-frontend`  
> **Rol en la arquitectura:** Primer punto de entrada operativo — aplicación móvil del piloto  
> **Fecha de elaboración:** Junio 2026

---

## Índice

1. [Visión general del módulo](#1-visión-general-del-módulo)
2. [React Native y Expo SDK 55 — la plataforma base](#2-react-native-y-expo-sdk-55--la-plataforma-base)
3. [Expo Router — navegación basada en sistema de archivos](#3-expo-router--navegación-basada-en-sistema-de-archivos)
4. [TypeScript — el contrato del dominio aeronáutico](#4-typescript--el-contrato-del-dominio-aeronáutico)
5. [NativeWind + Tailwind CSS — sistema de estilos](#5-nativewind--tailwind-css--sistema-de-estilos)
6. [React 19 y el React Compiler — rendimiento automático](#6-react-19-y-el-react-compiler--rendimiento-automático)
7. [Gestión de estado — Context API deliberada](#7-gestión-de-estado--context-api-deliberada)
8. [Autenticación — JWT con rotación de tokens y almacenamiento seguro](#8-autenticación--jwt-con-rotación-de-tokens-y-almacenamiento-seguro)
9. [Capa de red — Fetch nativa con cliente propio](#9-capa-de-red--fetch-nativa-con-cliente-propio)
10. [Cartografía interactiva — react-native-maps y la capa nativa](#10-cartografía-interactiva--react-native-maps-y-la-capa-nativa)
11. [Gráficos vectoriales — react-native-svg](#11-gráficos-vectoriales--react-native-svg)
12. [Mapas en WebView — Leaflet embebido para previsualizaciones](#12-mapas-en-webview--leaflet-embebido-para-previsualizaciones)
13. [Capas meteorológicas — LibreWXR y OpenWeatherMap](#13-capas-meteorológicas--librewxr-y-openweathermap)
14. [Animaciones y gestos — Reanimated y Gesture Handler](#14-animaciones-y-gestos--reanimated-y-gesture-handler)
15. [Iconografía — Lucide React Native](#15-iconografía--lucide-react-native)
16. [Tipografía — Geist](#16-tipografía--geist)
17. [Sistema de variantes de componentes — CVA, clsx y tailwind-merge](#17-sistema-de-variantes-de-componentes--cva-clsx-y-tailwind-merge)
18. [Primitivos de interfaz — rn-primitives](#18-primitivos-de-interfaz--rn-primitives)
19. [Patrón arquitectónico del wizard — flujo de creación del FPL](#19-patrón-arquitectónico-del-wizard--flujo-de-creación-del-fpl)
20. [Seguridad en el cliente](#20-seguridad-en-el-cliente)
21. [Herramientas de desarrollo y calidad](#21-herramientas-de-desarrollo-y-calidad)
22. [Síntesis de decisiones técnicas](#22-síntesis-de-decisiones-técnicas)

---

## 1. Visión general del módulo

El módulo del piloto es, en términos de la arquitectura Jetpass, el origen del flujo de información. Es la interfaz donde el piloto construye, valida y envía un plan de vuelo (FPL) conforme al estándar ICAO, con asistencia en tiempo real de datos AIP, METAR/TAF y NOTAM provistos por el microservicio `jetpass-intelligence`.

Técnicamente, el módulo se materializa como una aplicación móvil nativa para Android e iOS (con capacidad de correr en web como fallback), construida íntegramente sobre el ecosistema de **Expo** y **React Native**. La elección de una aplicación móvil nativa para este componente no es arbitraria: la operación aeronáutica exige disponibilidad de información en condiciones de conectividad variable, interfaz táctil optimizada para uso en cabina o preflight, y acceso a sensores y funcionalidades del dispositivo que los entornos web no garantizan con la misma confiabilidad.

---

## 2. React Native y Expo SDK 55 — la plataforma base

### La tecnología

El proyecto declara en `package.json` las siguientes versiones centrales:

```
"expo": "~55.0.0"
"react-native": "0.83.6"
"react": "19.2.0"
```

### La decisión

La elección de **React Native** como runtime nativo se justifica desde varios ángulos simultáneamente.

**Un único código base, dos plataformas nativas.** La aplicación debe correr tanto en Android como en iOS. Desarrollar dos aplicaciones nativas independientes (Swift/Kotlin) requeriría duplicar el esfuerzo de implementación, las pruebas, y el mantenimiento de toda la lógica de negocio. React Native compila a componentes nativos reales, no a una WebView. Los `View`, `Text`, `ScrollView` y `Pressable` que aparecen a lo largo del código fuente se traducen en primitivos de la plataforma host (`UIView`, `TextView`, etc.), lo que garantiza el rendimiento y la experiencia de usuario propios de una app nativa.

**La elección de Expo sobre React Native bare.** Expo no es un simple wrapper: es un ecosistema completo de herramientas. Expo SDK 55 incluye un conjunto de módulos nativos precompilados, testeados y mantenidos por el equipo de Expo (`expo-secure-store`, `expo-haptics`, `expo-blur`, `expo-image`, `expo-splash-screen`, etc.). Utilizar el SDK de Expo significa delegar toda la complejidad de la capa nativa a un proveedor que la mantiene actualizada con cada nueva versión de iOS y Android. Para un proyecto académico o de MVP, esto reduce radicalmente el tiempo de configuración y elimina la necesidad de mantener configuraciones de Xcode y Android Studio propias para cada módulo nativo.

**Expo Application Services (EAS).** El archivo `app.json` está configurado para distribución via EAS, incluyendo `scheme: "jetpass"` para deep linking, configuración de íconos adaptativos para Android y soporte de tablet en iOS. EAS Build permite compilar la aplicación en la nube sin necesitar un Mac para la distribución iOS, y EAS Update permite desplegar actualizaciones de JavaScript (OTA updates) sin pasar por el ciclo de revisión de las tiendas.

**SDK 55 en particular.** La versión 55 alinea React Native 0.83.6 con React 19.2.0. Esta combinación es crítica porque habilita el **React Compiler** (detallado en la sección 6), que es una de las innovaciones más significativas en el ecosistema React de los últimos años.

---

## 3. Expo Router — navegación basada en sistema de archivos

### La tecnología

```
"expo-router": "~55.0.14"
```

El `package.json` define `"main": "expo-router/entry"`, haciendo de Expo Router el punto de entrada de toda la aplicación.

### La decisión

La navegación es uno de los problemas más complejos en aplicaciones móviles. Históricamente, React Native requería configurar React Navigation manualmente: registrar rutas, crear navegadores anidados, gestionar el estado del historial y tipar las props de navegación a mano. Expo Router adopta el paradigma de **enrutamiento basado en el sistema de archivos**, ya establecido en el ecosistema web por frameworks como Next.js.

**Convención sobre configuración.** La estructura de carpetas en `src/app/` define directamente la jerarquía de navegación. El archivo `src/app/(tabs)/_layout.tsx` declara las pestañas principales, y cada archivo dentro de `(tabs)/` representa una ruta navegable. Esto elimina la necesidad de mantener un registro de rutas centralizado y hace que la arquitectura de navegación sea intuitivamente legible a partir de la estructura de directorios.

**Typed Routes.** El `app.json` habilita explícitamente `"typedRoutes": true` bajo `experiments`. Esto genera automáticamente tipos TypeScript para todas las rutas declaradas en el filesystem. Cuando el código usa `router.push("/create-fpl")` o `router.replace("/(tabs)")`, TypeScript verifica en tiempo de compilación que esa ruta existe. Esto elimina una categoría entera de bugs de navegación: las rutas inválidas se convierten en errores de compilación.

**Integración con React Navigation.** Expo Router está construido sobre `@react-navigation/native` (versión 7.x en este proyecto), lo que garantiza compatibilidad con todos los patrones de navegación nativa: gestos de swipe para volver en iOS, el botón Back de Android, animaciones de transición nativas, etc. La navbar flotante personalizada (`FloatingNavbar`) se integra como un `tabBar` renderer propio, reemplazando la tab bar estándar de React Navigation sin perder ninguna de las funcionalidades subyacentes.

---

## 4. TypeScript — el contrato del dominio aeronáutico

### La tecnología

```
"typescript": "~5.9.2"
```

### La decisión

El dominio aeronáutico tiene una característica peculiar: está repleto de enumeraciones estrictas y estructuras de datos normalizadas por organismos internacionales (ICAO, ANAC). Un plan de vuelo no tiene "tipo de vuelo" libre: tiene exactamente cinco valores posibles: G, S, N, M o X. Las reglas de vuelo son exactamente cuatro: V, I, Y, Z. La categoría de turbulencia de estela tiene cuatro valores: L, M, H, J. Un aeródromo tiene secciones AIP tipificadas (`AD 2.1` hasta `AD 2.19`) con estructuras de datos específicas para cada una.

Toda esta rigidez normativa se refleja directamente en el sistema de tipos de TypeScript. El archivo `src/features/flight-plans/types.ts` encapsula este contrato:

```typescript
export type FlightRules = "V" | "I" | "Y" | "Z";
export type FlightType = "G" | "S" | "N" | "M" | "X";
export type WakeTurbulenceCat = "L" | "M" | "H" | "J";
export type FlightPlanStatus =
  | "draft" | "filed" | "pending_approval" | "accepted"
  | "rejected" | "active" | "closed" | "cancelled";
```

Y las secciones AIP son un discriminated union complejo:

```typescript
export type AIPSection =
  | (AIPSectionBase & { section_id: "AD 2.1"; data: Ad21Data })
  | (AIPSectionBase & { section_id: "AD 2.2"; data: Ad22Data })
  | (AIPSectionBase & { section_id: "AD 2.12"; data: Ad212Data })
  // ...
```

Esta definición garantiza que cuando el código accede a una sección AIP, TypeScript puede inferir exactamente qué campos tiene `data` según el discriminante `section_id`. Esto convierte errores potenciales de runtime (acceder a un campo inexistente) en errores de compilación detectados antes de llegar al dispositivo.

**TypeScript como documentación ejecutable.** La interfaz `FlightPlanPublic` tiene 30+ campos, muchos de ellos opcionales con semántica específica. Sin tipos, cada desarrollador que consuma la respuesta del API tendría que consultar la documentación del backend. Con TypeScript, la IDE infiere y autocompete cada campo con su tipo correcto. La interfaz `IntelligenceRunResponse` agrupa en un solo tipo las respuestas de AIP, METAR/TAF y NOTAM, haciendo explícita la estructura de lo que provee `jetpass-intelligence`.

**Configuración estricta.** La versión 5.9.2 (en el rango `~5.9.2`) es la más reciente del compilador TypeScript, con soporte para todas las características de inferencia avanzada que el React Compiler require.

---

## 5. NativeWind + Tailwind CSS — sistema de estilos

### La tecnología

```
"nativewind": "^4.2.3"
"tailwindcss": "^3.4.19"
"tailwind-merge": "^3.5.0"
"tailwindcss-animate": "^1.0.7"
```

### La decisión

El styling en React Native es, por defecto, verboso y limitado. La API de `StyleSheet.create()` nativa produce estilos inline en JavaScript, con nomenclaturas divergentes respecto a CSS, sin soporte para pseudoclases, sin variables de diseño ni tokens compartidos. Para cada componente hay que crear un objeto de estilos, nombrarlo, y referenciar cada clave por su nombre. El resultado es código difícil de leer y mantener.

**NativeWind** resuelve este problema llevando el paradigma de **Tailwind CSS** a React Native. En lugar de definir hojas de estilos separadas, los estilos se expresan directamente como clases utility en la prop `className`:

```jsx
<View className="flex-1 bg-white">
  <Text className="text-4xl font-bold leading-tight text-zinc-950">
    Revisión final
  </Text>
</View>
```

Esta aproximación tiene ventajas concretas para el proyecto:

**Consistencia de diseño sistémica.** El sistema de colores de Tailwind (`zinc-950`, `emerald-500`, `sky-50`, `red-700`) garantiza que todos los componentes comparten la misma paleta de diseño. No hay colores hardcodeados dispersos en el código: existe una escala canónica de colores, espaciados y tipografías que se aplica uniformemente.

**Velocidad de desarrollo.** Las clases utility eliminan la fricción entre "necesito este margen" y "escribir el estilo". Un desarrollador puede construir una interfaz compleja sin salir del JSX, lo que acelera significativamente las iteraciones de diseño.

**Coexistencia con `StyleSheet`.** NativeWind no prohíbe `StyleSheet.create()`. En los componentes donde el styling requiere propiedades no soportadas por Tailwind (como `shadowOffset` en iOS o `elevation` en Android), el proyecto usa `StyleSheet.create()` explícitamente (como se ve en `step4-route.tsx`). Esta coexistencia es la práctica recomendada por el equipo de NativeWind.

**NativeWind v4 específicamente.** La versión 4 de NativeWind abandona el polyfilling de clases CSS en JavaScript (que tenía overhead de runtime) y adopta una arquitectura donde el compilador de TailwindCSS genera estilos nativos en tiempo de build. Esto elimina el costo de procesamiento en el dispositivo.

---

## 6. React 19 y el React Compiler — rendimiento automático

### La tecnología

```
"react": "19.2.0"
```

```json
// app.json
"experiments": {
  "typedRoutes": true,
  "reactCompiler": true
}
```

### La decisión

React 19 introduce cambios fundamentales en cómo el runtime gestiona el ciclo de vida de los componentes. El más importante para este proyecto es el **React Compiler** (anteriormente conocido como React Forget), habilitado explícitamente en `app.json`.

**El problema que resuelve.** En React, el rendimiento ha dependido históricamente de la memoización manual: `React.useMemo`, `React.useCallback` y `React.memo`. El código del wizard de planes de vuelo (`flight-plan-wizard.tsx`) tiene múltiples callbacks que deben ser estables entre renders para evitar re-renderizados innecesarios de los pasos del wizard. Sin el compilador, esto requiere `useCallback` en cada función del handler. Con el React Compiler, el compilador analiza el código en tiempo de build y aplica memoización automática donde es seguro hacerlo, eliminando la necesidad de gestión manual.

**Observación en el código fuente.** Si bien el código del wizard usa `React.useCallback` y `React.useMemo` explícitamente (lo cual sigue siendo válido), la habilitación del React Compiler como experimento indica que el proyecto está preparado para la transición hacia la versión estable del compilador, donde estos decoradores manuales serán opcionales o redundantes.

**React 19 y las acciones.** React 19 introduce también el concepto de `useActionState` y mejoras en la gestión de formularios. Si bien el proyecto no lo usa aún (los pasos del wizard gestionan su estado localmente), la adopción de React 19 posiciona la base de código para incorporar estas capacidades en futuras iteraciones.

**Concurrent Mode por defecto.** React 19 hace que el modo concurrente sea el default. Esto significa que React puede interrumpir renders de baja prioridad para responder a interacciones del usuario, lo que se traduce en una UI más fluida durante operaciones costosas como el guardado de cada paso del wizard.

---

## 7. Gestión de estado — Context API deliberada

### La tecnología

```
React.createContext + React.useContext + React.useReducer/useState
```

No hay Redux, Zustand, Jotai, ni ninguna librería externa de gestión de estado.

### La decisión

La gestión de estado es uno de los problemas más sobre-ingenierizados del ecosistema React. La pregunta correcta no es "¿qué librería de estado usar?", sino "¿cuánto estado global necesita realmente esta aplicación?".

**Análisis del estado de la aplicación.** El estado del módulo del piloto se organiza en tres capas:

1. **Estado de autenticación:** un único objeto de sesión (`AuthSession`) que incluye tokens y datos del usuario. Es global pero raramente cambia. Se gestiona con `AuthContext` (Context API + `useState`).

2. **Estado del wizard:** los campos del plan de vuelo en construcción. Este estado es local al componente `FlightPlanWizard` y se destruye cuando el wizard se cierra. No tiene ningún motivo para ser global.

3. **Estado de vistas:** pestañas activas, estados de carga, errores inline. Es estrictamente local a cada componente.

Esta estructura hace que no exista estado global suficientemente complejo como para justificar una librería externa. La Context API de React nativo cubre perfectamente el caso del estado de autenticación, con la ventaja de no añadir dependencias externas ni conceptos adicionales (actions, reducers, stores, selectors) que incrementarían la curva de aprendizaje.

**`AuthContext` como patrón.** La implementación en `auth-context.tsx` es un ejemplo limpio de este enfoque: un provider que encapsula toda la lógica de ciclo de vida de la sesión (restauración, refresco automático, logout), y un hook `useAuth()` que expone exactamente la interfaz necesaria. Los componentes consumidores no saben nada sobre tokens ni sobre `expo-secure-store`: solo interactúan con `{ user, login, logout, isLoading }`.

---

## 8. Autenticación — JWT con rotación de tokens y almacenamiento seguro

### La tecnología

```
"expo-secure-store": "~55.0.13"
```

### La decisión

La autenticación en el módulo del piloto implementa el estándar OAuth 2.0 con tokens JWT de corta duración y refresh tokens de larga duración. Este patrón es la práctica de la industria para aplicaciones móviles por razones bien fundamentadas.

**El flujo implementado.** Al iniciar sesión, el backend retorna un `AuthTokenResponse` con cuatro campos clave:

```typescript
type AuthTokenResponse = {
  access_token: string;   // JWT de corta duración (Bearer)
  refresh_token: string;  // Token de larga duración para renovar acceso
  token_type: string;
  expires_in: number;     // Segundos hasta expiración del access token
  user: UserPublic;
};
```

El cliente almacena `expires_at = Date.now() + expires_in * 1000` para saber cuándo expira el token sin necesidad de decodificarlo. El `AuthContext` registra un `setTimeout` que se activa con un buffer de 30 segundos antes del vencimiento para solicitar proactivamente un nuevo `access_token` usando el `refresh_token`. Si el refresco falla (token revocado, expirado o invalido), la sesión se limpia y el usuario es redirigido a la pantalla de login.

**Por qué no usar cookies de sesión.** Las cookies de sesión son el mecanismo estándar en aplicaciones web, pero en el contexto móvil no tienen soporte nativo equivalente. Los tokens JWT almacenados en el cliente son el mecanismo apropiado para aplicaciones móviles, combinados con un almacenamiento seguro.

**`expo-secure-store` como keystore nativo.** El módulo `expo-secure-store` expone la misma API abstracta (`getItemAsync`, `setItemAsync`, `deleteItemAsync`) que internamente usa:
- **iOS:** el llavero de Keychain Services, encriptado por el hardware del dispositivo y vinculado a las credenciales biométricas del usuario.
- **Android:** el Android Keystore System con encriptación AES-256.

Esto garantiza que si el dispositivo es comprometido y se extrae el filesystem, los tokens no son legibles sin las credenciales del sistema operativo. La implementación en `session-storage.ts` gestiona correctamente el fallback a `localStorage` para la versión web.

**Identificador de dispositivo.** El campo `device_name` en el request de login (`"JetPass Android Emulator"`) sigue el patrón de autenticación de dispositivos, permitiendo al backend invalidar sesiones selectivamente por dispositivo, lo que es relevante para gestión de tokens en entornos multi-dispositivo.

---

## 9. Capa de red — Fetch nativa con cliente propio

### La tecnología

No hay `axios`, `react-query`, `swr` ni ningún cliente HTTP externo. La capa de red se implementa íntegramente en `src/lib/api.ts` usando la API `fetch` nativa del runtime JavaScript.

### La decisión

La elección de no usar Axios es una decisión de ingeniería deliberada. Axios añade ~14KB al bundle y una API con cierta complejidad (interceptores, instancias, cancelación). Para una aplicación donde todos los requests siguen un patrón uniforme (JSON in, JSON out, Bearer auth), una función `apiRequest` de ~50 líneas provee exactamente la misma funcionalidad sin overhead.

**El `apiRequest` custom.** La función en `src/lib/api.ts` implementa:

1. Inyección automática de `Content-Type: application/json` cuando hay body.
2. Inyección del `Authorization: Bearer <token>` cuando se provee `accessToken`.
3. Parsing del body de respuesta como texto primero y luego JSON, lo que evita excepciones cuando el servidor retorna 204 No Content.
4. Mapeo de errores HTTP a una clase `ApiError` personalizada que preserva el `status` HTTP y el `payload` completo, permitiendo que los consumidores distingan entre un 401 (sesión expirada), un 422 (error de validación) y un 500 (error de servidor).
5. Extracción del mensaje de error de validación de FastAPI: el backend FastAPI retorna errores de validación como `{ "detail": [{ "msg": "...", "loc": [...] }] }`, y el cliente tiene lógica específica para extraer el primer mensaje legible de este formato.

**Por qué no React Query.** React Query es la herramienta correcta cuando se necesita caching de datos del servidor, sincronización en background, paginación e invalidación de cache. En el flujo del wizard, los datos del plan de vuelo son _transaccionales_: cada paso hace un `PATCH` al backend y el estado local refleja la respuesta. No hay un "cache de servidor" que administrar. La complejidad adicional de React Query no justificaría el valor que aportaría en este contexto.

---

## 10. Cartografía interactiva — react-native-maps y la capa nativa

### La tecnología

```
"react-native-maps": "^1.27.2"
```

Configuración en `app.json` (la key se inyecta desde `.env` vía `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`):
```json
["react-native-maps", {
  "androidGoogleMapsApiKey": "${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}"
}]
```

### La decisión

El paso 4 del wizard (definición de ruta) es el componente más sofisticado de la aplicación. Cuando el piloto ingresa su ruta, se le presenta un mapa interactivo con la representación visual del trayecto origen-destino, junto con capas meteorológicas superpuestas en tiempo real.

**`react-native-maps`** es la librería estándar para cartografía nativa en React Native. Usa **Google Maps SDK** en Android (de ahí la necesidad de una API key) y **Apple Maps** en iOS. Ambos proveedores son SDKs nativos que se compilan directamente en la aplicación, ofreciendo rendimiento de mapa fluido a 60fps, gesturas nativas de zoom/pan/rotate, y acceso a tiles de alta resolución con caché local. Esto es fundamentalmente distinto a una solución basada en WebView con Leaflet, que sufre de latencia en gestures y no se integra con el compositor nativo de la plataforma.

**La curva de la gran circunferencia.** El archivo `immersive-route-hero.native.tsx` implementa desde cero el algoritmo de **gran circunferencia** (great-circle path):

```typescript
function greatCirclePoints(p1: Coord, p2: Coord, n: number): Coord[] {
  // Implementación de la fórmula de Haversine con interpolación esférica
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
  ));
  // ...
}
```

Esta implementación genera 72 puntos interpolados en la superficie esférica de la Tierra entre los dos aeródromos y los renderiza como una serie de `Polyline` discontinuas que forman la línea punteada del trayecto. La decisión de implementar la matemática esférica directamente, en lugar de usar una librería de geometría, responde a que la dependencia para esta función específica sería desproporcionada respecto a su simplicidad.

**Capas de tiles de OpenStreetMap para `UrlTile`.** El componente `react-native-maps` permite superponer tiles de cualquier servidor XYZ mediante `UrlTile`. Esto es la base sobre la que se integran las capas meteorológicas.

**Fallback SVG para web y plataformas sin soporte.** El archivo `immersive-route-hero.tsx` (la versión web, sin extensión `.native.tsx`) implementa el mismo componente usando `react-native-svg` con un arco cuadrático de Bézier en lugar del mapa nativo. Expo Router usa la convención de extensiones de plataforma (`.native.tsx` para iOS/Android, `.tsx` para web) para servir la implementación correcta a cada plataforma. Esta separación garantiza que la funcionalidad crítica funcione incluso en contextos donde `react-native-maps` no está disponible.

---

## 11. Gráficos vectoriales — react-native-svg

### La tecnología

```
"react-native-svg": "15.15.3"
```

### La decisión

`react-native-svg` provee una implementación completa de la API SVG del DOM web en el contexto de React Native. Es el estándar de facto para gráficos vectoriales en React Native.

Su uso más visible en el proyecto está en la versión web del `ImmersiveRouteHero` (`immersive-route-hero.tsx`), donde el trayecto se renderiza como un arco cuadrático de Bézier sobre un fondo degradado:

```typescript
const ARC_PATH = `M ${ARC_START_X} ${ARC_START_Y} Q ${ARC_CTRL_X} ${ARC_CTRL_Y} ${ARC_END_X} ${ARC_END_Y}`;
// ...
<Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${VW} ${VH}`}>
  <Defs>
    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor="#0EA5E9" />
      <Stop offset="100%" stopColor="#FFFFFF" />
    </LinearGradient>
  </Defs>
  <Rect fill="url(#grad)" />
  <Path d={ARC_PATH} stroke="rgba(255,255,255,0.70)" strokeDasharray="6,8" />
  <Circle cx={ARC_START_X} cy={ARC_START_Y} r={9} fill="white" />
</Svg>
```

La ventaja de SVG sobre imágenes rasterizadas para este caso de uso es doble: el degradado y el arco se adaptan fluidamente a cualquier resolución de pantalla y tamaño de dispositivo sin pérdida de calidad, y los colores se pueden parametrizar dinámicamente en JavaScript.

---

## 12. Mapas en WebView — Leaflet embebido para previsualizaciones

### La tecnología

```
"react-native-webview": "13.16.0"
```

### La decisión

El componente `AerodromePreviewMap` presenta una situación de ingeniería interesante: necesita mostrar un mapa de ubicación del aeródromo dentro de un `BottomSheet` modal (la hoja de información AIP). Usar `react-native-maps` aquí crearía problemas de compositing con el modal y aumentaría el peso de la pantalla.

La solución adoptada es elegante: se genera un documento HTML completo en JavaScript que carga **Leaflet** (librería de mapas web de código abierto) vía CDN, y se sirve dentro de un `WebView`. El mapa se renderiza con tiles de OpenStreetMap, que son libres y no requieren API key.

```typescript
function buildLeafletHtml(lat: number, lng: number, coordinatesLabel: string): string {
  return `<!DOCTYPE html>...
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([lat, lng]).addTo(map);
  ...`;
}
```

**Por qué no `react-native-maps` aquí también.** `react-native-maps` tiene problemas conocidos cuando se embebe dentro de componentes con `position: absolute` y transformadas de animación (como los bottom sheets). La aproximación de WebView evita estas fricciones. Además, al ser una previsualización de contexto (no el mapa operativo principal), la latencia adicional de la WebView es aceptable.

**Consideración de seguridad.** El HTML se construye escapando las variables de entrada (`coordinatesLabel.replace(/'/g, "\\'")`) para prevenir inyección de código. La prop `originWhitelist={["*"]}` en el WebView es aceptable para HTML generado localmente.

---

## 13. Capas meteorológicas — LibreWXR y OpenWeatherMap

### La tecnología

```typescript
// immersive-route-hero.native.tsx
async function fetchLibreWxrData(): Promise<LibreWxrData> {
  const res = await fetch("https://api.librewxr.net/public/weather-maps.json");
  // ...
}
const OWM_API_KEY = process.env.EXPO_PUBLIC_OWM_API_KEY ?? "";
```

### La decisión

La integración de datos meteorológicos en el mapa de ruta es una de las funcionalidades de mayor valor para el piloto. La elección de proveedores responde a un diseño en capas:

**LibreWXR para radar y satélite.** LibreWXR es una API pública que agrega datos de radar meteorológico (NEXRAD nivel III) y satélite infrarrojo. Sus tiles usan el esquema de colores NEXRAD estándar en aviación, lo que hace que la capa de radar sea inmediatamente interpretable para un piloto. La API retorna un JSON con la URL de los tiles más recientes y los frames de nowcast (predicción a corto plazo), permitiendo la función de reproducción animada del pronóstico.

**OpenWeatherMap para capas analíticas.** Para capas como viento, precipitación, temperatura y presión, se usa OpenWeatherMap. Estas capas no son operacionales (un piloto no toma decisiones de vuelo basadas en ellas), sino informativas, y OWM las provee con buena cobertura global y a un costo razonable.

**Tiles XYZ sobre `UrlTile`.** Toda la integración se hace via el componente `UrlTile` de `react-native-maps`, que consume cualquier servidor de tiles en formato XYZ (`{z}/{x}/{y}`). Esto desacopla la lógica de negocio del proveedor específico: cambiar de OWM a otra fuente requeriría solo actualizar la URL del tile.

**Animación del nowcast.** La secuencia de frames de predicción meteorológica se anima con un `setInterval` que cicla por los frames de nowcast cada 900ms. Este mecanismo es simple y efectivo: no requiere librerías de animación externas para una funcionalidad que es esencialmente una presentación de slides.

---

## 14. Animaciones y gestos — Reanimated y Gesture Handler

### La tecnología

```
"react-native-reanimated": "4.2.1"
"react-native-gesture-handler": "~2.30.0"
"react-native-worklets": "0.7.4"
```

### La decisión

`react-native-reanimated` y `react-native-gesture-handler` son las herramientas de animación y gestos estándar del ecosistema React Native moderno, y vienen incluidas como dependencias del stack de Expo Router.

**Reanimated 4.** La versión 4 de Reanimated introduce el módulo `react-native-worklets` como dependencia separada. Los worklets son funciones JavaScript que se ejecutan en el hilo de UI nativo (no en el hilo JS), lo que garantiza animaciones fluidas a 60fps incluso cuando el hilo JS está ocupado con lógica de negocio. Esta arquitectura es fundamental para transiciones de pantalla suaves y animaciones reactivas a gestos del usuario.

**Gesture Handler.** Remplaza el sistema de gestos de React Native por uno que procesa los events táctiles directamente en el hilo nativo, sin pasar por el bridge JS. Esto elimina el lag entre el dedo del usuario y la respuesta visual, que es perceptible en el sistema de gestos estándar.

**Su presencia justificada.** Aunque el código actual del proyecto no expone worklets o animaciones complejas visiblemente (los componentes usan principalmente estilos estáticos), estas librerías son requeridas como peers por Expo Router y por la implementación del bottom sheet modal de la aplicación. Son la infraestructura de animación sobre la que se construye la experiencia de navegación nativa.

---

## 15. Iconografía — Lucide React Native

### La tecnología

```
"lucide-react-native": "^1.14.0"
```

### La decisión

Lucide es una librería de iconos SVG de código abierto, fork mantenido de Feather Icons, con una biblioteca de más de 1500 iconos. La variante `lucide-react-native` renderiza cada icono como SVG nativo usando `react-native-svg`.

La elección de Lucide sobre las alternativas habituales (`@expo/vector-icons` con fuentes de iconos como Material Icons o FontAwesome) es una decisión de coherencia visual y flexibilidad técnica.

**Iconos como SVG vs. fuentes.** Los iconos basados en fuentes (`@expo/vector-icons`) se renderizan como texto con un glifo especial. Tienen limitaciones: no soportan stroke width variable, gradientes ni animaciones de path. Los iconos SVG de Lucide son vectores reales: se puede controlar `size`, `color`, `strokeWidth` y cualquier prop SVG directamente desde el componente React. En el código se usa esto consistentemente:

```jsx
<ChevronRight size={28} color="#ffffff" />
<X size={24} color="#3f3f46" strokeWidth={2} />
<Clock size={11} color="white" strokeWidth={2.5} />
```

La variación de `strokeWidth` entre iconos según el contexto (2.2 en la navbar, 2.5 en el pill de EET) es posible precisamente porque son SVG, no glifos de fuente.

**Tree-shaking.** Lucide exporta cada icono como un componente independiente. El bundler de Expo incluye solo los iconos que se importan, manteniendo el bundle size bajo.

---

## 16. Tipografía — Geist

### La tecnología

```
"geist": "^1.7.0"
```

Registrada en `app.json` como fuente estática:
```json
"fonts": [
  "./assets/fonts/Geist-Regular.ttf",
  "./assets/fonts/Geist-Medium.ttf",
  "./assets/fonts/Geist-SemiBold.ttf",
  "./assets/fonts/Geist-Bold.ttf",
  "./assets/fonts/GeistMono-Regular.ttf"
]
```

### La decisión

**Geist** es la tipografía de sistema diseñada por Vercel, lanzada en 2023 como fuente open-source. Es una sans-serif geométrica optimizada para interfaces de usuario digitales con énfasis en legibilidad a tamaños pequeños y alta densidad de información.

**Por qué Geist en una aplicación de aviación.** Los planes de vuelo están llenos de códigos alfanuméricos: identificadores ICAO (cuatro letras mayúsculas), velocidades (N0120), niveles de vuelo (A045, FL180), rutas (DCT GUALE DCT), frecuencias de radio (122.80), coordenadas. La aplicación necesita una fuente que distinga claramente entre `0` (cero) y `O` (letra o), entre `1` (uno), `l` (ele) e `I` (i mayúscula). Geist tiene un diseño de cifras que resuelve esta ambigüedad.

**GeistMono para datos técnicos.** La variante monoespaciada `GeistMono-Regular` se usa específicamente para campos donde el alineamiento columnar es importante: códigos ICAO, identificaciones de aeronaves, y datos del AIP. En el código:

```jsx
<Text className="font-mono text-2xl font-bold text-zinc-950">{aipData.icao}</Text>
```

La clase `font-mono` de NativeWind apunta a GeistMono, haciendo que los identificadores ICAO se distingan visualmente del texto de interfaz.

---

## 17. Sistema de variantes de componentes — CVA, clsx y tailwind-merge

### La tecnología

```
"class-variance-authority": "^0.7.1"
"clsx": "^2.1.1"
"tailwind-merge": "^3.5.0"
```

Y su utilitario en `src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### La decisión

Este trío de librerías es el estándar de facto en el ecosistema de componentes con Tailwind, popularizado por la librería shadcn/ui en el ecosistema web y adoptado aquí para React Native.

**El problema.** Tailwind genera conflictos cuando se combinan clases para la misma propiedad CSS. Por ejemplo: `className="rounded-xl rounded-2xl"` debería resultar en `rounded-2xl`, pero sin `tailwind-merge`, ambas clases se aplican y el resultado es indeterminado según el orden en la hoja de estilos generada.

**`clsx`** es una utilidad de ~300 bytes que acepta cualquier combinación de strings, arrays y objetos para construir un string de clases CSS condicionalmente. Reemplaza patrones como:
```typescript
`btn ${isActive ? 'btn-active' : ''} ${isDisabled ? 'btn-disabled' : ''}`
```
con:
```typescript
cn("btn", isActive && "btn-active", isDisabled && "btn-disabled")
```

**`tailwind-merge`** se encarga de resolver los conflictos de clases Tailwind, dando prioridad a la última clase específica para cada propiedad.

**`class-variance-authority` (CVA)** es una utilidad para definir variantes de componentes de forma tipada. Se usa en los componentes base de la UI (`/components/ui/`) para definir cómo varía el estilo de un componente según sus props (variant, size, intent, etc.), manteniendo la type-safety de TypeScript.

---

## 18. Primitivos de interfaz — rn-primitives

### La tecnología

```
"@rn-primitives/portal": "^1.4.0"
"@rn-primitives/slot": "^1.4.0"
```

### La decisión

`rn-primitives` es una librería de componentes headless accesibles para React Native, inspirada en el ecosistema Radix UI del mundo web.

**`@rn-primitives/portal`** implementa el patrón de portal: permite renderizar un componente fuera de su posición en el árbol de React, directamente sobre el root de la aplicación. Esto es esencial para modales, tooltips, dropdowns y sheets: sin portal, estos elementos quedarían truncados por los límites de overflow de sus contenedores padres.

**`@rn-primitives/slot`** implementa el patrón de composición por slot (o "as child"): permite que un componente padre pase sus props a un componente hijo arbitrario, en lugar de renderizar un elemento propio. Esto habilita patrones de composición avanzados sin sacrificar la flexibilidad del árbol de componentes.

Estos primitivos son la base sobre la que se construyen los componentes de UI más complejos del proyecto (dropdowns, comboboxes, selection cards) garantizando que sean accesibles y componibles.

---

## 19. Patrón arquitectónico del wizard — flujo de creación del FPL

### El componente

`src/features/flight-plans/flight-plan-wizard.tsx`

### La decisión

El wizard de creación del plan de vuelo es el componente más complejo de la aplicación y materializa varias decisiones de diseño importantes.

**Wizard de 7 pasos con sub-pasos.** La creación de un FPL ICAO implica capturar decenas de campos técnicos. Presentar un formulario monolítico sería abrumador para el usuario. La división en 7 pasos temáticos (viaje, tipo de operación, aeronave, ruta, velocidad y nivel, operacional del día, revisión final) fragmenta la carga cognitiva en unidades coherentes.

**El paso 1 tiene sub-pasos propios.** La selección de aeródromos (salida, destino, alternativas 1 y 2) se gestiona como un wizard dentro del wizard, con `step1SubStep` como índice interno. Esto refleja que la selección de aeródromos no es solo un campo: cada aeródromo desencadena un flujo de búsqueda asistida con el combobox conectado a `jetpass-intelligence`.

**Persistencia incremental en el backend.** El patrón más importante del wizard es que **no acumula el formulario en el cliente para enviarlo todo al final**. Cada paso hace una llamada al backend:

- Paso 1 → `POST /flight-plans` (crea el draft)
- Pasos 2 a 7 → `PATCH /flight-plans/{id}` (actualiza campos específicos)
- Paso 7 → `POST /flight-plans/{id}/submit` (transición de estado)

Esto garantiza que el progreso no se pierde si la aplicación se interrumpe (llamada telefónica, cierre accidental). El `FlightPlanPublic` que el servidor retorna en cada PATCH es la fuente de verdad del estado del plan, y el cliente simplemente lo refleja. Este patrón es técnicamente conocido como "formulario transaccional" o "multi-step form with server persistence".

**Barra de progreso visual.** El componente `WizardProgressBar` traduce el progreso numérico en una serie de indicadores visuales (`bg-emerald-500` para completados, `bg-zinc-200` para pendientes). Proporciona al piloto una referencia inmediata de cuánto falta del proceso.

**El paso de ruta como vista inmersiva.** El paso 4 (ruta) rompe el layout del wizard estándar. El componente `Step4Route` ocupa toda la pantalla con el mapa interactivo como hero, y desplaza el panel de inputs (ruta y EET) hacia abajo en un bottom panel con elevación. Este tratamiento diferenciado responde a que la ruta es el dato más visual del FPL: el piloto necesita ver geográficamente el trayecto mientras ingresa la cadena de waypoints.

---

## 20. Seguridad en el cliente

### Almacenamiento seguro

Como se detalló en la sección 8, los tokens JWT se almacenan exclusivamente en el keystore nativo del sistema operativo via `expo-secure-store`, nunca en `AsyncStorage` (que persiste en texto plano en el filesystem) ni en memoria volátil.

### Tokens de corta duración

La rotación automática de tokens con un buffer de 30 segundos antes del vencimiento minimiza la ventana de exposición de un token potencialmente comprometido.

### Protección de API Keys

Las keys de APIs externas (Google Maps, OpenWeatherMap) se gestionan a través de variables de entorno en `.env` (nunca commiteadas). El prefijo `EXPO_PUBLIC_` indica que la variable es intencionalmente expuesta al cliente (patrón estándar en Expo para distinguir secretos de servidor de keys públicas). En `app.json`, `react-native-maps` referencia `${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`; Expo la resuelve en tiempo de build e inyecta el valor en `AndroidManifest.xml`. Ver `.env.example` para las variables requeridas.

### No hay secretos de servidor en el cliente

El cliente no tiene acceso a ninguna credencial del backend, base de datos, ni a claves privadas de la blockchain. La comunicación se hace exclusivamente mediante tokens JWT emitidos por el backend.

### HTTPS en producción

La configuración de `app.json` incluye `"usesCleartextTraffic": true` en Android, habilitado explícitamente para el entorno de desarrollo (el emulador Android accede al servidor local en `10.0.2.2:8000` sin TLS). En producción, esta configuración se deshabilitaría y la API_BASE_URL en `src/lib/api.ts` apuntaría a un endpoint HTTPS.

---

## 21. Herramientas de desarrollo y calidad

### TypeScript estricto

```
"typescript": "~5.9.2"
```

TypeScript 5.9 en el rango `~5.9.2` garantiza compatibilidad con todas las características del React Compiler y las type utilities más recientes de React 19.

### ESLint con configuración Expo

```
"eslint": "^9.25.0"
"eslint-config-expo": "~55.0.0"
```

`eslint-config-expo` extiende las reglas base de ESLint con las convenciones específicas del ecosistema Expo: importaciones de módulos nativos, uso correcto de hooks, y reglas de accesibilidad para componentes React Native.

### patch-package

```
"patch-package": "^8.0.1"
```

`patch-package` permite aplicar parches a dependencias de npm sin hacer fork de los repositorios. El script `"postinstall": "patch-package"` aplica los parches automáticamente después de cada `npm install`. Es la solución práctica para bugs en dependencias de terceros que aún no tienen fix publicado en su versión de npm, lo cual es común en el ecosistema React Native donde la cadencia de actualizaciones es alta.

### Arquitectura de features

La organización del código sigue un patrón de **Features-based architecture** (arquitectura orientada a características). En lugar de separar el código por tipo técnico (`components/`, `services/`, `hooks/`), se organiza por dominio funcional:

```
src/
  features/
    auth/          # Autenticación: context, API, storage, tipos
    flight-plans/  # Planes de vuelo: wizard, API, tipos, vistas
    aircraft/      # Aeronaves: listado, API, tipos
  components/
    ui/            # Componentes base reutilizables (design system)
  lib/
    api.ts         # Cliente HTTP base
    utils.ts       # Utilidades transversales
    theme.ts       # Tokens de diseño
  app/             # Rutas (Expo Router)
```

Esta organización hace que el código de cada dominio sea autónomo: para entender cómo funciona la autenticación, se lee el directorio `features/auth/`. No hay que navegar entre múltiples carpetas de types, services y components para reconstruir el flujo.

---

## 22. Síntesis de decisiones técnicas

La tabla siguiente condensa las decisiones técnicas clave con su justificación en una línea:

| Componente | Tecnología | Justificación central |
|---|---|---|
| Plataforma móvil | React Native 0.83.6 | Un codebase, dos plataformas nativas, sin WebView |
| SDK y toolchain | Expo SDK 55 | Módulos nativos mantenidos, EAS build/update sin Xcode propio |
| Navegación | Expo Router (file-based) | Typed routes, convención sobre configuración, zero-config |
| Tipado | TypeScript 5.9 | Dominio aeronáutico con enumeraciones ICAO estrictamente tipadas |
| Estilos | NativeWind v4 + Tailwind | Utility-first, design system sistémico, sin StyleSheet verboso |
| Rendimiento | React 19 + React Compiler | Memoización automática, concurrent rendering por defecto |
| Estado global | Context API | No hay estado global suficientemente complejo para una librería externa |
| Autenticación | JWT + Refresh + SecureStore | Standard OAuth 2.0 con keystore nativo (Keychain iOS / Keystore Android) |
| HTTP client | fetch nativa + apiRequest custom | Sin overhead de Axios, adaptado exactamente al contrato FastAPI del backend |
| Mapas nativo | react-native-maps + Google Maps | Rendimiento nativo a 60fps, gestures nativas, tiles de alta resolución |
| Ruta visual | Gran circunferencia propia | Representación geoespacialmente correcta del trayecto sobre la esfera terrestre |
| Capas met. | LibreWXR + OpenWeatherMap tiles | NEXRAD estándar aviación + capas analíticas sin dependencia de librería especializada |
| Mapas en modal | WebView + Leaflet | Evita conflictos de compositing de react-native-maps en bottom sheets |
| SVG | react-native-svg | Gráficos vectoriales nativos, soporte para degradados y paths animables |
| Animaciones | Reanimated 4 + Worklets | Animaciones en hilo UI, 60fps independiente del hilo JS |
| Iconos | lucide-react-native | SVG puro con strokeWidth variable, tree-shaking, +1500 iconos |
| Tipografía | Geist + GeistMono | Legibilidad en códigos alfanuméricos aeronáuticos, distinción 0/O/1/l |
| Variantes UI | CVA + clsx + tailwind-merge | Sistema de componentes tipado, resolución de conflictos de clases Tailwind |
| Wizard | 7 pasos con persistencia incremental | FPL recuperable ante interrupción, servidor como fuente de verdad en cada paso |
| Parches nativos | patch-package | Fixes de bugs en dependencias sin esperar ciclos de release de terceros |

---

*Este documento describe el estado técnico del módulo del piloto (`jetpass-frontend`) en la versión correspondiente al Expo SDK 55 / React Native 0.83.6 / React 19.2.0, con fecha de referencia junio de 2026.*
