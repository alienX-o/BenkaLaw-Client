import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import VectorIcon from '../../../assets/vectorIcons/VectorIcons';
import colors from '../../../constants/colors';
import {
  BorderRadius,
  FontSize,
  Layout,
  Spacing,
} from '../../../constants/theme';
import { formatDate, formatFullDateTime } from '../../../utils/common';
import { CenteredLoader, EmptyListComponent } from '../../../components/index';
import { api } from '../../../utils/http.common';
import { clampWithOptions } from 'date-fns/fp';

const getStatusStyle = status => {
  switch (status) {
    case 'Consultation':
      return { backgroundColor: '#E0ECF9' };
    case 'Open':
      return { backgroundColor: 'rgba(133, 171, 143, 0.2)' };
    case 'Archived':
    default:
      return { backgroundColor: '#F1F3F4' };
  }
};

const getStatusTextColor = status => {
  switch (status) {
    case 'Consultation':
      return { color: '#2E6EB5' };
    case 'Open':
      return { color: '#85AB8F' };
    case 'Archived':
    default:
      return { color: '#5F6368' };
  }
};
const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const PaymentMode = ({ mode }) => {
  if (!mode) {
    return null;
  }

  let iconName = 'dollar';
  let iconFamily = 'FontAwesome';
  let size = 14;

  const lowerCaseMode = mode.toLowerCase();
  const name =
    lowerCaseMode === 'credit' || lowerCaseMode === 'debit'
      ? mode + ' Card'
      : lowerCaseMode === 'bank transfer'
      ? 'Bank Transfer'
      : mode;

  if (lowerCaseMode.includes('bank')) {
    iconName = 'bank';
    iconFamily = 'FontAwesome';
  } else if (lowerCaseMode.includes('transfer')) {
    iconName = 'bank-transfer';
    iconFamily = 'MaterialCommunityIcons';
    size = 20;
  } else if (lowerCaseMode.includes('cash')) {
    iconName = 'money';
    iconFamily = 'FontAwesome';
  } else if (
    lowerCaseMode.includes('credit') ||
    lowerCaseMode.includes('debit')
  ) {
    iconName = 'credit-card';
    iconFamily = 'FontAwesome';
  } else if (lowerCaseMode.includes('check')) {
    iconName = 'pen-nib';
    iconFamily = 'FontAwesome6';
  }

  return (
    <View style={styles.paymentModeContainer}>
      <VectorIcon
        name={iconName}
        icon={iconFamily}
        size={size}
        color={colors.PrimaryGreen}
      />
      <Text style={styles.paymentModeText}>{name}</Text>
    </View>
  );
};
const MemberItem = ({ member }) => (
  <View style={styles.memberItem}>
    <View style={styles.memberImagePlaceholder}>
      {member.image ? (
        <Image source={{ uri: member.image }} style={styles.memberImage} />
      ) : (
        <VectorIcon name="person" icon="MaterialIcons" size={24} color="#999" />
      )}
    </View>
    <Text style={styles.memberName}>{member.fullname}</Text>
  </View>
);

