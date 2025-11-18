import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import CustomBottomTab from '../components/CustomBottomTab';
import HomeScreen from './Main/HomeScreen';
import CalendarScreen from './Main/CalenderScreen';
import ReminderScreen from './Main/ReminderScreen';
import ProfileScreen from './Main/ProfileScreen';
import { setItem } from '../utils/asyncStorage';
import { CenteredLoader } from '../components';

import messaging from '@react-native-firebase/messaging';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import DeviceInfo from 'react-native-device-info';
import { api } from '../utils/http.common';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState('home');

  // Centralized State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [profile, setProfile] = useState({});

  // ✅ Cross-platform permission handler
  const requestNotificationPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('🚫 Notification permission denied on Android');
        }
      } else {
        const settings = await notifee.requestPermission();
        if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
          console.log('✅ iOS Notification permission granted');
        } else {
          console.warn('🚫 Notification permission denied on iOS');
        }
      }
    } catch (err) {
      console.error('⚠️ Error requesting notification permission:', err);
    }
  }, []);

  // ✅ Register for remote messages + get FCM token (iOS-compatible)
  const onAppBootstrap = useCallback(async () => {
    try {
      console.log('🧠 Registering device for remote messages...');
      await messaging().registerDeviceForRemoteMessages();

      const token = await messaging().getToken();
      console.log('🔥 FCM Token:', token);

      let deviceID;
      if (Platform.OS === 'ios') {
        deviceID = await DeviceInfo.getUniqueId(); // Works on both iOS + Android
      } else {
        deviceID = await DeviceInfo.getAndroidId();
      }
      console.log('💻 Device ID:', deviceID);

      // Optionally send to backend
      const payload = { token, deviceID, platform: Platform.OS };
      const response = await api.post(
        '/auth/register-firebase-token',
        payload,
        { passToken: true },
      );
      console.log('✅ Token registration response:', response.message);
    } catch (error) {
      console.error('❌ Error in onAppBootstrap:', error);
    }
  }, []);

  // --- Granular Data Fetching Functions ---

  const fetchCasesAndProfile = useCallback(async () => {
    try {
      console.log('Fetching cases and profile...');
      const [casesResponse, profileResponse] = await Promise.all([
        api.get('/auth/cases', {}, { passToken: true }),
        api.get('/auth/user-basic-info', {}, { passToken: true }),
      ]);
      console.log('case resonse ', casesResponse);
      if (casesResponse?.data?.lst_case_info) {
        const userDetails = {
          firstName: casesResponse.data.first_name,
          lastName: casesResponse.data.last_name,
          email: casesResponse.data.email,
          image: casesResponse.data.user_image,
        };
        const groupedCases = casesResponse.data.lst_case_info.reduce(
          (acc, item) => {
            const lawType = item.law_type;
            acc[lawType] = acc[lawType] || [];
            acc[lawType].push({
              ...item,
              id: item.matter_id.toString(),
              processName: item.case_process_name,
              processNumber: item.matter_number,
              status: item.casestatus,
              creationDate: item.created_at,
              involved_employee: item.lst_involved_emplyoee,
              involved_client: item.lst_involved_client,
            });
            return acc;
          },
          {},
        );

        const formattedProcesses = Object.keys(groupedCases).map(
          (lawType, index) => ({
            id: (index + 1).toString(),
            lawType,
            cases: groupedCases[lawType],
          }),
        );

        setProcesses(formattedProcesses);
        setProfile({
          ...userDetails,
          address: profileResponse?.data?.address || '',
          phoneNumber: profileResponse?.data?.phone_no || '',
        });
        await setItem('userDetails', JSON.stringify(userDetails));
      }
    } catch (error) {
      console.error('Failed to fetch cases/profile:', error);
      throw error; // Re-throw to be caught by caller
    }
  }, []);

  const fetchRemindersAndNotifications = useCallback(async () => {
    try {
      console.log('Fetching reminders and notifications...');
      const reminderNotifResponse = await api.get(
        '/auth/reminder-notification-receipt-detail?matter_id=0',
        {},
        { passToken: true },
      );
      console.log(
        'fetching notifications and reminders...',
        reminderNotifResponse,
      );
      if (reminderNotifResponse?.data) {
        setNotifications(reminderNotifResponse.data.lst_notification || []);
        setReminders(reminderNotifResponse.data.lst_reminder || []);
      }
    } catch (error) {
      console.error('Failed to fetch reminders/notifications:', error);
      throw error; // Re-throw to be caught by caller
    }
  }, []);

  // --- Combined Initial Fetch & Refresh Handlers ---
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchCasesAndProfile(),
        fetchRemindersAndNotifications(),
      ]);
    } catch (error) {
      console.error('Failed to fetch app data:', error);
      // Alert.alert('Error', 'Could not load data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchCasesAndProfile, fetchRemindersAndNotifications]);

  const onRefreshHome = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchCasesAndProfile(),
        fetchRemindersAndNotifications(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchCasesAndProfile, fetchRemindersAndNotifications]);

  const onRefreshReminders = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchRemindersAndNotifications();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRemindersAndNotifications]);

  useEffect(() => {
    const setupNotifications = async () => {
      console.log('🔄 Initializing notification setup...');
      await requestNotificationPermission();
      await onAppBootstrap();
    };

    setupNotifications();
    fetchInitialData();

    // Foreground messages
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('📨 FCM Message (foreground):', remoteMessage);
      await notifee.requestPermission();

      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
      });

      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'Notification',
        body: remoteMessage.notification?.body || '',
        android: {
          channelId,
          pressAction: { id: 'default' },
        },
        ios: {
          sound: 'default',
        },
      });
    });

    // App opened from background
    const unsubscribeOnOpen = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log(
          '📲 App opened from background notification:',
          remoteMessage.notification,
        );
      },
    );

    // App opened from quit (killed) state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            '🚀 App opened from quit state:',
            remoteMessage.notification,
          );
        }
      });

    // Return cleanup function
    return () => {
      unsubscribeOnMessage();
      unsubscribeOnOpen();
    };
  }, [fetchInitialData, onAppBootstrap, requestNotificationPermission]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            setActiveTab={setActiveTab}
            processes={processes}
            userInfo={profile}
            notifications={notifications}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={onRefreshHome}
          />
        );
      case 'calendar':
        return <CalendarScreen />;
      case 'reminder':
        return (
          <ReminderScreen
            reminders={reminders}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={onRefreshReminders}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            profile={profile}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={fetchCasesAndProfile}
          />
        );
      default:
        return <HomeScreen setActiveTab={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isLoading && !isRefreshing ? <CenteredLoader /> : renderScreen()}
      </View>
      <CustomBottomTab activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
});

export default MainApp;
