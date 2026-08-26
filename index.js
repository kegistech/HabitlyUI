import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './src/App';
import { name as appName } from './app.json';

const messagingInstance = getMessaging();

setBackgroundMessageHandler(messagingInstance, async (remoteMessage) => {
  console.log('Background FCM Message Received:', remoteMessage.messageId);
});

AppRegistry.registerComponent(appName, () => App);