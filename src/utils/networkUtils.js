import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';

export const checkNetworkConnection = async () => {
    const state = await NetInfo.fetch();
    
    if (!state.isConnected) {
        Toast.show({
            type: 'error',
            text1: 'No Internet',
            text2: 'Please check your internet connection.',
        });
        return false;
    }
    if (state.details.linkSpeed && state.details.linkSpeed < 1) { // check for low bandwidth (adjust as needed)
        Toast.show({
            type: 'info',
            text1: 'Low Bandwidth',
            text2: 'Your network connection is slow. Please try again later.',
        });
        return false;
    }
    return true;
};
