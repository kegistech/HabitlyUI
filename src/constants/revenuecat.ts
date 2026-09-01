import {Platform} from 'react-native';
/*
The API key for your app from the RevenueCat dashboard: https://app.revenuecat.com
*/
export const API_KEY = Platform.select({
   ios: 'appl_oltTYzeQYGkGTwhEZLXHIyZEHPX', //'test_JOBTYntgMJUWEQcWXnmfqwKYfFR',
   android: 'goog_nwCJgNwFXNqVwVNnqNkhduarZMe',
});

/*
The entitlement ID from the RevenueCat dashboard that is activated upon successful in-app purchase for the duration of the purchase.
*/
export const ENTITLEMENT_ID = 'Habitly Pro';
