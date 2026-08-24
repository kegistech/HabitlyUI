import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigation';

// Screen Imports
import SplashScreen from '../screens/Splash';
import AuthScreen from '../screens/Auth';
import LoginScreen from '../screens/Login';
import SignUpScreen from '../screens/SignUp';
import ForgotPasswordScreen from '../screens/ForgotPassword';
import WakeUpTimeScreen from '../screens/WakeUpTime';
import ReflectionTimeScreen from '../screens/ReflectionTime';
import DashboardScreen from '../screens/Dashboard';
import CreateHabitScreen from '../screens/CreateHabit';
import CreateRegularHabitScreen from '../screens/CreateHabit/CreateRegularHabit';
import CreateOneTimeHabitScreen from '../screens/CreateHabit/CreateOneTimeHabit';
import CategoryHabitsListScreen from '../screens/CreateHabit/CategoryHabitsList';
import StatsScreen from '../screens/Stats';
import ProfileScreen from '../screens/Profile';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import AllHabitsScreen from '../screens/Profile/AllHabitsScreen';
import NotificationsScreen from '../screens/Profile/NotificationsScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import SubscriptionScreen from '../screens/Subscription';
import HabitDetailsScreen from '../screens/HabitDetail';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import HelpScreen from '../screens/Profile/HelpScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' }, // Prevent screen flashing on navigation transitions
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name='ForgotPassword' component={ForgotPasswordScreen} />
      <Stack.Screen name='WakeUpTime' component={WakeUpTimeScreen} />
      <Stack.Screen name='ReflectionTime' component={ReflectionTimeScreen} />
      <Stack.Screen name='Dashboard' component={DashboardScreen} />
      <Stack.Screen name='CreateHabit' component={CreateHabitScreen} />
      <Stack.Screen name='CreateRegularHabit' component={CreateRegularHabitScreen} />
      <Stack.Screen name='CreateOneTimeHabit' component={CreateOneTimeHabitScreen}/>
      <Stack.Screen name='CategoryHabitsList' component={CategoryHabitsListScreen} />
      <Stack.Screen name='Stats' component={StatsScreen} />
      <Stack.Screen name='Profile' component={ProfileScreen} />
      <Stack.Screen name='EditProfile' component={EditProfileScreen}/>
      <Stack.Screen name='AllHabits' component={AllHabitsScreen} />
      <Stack.Screen name='Notifications' component={NotificationsScreen}/>
      <Stack.Screen name='Settings' component={SettingsScreen} />
      <Stack.Screen name='Subscription' component={SubscriptionScreen}/>
      <Stack.Screen name='HabitDetails' component={HabitDetailsScreen}/>
      <Stack.Screen name='ChangePassword' component={ChangePasswordScreen}/>
      <Stack.Screen name='Help' component={HelpScreen}/>
    </Stack.Navigator>
  );
};

export default RootNavigator;