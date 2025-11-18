import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { BorderRadius, Spacing } from '../../constants/theme/matrics';
import { FontSize } from '../../constants/theme';
import colors from '../../constants/colors';
import VectorIcon from '../../assets/vectorIcons/VectorIcons';
import NotificationIcon from '../../assets/icons/notification';

import NoNotificationIcon from '../../assets/icons/noNotify';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../utils/http.common';
import { setItem } from '../../utils/asyncStorage';
import { formatDate, formatFullDateTime } from '../../utils/common';
import { CenteredLoader, EmptyListComponent } from '../../components/index';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -100;
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

const getStatusStyle = status => {
  switch (status) {
    case 'Consultation':
      return { backgroundColor: '#E0ECF9' };
    case 'Open': // Match API response
      return { backgroundColor: '#E6F4EA' };
    case 'Archived':
      return { backgroundColor: '#F1F3F4' };
    default:
      return { backgroundColor: '#F1F3F4' };
  }
};

const getStatusTextColor = status => {
  switch (status) {
    case 'Consultation':
      return { color: '#2E6EB5' };
    case 'Open': // Match API response
      return { color: '#2E7D32' };
    case 'Archived':
      return { color: '#5F6368' };
    default:
      return { color: '#5F6368' };
  }
};

const CaseItem = ({ caseData }) => {
  const navigation = useNavigation();
  return (
    <View>
      <View style={styles.caseDetails}>
        <View style={styles.caseInfo}>
          <Text style={styles.caseLabel}>Case Process Name</Text>
          <Text style={styles.caseValue}>{caseData.processName}</Text>

          <Text style={styles.caseLabel}>Case Number</Text>
          <Text style={styles.caseValue}>{caseData.processNumber}</Text>
        </View>

        <View style={styles.rightContent}>
          <View style={[styles.statusPill, getStatusStyle(caseData.status)]}>
            <Text
              style={[styles.statusText, getStatusTextColor(caseData.status)]}
            >
              {caseData.status}
            </Text>
          </View>
          <VectorIcon
            icon="MaterialIcons"
            name="chevron-right"
            size={22}
            color="#4E7D67"
          />
        </View>
      </View>
      {/* This will the payment logic which will navigate to the payment screen */}
      {/* {caseData.invoice_payment_info &&
        caseData.invoice_payment_info.id &&
        caseData.invoice_payment_info.id > 0 && (
          <>
            <View style={styles.paymentSection}>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentLabel}>
                  Payment Due |{' '}
                  {caseData.invoice_payment_info.invoicenumbertypes}
                </Text>
                <Text style={styles.paymentDate}>
                  {formatDate(caseData.invoice_payment_info.duedate)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.payNowButton}
                onPress={() => {
                  navigation.navigate('Payment', {
                    caseData: caseData,
                  });
                }}
              >
                <VectorIcon
                  name={'payment'}
                  color="white"
                  icon="MaterialIcons"
                ></VectorIcon>
                <Text style={styles.payNowButtonText}>
                  Pay Now ${caseData.invoice_payment_info.totalamt}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )} */}
    </View>
  );
};

const LawTypeCard = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const navigation = useNavigation();
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };
  const handleCasePress = caseData => {
    navigation.navigate('CaseScreen', { caseData });
  };
  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={toggleExpansion}>
        {item?.icon}
        <Text style={styles.sectionTitle}>
          {item.lawType} - ({item.cases.length})
        </Text>
        <VectorIcon
          icon="MaterialIcons"
          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color="black"
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>
      {isExpanded &&
        item.cases.map((caseData, index) => (
          <View key={caseData.id}>
            <TouchableOpacity onPress={() => handleCasePress(caseData)}>
              <CaseItem caseData={caseData} />
              {index < item.cases.length - 1 && <View style={styles.divider} />}
            </TouchableOpacity>
          </View>
        ))}
    </View>
  );
};

