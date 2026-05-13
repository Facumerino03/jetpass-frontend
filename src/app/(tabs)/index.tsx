import { View, Text, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      {/* Sky Background */}
      <View className="absolute top-0 w-full h-[350px] bg-sky-200">
        <Image
          source={require("../../../assets/images/clouds.png")} 
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>
      
      {/* ScrollView for Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header Space to show the sky */}
        <View style={{ height: insets.top + 160 }} />

        {/* Main White Card Area */}
        <View 
          className="flex-1 bg-white rounded-t-[40px] px-6 pt-10"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 10,
          }}
        >

          {/* Space for the rest of the list / content */}
          <View className="pb-32">
             <View className="h-[400px] bg-gray-50 rounded-3xl items-center justify-center border border-gray-100">
               <Text className="text-gray-400 font-medium">Contenido Principal de JetPass</Text>
             </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
