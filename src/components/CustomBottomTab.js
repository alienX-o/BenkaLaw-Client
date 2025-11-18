import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BorderRadius, FontSize, IconSize, Spacing } from '../constants/theme';

// Icons

import HomeIcon from '../assets/icons/homeIcon.svg';
import CalendarIcon from '../assets/icons/calendarIcon.svg';
import ReminderIcon from '../assets/icons/reminderIcon.svg';
import ProfileIcon from '../assets/icons/profileIcon.svg';
import colors from '../constants/colors';

const CustomBottomTab = ({ activeTab, onTabPress }) => {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: isActive => <HomeIcon {...getIconProps(isActive)} />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: isActive => <CalendarIcon {...getIconProps(isActive)} />,
    },
    {
      id: 'reminder',
      label: 'Reminder',
      icon: isActive => <ReminderIcon {...getIconProps(isActive)} />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: isActive => <ProfileIcon {...getIconProps(isActive)} />,
    },
  ];

  return (
    <View style={styles.tabContainer}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={isActive}
            onPress={() => onTabPress(tab.id)}
          />
        );
      })}
    </View>
  );
};

const TabItem = ({ tab, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.tabContent,
          isActive ? styles.activeTabContent : styles.inactiveTabContent,
        ]}
      >
        <View style={styles.iconAndLabel}>
          {tab.icon(isActive)}
          {isActive && (
            <Text style={styles.activeTabLabel} numberOfLines={1}>
              {tab.label}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const getIconProps = isActive => ({
  width: IconSize.sm * 1.1,
  height: IconSize.sm * 1.1,
  fill: isActive ? colors.base_color : colors.MidGray,
  stroke: isActive ? colors.base_color : colors.MidGray,
});

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 8,
  },
  tabItem: {
    flex: 1, // Each tab takes equal space
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38, // Reduced height for less vertical padding
  },
  activeTabContent: {
    backgroundColor: colors.PrimaryGreen,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md,
  },
  inactiveTabContent: {
    backgroundColor: 'transparent',
    width: 38,
  },
  iconAndLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabLabel: {
    fontSize: FontSize.xs,
    fontFamily: 'AlanSans-SemiBold',
    color: colors.base_color,
    overflow: 'hidden',
    marginLeft: Spacing.sm,
  },
  badge: {
    position: 'absolute',
    right: -Spacing.xs,
    top: -Spacing.xs,
    backgroundColor: '#FF3B30',
    borderRadius: BorderRadius.md,
    minWidth: Spacing.md,
    height: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.base_color,
  },
  badgeText: {
    color: 'white',
    fontSize: FontSize.xs - 2,
    fontFamily: 'AlanSans-Bold',
  },
});

export default CustomBottomTab;