const HomeScreen = ({
  setActiveTab,
  processes,
  userInfo,
  notifications,
  isLoading,
  isRefreshing,
  onRefresh,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openModal = () => {
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  // Simplified closeModal
  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: -MAX_MODAL_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const renderNotificationItem = ({ item }) => {
    return (
      <View style={styles.notificationItemContainer}>
        <View style={styles.notificationItem} activeOpacity={0.7}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationCase}>{item.matter_number}</Text>
            {item.date && (
              <Text style={styles.notificationDetail}>
                {formatFullDateTime(item.date)}
              </Text>
            )}
            <Text style={styles.notificationTitle}>{item.description}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setActiveTab('profile')}>
          <Image
            source={
              userInfo.image
                ? {
                    uri: userInfo.image,
                  }
                : require('../../assets/images/user.png')
            }
            style={styles.avatar}
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          {userInfo.firstName || userInfo.lastName ? (
            <Text style={styles.greeting}>
              Good to see you,
              <Text style={styles.username}>{userInfo.firstName}</Text>!
            </Text>
          ) : null}
          <Text style={styles.email}>{userInfo.email}</Text>
        </View>

        <View style={styles.notificationIcon}>
          <TouchableOpacity onPress={openModal}>
            {notifications.length > 0 ? (
              <NotificationIcon />
            ) : (
              <NoNotificationIcon />
            )}
          </TouchableOpacity>
          {/* <View style={styles.notificationDot} /> */}
        </View>
      </View>

      {/* Heading */}
      <Text style={styles.heading}>
        My Processes / Law Types - ({processes.length})
      </Text>

      {/* Cases List */}
      {isLoading && !isRefreshing ? (
        <CenteredLoader />
      ) : (
        <FlatList
          data={processes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <LawTypeCard item={item} />}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.PrimaryGreen]}
            />
          }
          ListEmptyComponent={<EmptyListComponent text="No cases found." />}
        />
      )}

      {/* Notification Modal */}
      <Modal
        visible={modalVisible}
        animationType="none"
        transparent
        onRequestClose={closeModal}
      >
        {/* This View creates the dimmed background. It does NOT have an onPress. */}
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                maxHeight: SCREEN_HEIGHT * 0.75, // Set max height to 75%
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader,Platform.OS === 'ios' &&{ marginTop: Spacing.xxl }]}>
              <Text style={styles.modalTitle}>Your Notifications</Text>
            </View>

            {isLoadingNotifications ? (
              <ActivityIndicator
                size="large"
                color={colors.PrimaryGreen}
                style={{ flex: 1 }}
              />
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item, index) =>
                  item.matter_id?.toString() + index
                }
                renderItem={renderNotificationItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <EmptyListComponent text="No notifications found." />
                }
              />
            )}

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: Spacing.sm * 1.5,
              }}
            >
              <View
                style={{
                  width: '40%',
                  height: 1,
                  backgroundColor: '#EAEAEA',
                }}
              />
              <TouchableOpacity onPress={closeModal} style={styles.closeIcon}>
                <Text
                  style={{
                    color: '#181818',
                    fontFamily: 'Montserrat-SemiBold',
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
              <View
                style={{
                  width: '40%',
                  height: 1,
                  backgroundColor: '#EAEAEA',
                }}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base_color,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.PrimaryGreen,
    marginRight: Spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
  },
  username: {
    color: '#4E7D67',
    fontFamily: 'Montserrat-Bold',
  },
  email: {
    fontSize: FontSize.sm,
    color: colors.dark_gray,
    fontFamily: 'Montserrat-Regular',
  },
  notificationIcon: {
    marginLeft: 'auto',
    position: 'relative',
  },
  notificationDot: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
    backgroundColor: 'red',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  heading: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: colors.black_color,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    marginLeft: Spacing.sm,
    color: colors.black_color,
  },
  caseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  caseInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  caseLabel: {
    fontSize: FontSize.sm,
    color: colors.dark_gray,
    marginBottom: 2,
  },
  caseValue: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
    marginBottom: Spacing.sm,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: Spacing.md,
  },
  paymentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#FDFDFD',
    marginTop: Spacing.lg * -0.9,
  },
  paymentDetails: {
    flexDirection: 'column',
  },
  paymentLabel: {
    backgroundColor: '#D5451B1C',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    fontSize: FontSize.sm,
    color: '#D5451B',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: FontSize.xs,
    marginLeft: Spacing.xl,
    fontFamily: 'Montserrat-Regular',
    color: colors.black_color,
  },
  payNowButton: {
    backgroundColor: colors.PrimaryGreen,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md / 2,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payNowButtonText: {
    color: '#fff',
    marginLeft: Spacing.sm,
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
  },
  // Notification Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    backgroundColor: colors.base_color,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
  },
  closeIcon: {
    padding: Spacing.xs,
  },
  notificationsList: {
    paddingBottom: Spacing.xl,
  },
  // New styles for swipeable notifications
  notificationItemContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
  },
  deleteText: {
    color: 'white',
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    marginLeft: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
    marginBottom: 4,
  },
  notificationDetail: {
    fontSize: FontSize.sm,
    marginBottom: 2,
    color: '#4D595E',
  },
  notificationCase: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    color: '#4E7D67',
    marginTop: 2,
  },
});

export default HomeScreen;
