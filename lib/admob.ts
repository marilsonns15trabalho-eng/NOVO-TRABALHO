import { AdMob, RewardAdPluginEvents, AdMobRewardItem, AdMobInitializationOptions, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { isNativePlatform } from '@capacitor/core';

export const ADMOB_APP_ID = 'ca-app-pub-8167534636248353~2532857319';
export const REWARDED_AD_ID = 'ca-app-pub-8167534636248353/7524361949';
export const BANNER_AD_ID = 'ca-app-pub-8167534636248353/8012981954';

export const initializeAdMob = async () => {
  if (!isNativePlatform()) return;
  try {
    const options: AdMobInitializationOptions = {};
    await AdMob.initialize(options);
  } catch (error) {
    console.error('AdMob Init Error:', error);
  }
};

export const showRewardedAd = async (): Promise<boolean> => {
  if (!isNativePlatform()) return true;

  try {
    await AdMob.prepareRewardVideoAd({ adId: REWARDED_AD_ID });

    return new Promise((resolve) => {
      let isRewarded = false;

      const rewardedListener = AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
        isRewarded = true;
      });

      const failedListener = AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
        rewardedListener.remove();
        failedListener.remove();
        resolve(false);
      });

      const dismissedListener = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        rewardedListener.remove();
        failedListener.remove();
        dismissedListener.remove();
        resolve(isRewarded);
      });

      AdMob.showRewardVideoAd();
    });
  } catch (error) {
    console.error('Rewarded Ad Error:', error);
    return false;
  }
};

export const showBannerAd = async () => {
  if (!isNativePlatform()) return;
  const options: BannerAdOptions = {
    adId: BANNER_AD_ID,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 60,
    isTesting: false
  };
  try {
    await AdMob.showBanner(options);
  } catch (error) {
    console.error('Banner Ad Error:', error);
  }
};

export const hideBannerAd = async () => {
  if (!isNativePlatform()) return;
  try {
    await AdMob.hideBanner();
  } catch (error) {
    console.error('Hide Banner Error:', error);
  }
};
