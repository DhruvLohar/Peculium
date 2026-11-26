import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Loader from './Loader';

/**
 * Full-screen cover shown while the app decides where to route on launch.
 * Native has the splash screen for this; web has nothing, so without it the initial (auth) route
 * flashes before the redirect to home.
 */
const BootOverlay: React.FC = () => (
  <View style={StyleSheet.absoluteFill} className="z-50 items-center justify-center bg-background">
    <Loader />
  </View>
);

export default memo(BootOverlay);
