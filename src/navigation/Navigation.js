// navigation/Navigation.js
import React from 'react';
import { StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Splash, Login, CaseScreen } from '../Screens/index';
import MainApp from '../Screens/MainApp';
import ROUTES from './RouteName';
import { navigationRef } from './RootNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatDetailScreen from '../Screens/Main/ChatDetailScreen';
import Payment from '../Screens/payment/Payment';

const Stack = createStackNavigator();

const Navigation = () => {
  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName={ROUTES.SPLASH}
          screenOptions={{
            headerShown: false,
            animation: 'reveal_from_bottom',
          }}
        >
          <Stack.Screen name={ROUTES.SPLASH} component={Splash} />
          <Stack.Screen name={ROUTES.LOGIN} component={Login} />
          <Stack.Screen name={ROUTES.MAIN_APP} component={MainApp} />
          <Stack.Screen
            name={ROUTES.CHAT_DETAIL_SCREEN}
            component={ChatDetailScreen}
          />
          <Stack.Screen name={ROUTES.CASE_SCREEN} component={CaseScreen} />
          <Stack.Screen name={ROUTES.PAYMENT} component={Payment} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default Navigation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
