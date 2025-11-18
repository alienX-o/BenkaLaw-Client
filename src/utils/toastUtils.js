import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import theme from '../constants/theme';
import { moderateScale } from 'react-native-size-matters';
import colors from '../constants/colors';


export const toastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{ width:'95%', borderLeftColor: colors.green }}
        contentContainerStyle={{ paddingHorizontal: moderateScale(8) }}
        text1Style={{
          fontSize: 13,
          color:colors.green
        }}
        text2Style={{
          fontSize: 11,
          flexWrap: 'wrap',
          flexShrink: 1
        }}
        text2NumberOfLines={0}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={{width:'95%', borderLeftColor: colors.danger}}
        text1Style={{
          fontSize: 13,
        }}
        text2Style={{
          fontSize: 11,
        }}
        text2NumberOfLines={0}
      />
    ),


    info: (props) => (
      <ErrorToast
        {...props}
        style={{width:'95%', borderLeftColor: colors.PrimaryBlue}}
        text1Style={{
          fontSize: 13,
        }}
        text2Style={{
          fontSize: 11,
        }}
        text2NumberOfLines={0}
      />
    ),
  };

// Common Toast utility function
export const showToast = (type, title, message) => {
    Toast.show({
        type: type, // Types: 'success', 'error', 'info'
        text1: title,
        text2: message,
        // position: 'bottom', // Positions: 'top', 'bottom'
        // visibilityTime: 4000, // duration in milliseconds
    });
};

// Common error handler for generic errors
export const showGenericError = () => {
    showToast('error', 'Alert', 'Something went wrong. Please try again!');
};