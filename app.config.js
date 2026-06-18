const appJson = require("./app.json");

/**
 * Expo does not expand ${EXPO_PUBLIC_*} inside app.json plugin configs.
 * This file injects EXPO_PUBLIC_GOOGLE_MAPS_API_KEY at prebuild time.
 */
module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const plugins = (config.plugins ?? appJson.expo.plugins).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "react-native-maps") {
      return [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: googleMapsApiKey,
        },
      ];
    }
    return plugin;
  });

  return {
    ...config,
    plugins,
  };
};
