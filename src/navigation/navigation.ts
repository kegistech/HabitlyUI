import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Login:undefined;
  SignUp:undefined;
  ForgotPassword:undefined;
  WakeUpTime:undefined;
  ReflectionTime:undefined;
  Dashboard: {review?:number}|undefined;
  CreateHabit: undefined;
  CreateRegularHabit:{ habitName?: string; habitMasterId?:string | number; habitData?:any } | undefined;
  CreateOneTimeHabit: { habitName?: string; habitMasterId?:string | number; habitData?:any } | undefined;
  CategoryHabitsList: {
    categoryId: string | number;
    categoryName: string;
  };
  Stats: undefined;
  Profile: undefined;
  EditProfile:undefined;
  AllHabits: undefined;
  Notifications: undefined;
  Settings: undefined;
  Subscription: undefined;
  HabitDetails: {
   habitData?:any
  };
  ChangePassword: undefined;
  Help: undefined;
};

export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};