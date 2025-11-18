import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Keyboard,
} from 'react-native';
import React, { useState } from 'react';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../../constants/colors';
import { BorderRadius, FontSize, Spacing } from '../../constants/theme';
import VectorIcon from '../../assets/vectorIcons/VectorIcons';
import { showToast } from '../../utils/toastUtils';
import { api } from '../../utils/http.common';
import { getItem } from '../../utils/asyncStorage';


const PaymentOption = ({
  label,
  iconFamily,
  iconName,
  value,
  selectedValue,
  onSelect,
}) => {
  const isSelected = value === selectedValue;
  return (
    <TouchableOpacity
      style={[styles.paymentOption, isSelected && styles.selectedPaymentOption]}
      onPress={() => onSelect(value)}
      activeOpacity={0.7}
    >
      <VectorIcon
        icon={iconFamily}
        name={iconName}
        size={28}
        color={isSelected ? colors.PrimaryGreen : colors.dark_gray}
        style={styles.optionIcon}
      />
      <Text
        style={[styles.optionLabel, isSelected && styles.selectedOptionLabel]}
      >
        {label}
      </Text>
      {isSelected && (
        <View style={styles.checkIconContainer}>
          <VectorIcon
            icon="Ionicons"
            name="checkmark-circle"
            size={20}
            color={colors.PrimaryGreen}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const Payment = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { dueDate, caseData } = route.params;

  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState();
  const [amount, setAmount] = useState(
    caseData?.invoice_payment_info?.totalamt.toString() || '0.00',
  );
  const [showWebView, setShowWebView] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');

  const handleAmountChange = text => {
    // Allow only numbers with up to two decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(text) || text === '') {
      setAmount(text);
    }
  };

  const handlePayNow = async () => {
    Keyboard.dismiss();
    setIsLoading(true);
    setLoadingMessage('Processing payment...');

    try {
      const payload = {
        receivedamt: parseFloat(amount),
        paymentamt: caseData.invoice_payment_info.totalamt,
        case_id: caseData.invoice_payment_info.case_id,
        quickbooks_invoice_id:
          caseData.invoice_payment_info.quickbooks_invoice_id,
        payment_type: paymentMethod,
        invoicetype: caseData.invoice_payment_info.invoicetype,
        partialPayment: caseData.invoice_payment_info.partial_payment,
        invoice_id: caseData.invoice_payment_info.id,
        isportalpayment: 'no',
      };

      const res = await api.post('/auth/register-authorizenet-token', payload, {
        passToken: true,
      });
      console.log('respnonse', res);

      const paymentPortalHtml = await api.post(
        res.paymentUrl,
        { token: res.token },
        {
          passToken: false,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          transformResponse: [data => data], // To get raw HTML string
        },
      );
      console.log('paymentres', paymentPortalHtml);

      setPaymentHtml(paymentPortalHtml);
      setPaymentUrl(res.paymentUrl);
      setShowWebView(true);
    } catch (error) {
      console.error('Payment failed:', error);
      showToast('error', 'Payment Error', 'Could not initiate payment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal transparent={true} visible={isLoading} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loaderContainer}>
            {loadingMessage === 'Redirecting to Authorize.Net...' ? (
              <ActivityIndicator size="large" color={colors.PrimaryGreen} />
            ) : (
              <VectorIcon
                icon="Octicons"
                name="check-circle-fill"
                size={30}
                color={colors.PrimaryGreen}
              />
            )}
            <Text style={styles.loaderText}>{loadingMessage}</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showWebView} onRequestClose={() => setShowWebView(false)}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowWebView(false)}
            >
              <VectorIcon
                name="close"
                icon="Ionicons"
                size={24}
                color={colors.dark_gray}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Complete Payment</Text>
          </View>
          <WebView
            originWhitelist={['*']}
            source={{ html: paymentHtml, baseUrl: paymentUrl }}
            style={{ flex: 1 }}
            // --- Enhanced Logging For Every Step ---
            onLoadStart={() => console.log('WebView: Load Start')}
            onLoadProgress={({ nativeEvent }) =>
              console.log('WebView: Load Progress', nativeEvent.progress)
            }
            onLoad={() => console.log('WebView: Load Success')}
            onLoadEnd={() => console.log('WebView: Load End')}
            onError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView Error:', nativeEvent);
            }}
            onHttpError={syntheticEvent => {
              const { nativeEvent } = syntheticEvent;
              console.error(
                'WebView HTTP Error: ',
                nativeEvent.statusCode,
                nativeEvent.url,
              );
            }}
            onNavigationStateChange={navState => {
              // Log the full state object for detailed debugging
              console.log('WebView: Full Navigation State', navState);
              console.log('WebView: URL Changed ->', navState.url);

              // Check for the payment success URL
              const successUrlPrefix =
                'https://b96e0c0091e3.ngrok-free.app/finance/paymentmobilesuccess';
              const failureUrlPrefix =
                'https://b96e0c0091e3.ngrok-free.app/finance/paymentmobilecancel';
              if (navState.url.startsWith(successUrlPrefix)) {
                console.log(
                  'WebView: Payment Success URL detected! Closing WebView modal.',
                );
                setShowWebView(false);
                navigation.replace('MainApp');
                showToast('success', 'Payment Successful', 'Your payment has been processed.');
                // You might want to show a success toast here as well
                // showToast('success', 'Payment Successful', 'Your payment has been processed.');
              }
              else if (navState.url.startsWith(failureUrlPrefix)) {
                console.log(
                  'WebView: Payment Failure URL detected! Closing WebView modal.',
                );
                setShowWebView(false);
                 navigation.replace('MainApp');
                showToast('error', 'Payment Failed', 'Your payment could not be processed.');
              }
            }}
            onMessage={event => {
              console.log('WebView: Message Received', event.nativeEvent.data);
            }}
          />
        </SafeAreaView>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <VectorIcon
            name="arrow-back-ios-new"
            icon="MaterialIcons"
            size={20}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Details</Text>
      </View>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>PAYMENT FOR</Text>
          <Text style={styles.summaryCaseName}>
            {caseData?.processName || 'Service'}
          </Text>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Due Date</Text>
            <Text style={styles.summaryValue}>{dueDate || 'N/A'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount Due</Text>
            <Text style={styles.summaryValue}>
              ${caseData?.invoice_payment_info?.totalamt || '0.00'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Enter Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount.toString()}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        <Text style={styles.sectionTitle}>Select a Payment Method</Text>
        <View style={styles.optionsContainer}>
          <PaymentOption
            label="Credit Card"
            iconFamily="FontAwesome"
            iconName="credit-card"
            value="Credit"
            selectedValue={paymentMethod}
            onSelect={setPaymentMethod}
          />
          <PaymentOption
            label="Debit Card"
            iconFamily="FontAwesome"
            iconName="credit-card-alt"
            value="Debit"
            selectedValue={paymentMethod}
            onSelect={setPaymentMethod}
          />
          <PaymentOption
            label="Bank"
            iconFamily="FontAwesome"
            iconName="bank"
            value="bank transfer"
            selectedValue={paymentMethod}
            onSelect={setPaymentMethod}
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={[styles.buttonText, styles.cancelButtonText]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handlePayNow}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.submitButtonText]}>
            {`Pay Now`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Payment;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base_color,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: colors.base_color,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  webViewHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: colors.base_color,
  },
  backButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.circle,
  },
  title: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.lg,
    marginLeft: Spacing.md,
    flex: 1,
  },
  content: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: Spacing.lg,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  summaryTitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: FontSize.sm,
    color: colors.dark_gray,
    marginBottom: Spacing.xs,
  },
  summaryCaseName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.lg,
    color: colors.black_color,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  summaryLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: FontSize.sm,
    color: colors.dark_gray,
  },
  summaryValue: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.sm,
    color: colors.black_color,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: Spacing.md,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.base_color,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#EAEAEA',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dollarSign: {
    fontSize: FontSize.xl,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.dark_gray,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: FontSize.xl,
    fontFamily: 'Montserrat-Bold',
    color: colors.black_color,
    paddingVertical: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    backgroundColor: 'white',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: Spacing.md,
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.md,
    color: colors.dark_gray,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.dark_gray,
    marginBottom: Spacing.md,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.base_color,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#EAEAEA',
    padding: Spacing.sm,
    position: 'relative',
  },
  selectedPaymentOption: {
    borderColor: colors.PrimaryGreen,
    backgroundColor: '#F8FFFB',
  },
  optionIcon: {
    marginRight: Spacing.md,
    width: 40,
    textAlign: 'center',
  },
  optionLabel: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.dark_gray,
  },
  selectedOptionLabel: {
    color: colors.black_color,
  },
  checkIconContainer: {
    position: 'absolute',
    right: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.light_gray,
  },
  submitButton: {
    backgroundColor: colors.PrimaryGreen,
    shadowColor: colors.PrimaryGreen,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
  },
  cancelButtonText: {
    color: colors.dark_gray,
  },
  submitButtonText: {
    color: 'white',
  },
});