const CaseScreen = ({ navigation, route }) => {
  const { caseData } = route.params;
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [financeDetails, setFinanceDetails] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedContractKey, setSelectedContractKey] = useState(null);
  const [isRemindersExpanded, setIsRemindersExpanded] = useState(true);
  const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(true);

  const fetchRemindersAndNotifications = async () => {
    if (!caseData?.matter_id) return;

    try {
      setIsLoading(true);
      const response = await api.get(
        `/auth/reminder-notification-receipt-detail?matter_id=${caseData.matter_id}`,
        {},
        { passToken: true },
      );
      if (response && response.data && response.data.lst_reminder) {
        const newReminders = response.data.lst_reminder;
        if (newReminders.length > 0) {
          setIsRemindersExpanded(false);
        }
        setReminders(newReminders);
      }
      if (response && response.data && response.data.lst_notification) {
        const newNotifications = response.data.lst_notification;
        setNotifications(newNotifications);
        if (newNotifications.length > 0) {
          setIsNotificationsExpanded(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  const fetchFinanceDetail = async () => {
    if (!caseData?.matter_id) return;

    try {
      const res = await api.get(
        `/auth/client-finance-detail?matter_id=${caseData.matter_id}`,
        {},
        { passToken: true },
      );
      console.log('Finance Details API response:', res);
      if (res && res.data) {
        setFinanceDetails(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch finance details:', error);
    }
  };
  useEffect(() => {
    fetchRemindersAndNotifications();
    fetchFinanceDetail();
  }, [caseData?.matter_id]);

  const onRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    fetchRemindersAndNotifications();
    fetchFinanceDetail();
  }, [caseData?.matter_id]);
  if (!caseData) {
    return <Text>Error: Case data not found.</Text>;
  }

  const renderFinanceLedger = () => {
    if (
      !financeDetails ||
      !financeDetails.kvpprofessionalledger.contract.length ||
      !financeDetails.kvpprofessionalledger.professional_invoices.length
    ) {
      return null;
    }

    const {
      kvpprofessionalledger,
      total_build_amount,
      total_paid_amount,
      total_outstanding_amount,
    } = financeDetails;
    const { professional_invoices = [] } = kvpprofessionalledger;

    // Add invoices to transactions
    const allTransactions = professional_invoices
      .map(item => ({
        date: item.paiddate,
        amount: item.actualamt,
        paymentMode: item.trantype || '',
        originalItem: item,
      }))
      .filter(item => item.amount > 0); // Only show actual payments

    // Sort all transactions by date
    allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <>
        <Text style={styles.involvedMember}>Professional Ledger</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Billed</Text>
            <Text style={styles.summaryValue}>
              ${Number(total_build_amount || 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={styles.summaryValue}>
              ${Number(total_paid_amount || 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryBox, styles.summaryBoxOutstanding]}>
            <Text style={[styles.summaryLabel, { color: colors.PrimaryGreen }]}>
              Outstanding
            </Text>
            <Text style={[styles.summaryValue, { color: colors.PrimaryGreen }]}>
              ${Number(total_outstanding_amount || 0).toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.bulletLedgerContainer}>
          {allTransactions.map((item, index) => {
            const amountString = `$${item.amount.toLocaleString()}`;

            return (
              <View key={index} style={styles.bulletLedgerItem}>
                <View style={styles.bulletPoint} />
                <View style={styles.bulletLedgerContent}>
                  <View style={styles.bulletLedgerRow}>
                    <View style={{ flex: 2 }}>
                      <PaymentMode mode={item.paymentMode} />
                    </View>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.bulletLedgerSubText}>
                        {formatDate(item.date)}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.bulletLedgerAmount}>
                        {amountString}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <VectorIcon
            name="arrow-back-ios-new"
            icon="MaterialIcons"
            size={20}
          />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {caseData.processName}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.PrimaryGreen]}
          />
        }
      >
        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Case Details</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.caseLabel}>Case Number</Text>
              <Text style={styles.caseValue}>{caseData.processNumber}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.caseLabel}>Process Name</Text>
              <Text style={styles.caseValue} numberOfLines={2}>
                {caseData.processName}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.caseLabel}>Creation Date</Text>
              <Text style={styles.caseValue}>
                {formatDate(caseData.creationDate)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Involved Members</Text>
          </View>

          {/* Involved Clients Section */}
          <Text style={styles.subSectionTitle}>Involved Clients</Text>
          <View style={styles.membersContainer}>
            {chunkArray(caseData.involved_client || [], 2).map(
              (row, rowIndex) => (
                <View key={`client-row-${rowIndex}`} style={styles.row}>
                  {row.map((member, memberIndex) => (
                    <MemberItem
                      key={member.fullname || memberIndex}
                      member={member}
                    />
                  ))}
                  {row.length === 1 && <View style={styles.memberItem} />}
                </View>
              ),
            )}
          </View>

          <View style={styles.separator} />

          {/* Involved Employees Section */}
          <Text style={styles.subSectionTitle}>Involved Employees</Text>
          <View style={styles.membersContainer}>
            {chunkArray(caseData.involved_employee || [], 2).map(
              (row, rowIndex) => (
                <View key={`employee-row-${rowIndex}`} style={styles.row}>
                  {row.map((member, memberIndex) => (
                    <MemberItem
                      key={member.fullname || memberIndex}
                      member={member}
                    />
                  ))}
                  {row.length === 1 && <View style={styles.memberItem} />}
                </View>
              ),
            )}
          </View>
        </View>

        {/* Expandable Reminders Section */}
        <TouchableOpacity
          style={styles.expandableHeader}
          onPress={() => setIsRemindersExpanded(!isRemindersExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandableHeaderText}>
            Case Reminders - ({reminders.length})
          </Text>
          <VectorIcon
            icon="MaterialIcons"
            name={
              isRemindersExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
            }
            size={24}
            color={colors.dark_gray}
          />
        </TouchableOpacity>

        {isRemindersExpanded && (
          <View style={styles.remindersListContainer}>
            {!isLoading ? (
              <FlatList
                data={reminders}
                keyExtractor={(item, index) =>
                  item.matter_id?.toString() + index
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <View style={styles.reminderRow}>
                    <View style={styles.verticalLine} />
                    <View style={styles.reminderItem}>
                      <Text style={styles.reminderText}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                )}
                scrollEnabled={false}
                ListEmptyComponent={
                  <EmptyListComponent text="No reminders for this case." />
                }
              />
            ) : (
              <ActivityIndicator style={styles.loader}></ActivityIndicator>
            )}
          </View>
        )}

        {/* Expandable Notifications Section */}
        <TouchableOpacity
          style={styles.expandableHeader}
          onPress={() => setIsNotificationsExpanded(!isNotificationsExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandableHeaderText}>
            Case Notifications - ({notifications.length})
          </Text>
          <VectorIcon
            icon="MaterialIcons"
            name={
              isNotificationsExpanded
                ? 'keyboard-arrow-up'
                : 'keyboard-arrow-down'
            }
            size={24}
            color={colors.dark_gray}
          />
        </TouchableOpacity>
        {isNotificationsExpanded && (
          <View style={styles.remindersListContainer}>
            {!isLoading ? (
              <FlatList
                data={notifications}
                keyExtractor={(item, index) =>
                  item.matter_id?.toString() + index
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                  <View style={styles.reminderRow}>
                    <View style={styles.verticalLine} />
                    <View style={styles.reminderItem}>
                      <Text style={styles.reminderDate}>
                        {formatFullDateTime(item.date)}
                      </Text>
                      <Text style={styles.reminderText}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                )}
                scrollEnabled={false}
                ListEmptyComponent={
                  <EmptyListComponent text="No notifications for this case." />
                }
              />
            ) : (
              <ActivityIndicator style={styles.loader}></ActivityIndicator>
            )}
          </View>
        )}

        {renderFinanceLedger()}
      </ScrollView>
    </SafeAreaView>
  );
};
export default CaseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base_color,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#F0F0F0',
    padding: Spacing.xs / 1.5,
    borderRadius: BorderRadius.sm,
  },
  title: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.lg,
    marginLeft: Spacing.sm,
    flexShrink: 1,
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
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    marginLeft: Spacing.xs,
    color: colors.black_color,
  },
  caseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    alignItems: 'center',
  },
  caseInfo: {
    flexShrink: 1,
  },
  caseLabel: {
    fontSize: FontSize.sm,
    color: '#7E7E7E',
    fontFamily: 'Montserrat-Medium',
    marginBottom: Spacing.xs / 2,
  },
  caseValue: {
    fontSize: FontSize.md,
    fontFamily: 'AlanSans-SemiBold',
    color: colors.black_color,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: Spacing.sm * 1.5,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: 'AlanSans-Regular',
  },
  creationDate: {
    fontSize: FontSize.sm,
    color: '#7E7E7E',
    fontFamily: 'Montserrat-Medium',
  },
  detailsGrid: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'column',
  },
  subSectionTitle: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    fontSize: FontSize.md * 0.9,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.dark_gray,
  },
  membersContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  involvedMember: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.lg,
    marginLeft: Spacing.sm,
    marginVertical: Spacing.md,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  expandableHeaderText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.lg,
    color: colors.black_color,
  },
  membersWrapper: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  loader: {
    padding: Spacing.md,
  },

  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  memberImagePlaceholder: {
    width: Layout.avatarMd,
    height: Layout.avatarMd,
    borderRadius: BorderRadius.full,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  memberImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  memberName: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    color: '#7E7E7E',
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  remindersListContainer: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: -Spacing.sm, // Adjust to be closer to the header
    borderColor: '#E0E0E0',
  },

  separator: {
    height: 1,
    backgroundColor: '#DEDEDE',
    marginHorizontal: Spacing.md,
  },
  reminderItem: {
    padding: Spacing.md,
    flex: 1,
  },

  reminderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  verticalLine: {
    width: 2,
    backgroundColor: colors.PrimaryGreen,
    marginRight: Spacing.sm,
    borderRadius: 2,
    height: '100%',
  },

  reminderText: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
    marginBottom: Spacing.xs,
  },

  reminderDate: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Bold',
    color: colors.PrimaryGreen,
  },
  // Payment Schedule Card Styles
  detailBoxContainer: {
    flexDirection: 'row',
    gap: 1,
    marginBottom: Spacing.md,
  },
  detailBox: {
    borderRadius: BorderRadius.lg,
    backgroundColor: '#eaf9f2',
    padding: Spacing.sm,
  },
  boxHeaderText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.xs / 2 + 3,
    color: '#7e7e7e',
  },
  boxBodyText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: FontSize.xs / 2 + 5,
    marginBottom: Spacing.xs / 2,
  },
  installmentSection: {
    marginBottom: Spacing.md,
  },
  installmentSectionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.md,
    color: colors.dark_gray,
    marginBottom: Spacing.sm,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  paymentCardHeaderText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.sm,
    color: '#7e7e7e',
  },

  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  paidContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  paidPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.xs,
  },
  paidText: {
    color: '#14ba6d',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.xs,
  },
  paymentCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentCardValue: {
    fontFamily: 'Montserrat-Regular',
    fontSize: FontSize.sm,
    color: '#7e7e7e',
    // flexShrink: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  contractButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#F0F0F0',
    borderRadius: BorderRadius.md,
  },
  selectedContractButton: {
    backgroundColor: colors.PrimaryGreen,
  },
  contractButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.sm,
    color: colors.dark_gray,
    // This will be overridden by the selected style's color
    '.selectedContractButton &': { color: 'white' },
  },
  // Ledger Styles
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#F1F3F4',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  summaryBoxOutstanding: {
    backgroundColor: '#E8F5E9',
  },
  summaryLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: FontSize.sm,
    color: '#5F6368',
    marginBottom: Spacing.xs / 2,
  },
  summaryValue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: FontSize.md,
    color: colors.black_color,
  },

  // Bullet Ledger Styles
  bulletLedgerContainer: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',

    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  bulletLedgerItem: {
    flexDirection: 'row',

    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  'bulletLedgerItem:last-child': {
    borderBottomWidth: 0,
  },
  bulletPoint: {
    width: 5,
    height: 5,
    borderRadius: 4,
    backgroundColor: colors.dark_grey,
    marginRight: Spacing.md,
    marginTop: 6, // Align with the first line of text
  },
  bulletLedgerContent: {
    flex: 1,
    flexDirection: 'column',
  },
  bulletLedgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletLedgerMainText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.md,

    color: colors.black_color,
    flexShrink: 1,
    marginBottom: Spacing.xs,
  },
  paymentModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: Spacing.sm,
  },
  paymentModeText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: FontSize.sm,
    color: '#5F6368',
    marginLeft: Spacing.xs,
  },
  bulletLedgerAmount: {
    fontFamily: 'Montserrat-Bold',
    fontSize: FontSize.md,
    color: colors.PrimaryGreen,
    marginLeft: Spacing.sm,
  },

  bulletLedgerSubText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: FontSize.sm,
    color: '#7E7E7E',
  },
  bulletLedgerBalance: {
    fontFamily: 'Montserrat-Medium',
    fontSize: FontSize.sm,
    color: '#5F6368',
  },
  ledgerFooter: {
    padding: Spacing.md,
    backgroundColor: '#F7F7F7',
    marginHorizontal: -Spacing.md, // Counteract container padding
    marginTop: Spacing.md,
  },
  ledgerFooterText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: FontSize.sm,
    color: '#7E7E7E',
    textAlign: 'center',
  },
});
