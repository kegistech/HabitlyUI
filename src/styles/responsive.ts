// src/styles/responsive.ts
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design layout sizes (Standard iPhone frame baseline)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const isTablet = SCREEN_WIDTH >= 768;

/**
 * Scale sizes based on screen width
 */
export const scaleWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale sizes based on screen height
 */
export const scaleHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Moderate scale for fonts and padding to avoid oversize on tablets
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return Math.round(size + (scaleWidth(size) - size) * factor);
};

export const DEVICE = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isTablet,
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
};