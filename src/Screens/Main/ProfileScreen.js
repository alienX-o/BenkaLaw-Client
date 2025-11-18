import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { BorderRadius, Spacing } from '../../constants/theme/matrics';
import { FontSize } from '../../constants/theme';
import colors from '../../constants/colors';
import VectorIcons from '../../assets/vectorIcons/VectorIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getItem, removeItem } from '../../utils/asyncStorage';
import { CenteredLoader } from '../../components/index';
import { api } from '../../utils/http.common';

const ProfileField = ({ label, value, style }) => {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const ProfileScreen = ({ profile, isLoading, isRefreshing, onRefresh }) => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await removeItem('accessToken');
      await removeItem('refreshToken');
      await removeItem('userDetails');
      navigation.replace('Splash');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout', // Title
      'Are you sure you want to logout?', // Message
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Logout canceled'),
          style: 'cancel',
        },
        { text: 'OK', onPress: handleLogout },
      ],
      { cancelable: false },
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity onPress={confirmLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
            <VectorIcons
              icon="MaterialIcons"
              name="logout"
              size={24}
              color="#4E7D67"
            />
          </TouchableOpacity>
        </View>

        {!isLoading && profile ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileCardContainer}>
                <Image
                  source={
                    profile.image
                      ? {
                          uri: profile.image,
                        }
                      : require('../../assets/images/user.png')
                  }
                  style={styles.avatar}
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.greeting}>
                    Good to See You,
                    {profile.firstName}!
                  </Text>
                  <Text style={styles.email}>{profile.email}</Text>
                </View>
                {/* <TouchableOpacity style={styles.editButton}>
              <VectorIcons
                icon="AntDesign"
                name="edit"
                size={18}
                color={'white'}
              />
            </TouchableOpacity> */}
              </View>
            </View>

            <View style={styles.formContainer}>
              {/* First Name and Last Name Row */}
              <View style={styles.row}>
                <ProfileField
                  label="First Name"
                  value={profile.firstName}
                  style={styles.halfField}
                />
                <ProfileField
                  label="Last Name"
                  value={profile.lastName}
                  style={styles.halfField}
                />
              </View>

              <ProfileField label="Email" value={profile.email} />
              <ProfileField label="Phone Number" value={profile.phoneNumber} />
              <ProfileField label="Address" value={profile.address} />
              <View style={styles.note}>
                <VectorIcons
                  icon="Ionicons"
                  name="information-circle-outline"
                  size={24}
                  color="#4E7D67"
                />
                <Text style={styles.noteText}>
                  Please let the Benca Team know if you change your address.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <CenteredLoader />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base_color,
  },
  content: {
    padding: Spacing.lg,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xs,
  },
  logoutText: {
    color: '#4E7D67',
    fontFamily: 'Montserrat-SemiBold',
  },

  profileCard: {
    backgroundColor: `${colors.PrimaryGreen}33`,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  profileCardContainer: {
    flexDirection: 'row',
    backgroundColor: colors.PrimaryGreen,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSize.md * 1.1,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.base_color,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
    color: colors.base_color,
    opacity: 0.9,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: FontSize.md,
  },
  formContainer: {
    gap: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  field: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light_color,
  },
  label: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
    color: '#7E7E7E',
  },
  note: {
    marginTop: Spacing.md * -1,
    backgroundColor: '#E6F4EA',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteText: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
    color: '#2E7D32',
    flex: 1,
    marginLeft: Spacing.sm,
  },
});

export default ProfileScreen;
