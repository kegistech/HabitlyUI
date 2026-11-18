import {postApi} from './commonAPIs';
import {userScreenTrackingAPI} from './apiendpoints';
import {Platform} from 'react-native';
export const trackUserActivity = async (screenName:string) => {
        const params = {
            screenName,
            platform: Platform.OS
          };
          postApi(
            userScreenTrackingAPI,
            params,
            (data:any) => {
            },
            (error:any) => {
              console.log('Error>>', error);
            },
          );
};