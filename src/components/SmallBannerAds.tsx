import {
  StyleSheet,
  View,
  Platform
} from 'react-native';
import { useRef} from 'react';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';

const adUnitId = 'ca-app-pub-6140620759463529/2619411470';
const adUnitIdIOS = 'ca-app-pub-6140620759463529/8936342159';


function SmallBannerAds() {
  const bannerRef = useRef<BannerAd>(null);

  return (
    <View style={styles.bannerContainer}>
      <BannerAd
        ref={bannerRef}
        unitId={Platform.OS=="android"? adUnitId:adUnitIdIOS}
        size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
      />
    </View>
    )
}

export default SmallBannerAds;
const styles = StyleSheet.create({
  bannerContainer: {
    marginVertical: 2,
    marginHorizontal:"auto",
  },
});
