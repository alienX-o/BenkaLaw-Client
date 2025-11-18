import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FontSize, Spacing } from '../../constants/theme';
import colors from '../../constants/colors';
import { api } from '../../utils/http.common';
import { formatDate } from '../../utils/common';
import { CenteredLoader, EmptyListComponent } from '../../components/index';

const ReminderScreen = ({ reminders, isLoading, isRefreshing, onRefresh }) => {
  const renderItem = ({ item }) => (
    <View style={styles.reminderRow}>
      <View style={styles.verticalLine} />
      <View style={styles.reminderItem}>
        <Text style={styles.reminderTitle}>{item.matter_number}</Text>

        <Text style={styles.reminderSubTitle}>{item.case_process_name}</Text>
        <Text style={styles.reminderText}>{item.description}</Text>
        {item.created_at && (
          <Text style={styles.reminderDate}>{formatDate(item.created_at)}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Reminders</Text>
      {isLoading && !isRefreshing ? (
        <CenteredLoader />
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item, index) => item.matter_id?.toString() + index}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.PrimaryGreen]}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyListComponent text="You have no reminders." />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ReminderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-SemiBold',
    color: '#333',
    padding: 16,
    paddingBottom: 0,
  },
  listContent: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.md,
  },

  separator: {
    height: 1,
    backgroundColor: '#DEDEDE',
    marginHorizontal: Spacing.md,
  },
  reminderTitle: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-Bold',
    color: colors.PrimaryGreen,
    marginBottom: Spacing.xs,
  },
  reminderSubTitle: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
    marginBottom: Spacing.xs,
  },
  reminderItem: {
    padding: Spacing.md,
    flex: 1,
  },

  reminderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },

  verticalLine: {
    width: 2,
    backgroundColor: '#85AB8F',
    marginRight: Spacing.sm,
    borderRadius: 2,
    height: '100%',
  },

  reminderText: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
    color: colors.black_color,
    marginBottom: Spacing.xs,
  },

  reminderDate: {
    fontSize: FontSize.xs,
    fontFamily: 'Montserrat-Regular',
    color: '#7E7E7E',
  },
});
