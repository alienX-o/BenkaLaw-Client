// screens/Main/ChatDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { BorderRadius, Spacing } from '../../constants/theme/matrics';
import { FontSize } from '../../constants/theme';
import colors from '../../constants/colors';
import VectorIcons from '../../assets/vectorIcons/VectorIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { pick, types, keepLocalCopy } from '@react-native-documents/picker';

const initialMessages = [
  {
    id: '3',
    name: 'Ricky Smith',
    text: 'These are some images about our destination.',
    timestamp: '16.03',
    sender: 'other',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    image: 'https://picsum.photos/seed/picsum/200/300',
  },
  {
    id: '1',
    name: 'Ricky Smith',
    text: 'Hello guys, we have discussed about post-corona vacation plan and our decision is to go to Bali. We will have a very big party after this corona ends! These are some images about our destination',
    timestamp: '16.04',
    sender: 'other',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: '2',
    text: "That's very nice place! you guys made a very good decision. Can't wait to go on vacation!",
    timestamp: '16:05',
    sender: 'me',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
];

const AttachmentOption = ({ icon, name, onPress }) => (
  <TouchableOpacity style={styles.attachmentOption} onPress={onPress}>
    <View style={styles.attachmentIconContainer}>
      <VectorIcons
        icon={icon.family}
        name={icon.name}
        size={24}
        color={colors.PrimaryGreen}
      />
    </View>
    <Text style={styles.attachmentOptionText}>{name}</Text>
  </TouchableOpacity>
);

const MessageBubble = ({ item }) => {
  const isMyMessage = item.sender === 'me';
  const myAvatar = 'https://randomuser.me/api/portraits/men/32.jpg';

  const renderMessageContent = () => {
    if (item.image) {
      return <Image source={{ uri: item.image }} style={styles.messageImage} />;
    }
    if (item.audio) {
      return <View style={styles.audioMessageContainer}></View>;
    }
    if (item.file) {
      return (
        <TouchableOpacity
          style={styles.fileMessageContainer}
          onPress={() => {
            Alert.alert('File Selected', `File: ${item.file.name}`);
            // Optionally: use Linking.openURL(item.file.uri) or a viewer
          }}
        >
          <VectorIcons
            icon="Ionicons"
            name="document"
            size={20}
            color={colors.PrimaryGreen}
          />
          <Text style={styles.fileMessageText}>{item.file.name}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <Text
        style={isMyMessage ? styles.myMessageText : styles.otherMessageText}
      >
        {item.text}
      </Text>
    );
  };

  return (
    <View
      style={[
        styles.messageRow,
        isMyMessage
          ? { justifyContent: 'flex-end' }
          : { justifyContent: 'flex-start' },
      ]}
    >
      {!isMyMessage && (
        <View style={[styles.bubbleContainer, { alignItems: 'flex-start' }]}>
          <Image source={{ uri: item.avatar }} style={styles.messageAvatar} />
          <View style={[styles.messageBubble, styles.otherMessage]}>
            <Text style={styles.senderName}>{item.name}</Text>
            {renderMessageContent()}
            <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
          </View>
        </View>
      )}
      {isMyMessage && (
        <View
          style={[
            styles.bubbleContainer,
            { justifyContent: 'flex-end', alignItems: 'flex-end' },
          ]}
        >
          <View style={[styles.messageBubble, styles.myMessage]}>
            {renderMessageContent()}
            <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
          </View>
          {/* Use a consistent avatar for "me" */}
          <Image source={{ uri: myAvatar }} style={styles.messageAvatar} />
        </View>
      )}
    </View>
  );
};

const ChatDetailScreen = ({ route, navigation }) => {
  const { name, avatar } = route.params;
  const [messages, setMessages] = React.useState(initialMessages);
  const [inputText, setInputText] = React.useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const myAvatar = 'https://randomuser.me/api/portraits/men/32.jpg';

  const sendMessage = messageData => {
    const newMessage = {
      id: Date.now().toString(),
      sender: 'me',
      avatar: myAvatar,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      ...messageData,
    };

    setMessages(prevMessages => [newMessage, ...prevMessages]);
  };

  const attachmentOptions = [
    {
      id: 1,
      name: 'Camera',
      icon: { family: 'Ionicons', name: 'camera' },
      onPress: () => handleCamera(),
    },
    {
      id: 2,
      name: 'Gallery',
      icon: { family: 'Ionicons', name: 'images' },
      onPress: () => handleGallery(),
    },
    {
      id: 3,
      name: 'Document',
      icon: { family: 'Ionicons', name: 'document' },
      onPress: () => handleDocument(),
    },
  ];

  // Request permissions
  const requestPermissions = async permissions => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = permissions.every(
          permission =>
            grants[permission] === PermissionsAndroid.RESULTS.GRANTED,
        );

        return allGranted;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  };

  const checkAndRequestPermissions = async permissions => {
    if (Platform.OS === 'android') {
      try {
        const granted = {};
        for (const permission of permissions) {
          granted[permission] = await PermissionsAndroid.check(permission);
        }

        const allPermissionsGranted = permissions.every(p => granted[p]);
        if (allPermissionsGranted) {
          return true;
        }

        // If not all are granted, request them.
        return await requestPermissions(permissions);
      } catch (err) {
        console.warn('Permission check/request error:', err);
        return false;
      }
    }
    return true; // For iOS
  };
  // Camera functionality
  const handleCamera = async () => {
    closeAttachmentMenu();

    const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.CAMERA];
    if (Platform.OS === 'android') {
      // For Android < 29, WRITE_EXTERNAL_STORAGE is needed to save to gallery.
      // For Android 29+, react-native-image-picker uses MediaStore, no explicit WRITE_EXTERNAL_STORAGE needed.
      // If we want to ensure access to the saved photo in the gallery immediately after capture on Android 13+,
      // we might need READ_MEDIA_IMAGES, but react-native-image-picker usually handles this.
      // Let's rely on the library for saving and only request CAMERA here.
    }

    const hasPermission = await checkAndRequestPermissions(
      permissionsToRequest,
    );

    if (!hasPermission) {
      Alert.alert(
        'Permission required',
        'Camera and storage permissions are needed to take photos',
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      cameraType: 'back',
      saveToPhotos: true,
      includeBase64: false,
    };

    launchCamera(options, response => {
      console.log('Camera response:', response);

      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        Alert.alert(
          'Camera Error',
          response.errorMessage || 'Unknown error occurred',
        );
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        console.log('Camera image captured:', imageUri);

        // Send image as a message
        sendMessage({ image: imageUri });
      }
    });
  };

  // Gallery functionality
  const handleGallery = async () => {
    closeAttachmentMenu();

    let permissionsToRequest = [];
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        permissionsToRequest = [
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ];
      } else {
        permissionsToRequest = [
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ];
      }
    }

    const hasPermission = await checkAndRequestPermissions(
      permissionsToRequest,
    );

    if (!hasPermission) {
      Alert.alert(
        'Permission required',
        'Storage permission is needed to access photos',
      );
      return;
    }

    openGallery();
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5, // 0 means unlimited
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      console.log('Gallery response:', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert(
          'Gallery Error',
          response.errorMessage || 'Unknown error occurred',
        );
      } else if (response.assets && response.assets.length > 0) {
        const selectedImages = response.assets;
        console.log('Selected images:', selectedImages);

        // Send each selected image as a message
        selectedImages.forEach(image => sendMessage({ image: image.uri }));
      }
    });
  };
  const handleDocument = async () => {
    closeAttachmentMenu();

    try {
      const results = await pick({
        type: [types.allFiles], // you can restrict to types.pdf, types.docx, etc.
        allowMultiSelection: false,
      });

      if (results && results.length > 0) {
        const file = results[0];

        // Optionally create a local copy (some URIs are content:// which can be tricky)
        const localFile = await keepLocalCopy(file.uri);

        // Send as a message (you can display differently in UI)
        sendMessage({
          text: `📄 ${file.name}`,
          file: {
            name: file.name,
            uri: localFile.localUri,
            type: file.mimeType,
            size: file.size,
          },
        });
      }
    } catch (err) {
      if (err.code === 'OPERATION_CANCELED') {
        console.log('User cancelled document picker');
      } else {
        Alert.alert('Document Error', err.message || 'Something went wrong');
      }
    }
  };

  const handleAttachmentPress = () => {
    setShowAttachmentMenu(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeAttachmentMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowAttachmentMenu(false);
    });
  };

  const handleSendText = () => {
    if (inputText.trim().length > 0) {
      sendMessage({ text: inputText.trim() });
      setInputText('');
    }
  };

  const menuTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <VectorIcons
            icon="Ionicons"
            name="arrow-back"
            size={24}
            color={colors.black_color}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Image source={{ uri: avatar }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerTitleText}>{name}</Text>
            <Text style={styles.headerSubtitle}>Active 12 Minutes Ago</Text>
          </View>
        </View>
        <View style={styles.headerRightContainer}>
          <TouchableOpacity style={styles.headerButton}>
            <VectorIcons
              icon="Ionicons"
              name="call-outline"
              size={24}
              color={colors.black_color}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <VectorIcons
              icon="MaterialIcons"
              name="more-vert"
              size={24}
              color={colors.black_color}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          data={messages}
          renderItem={({ item }) => <MessageBubble item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesContainer}
          style={styles.flexOne}
          inverted
        />

        <View style={styles.inputOuterContainer}>
          <View style={styles.inputInnerContainer}>
            <Image source={{ uri: myAvatar }} style={styles.inputAvatar} />
            <TextInput
              style={styles.input}
              placeholder="Type your message here..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handleAttachmentPress}
            >
              <VectorIcons
                icon="Ionicons"
                name="attach"
                size={30}
                color="#555"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendText}
            >
              <VectorIcons
                icon="Ionicons"
                name="send"
                size={24}
                color={colors.PrimaryGreen}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="none"
        onRequestClose={closeAttachmentMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeAttachmentMenu}
        >
          <Animated.View
            style={[
              styles.attachmentMenu,
              {
                transform: [{ translateY: menuTranslateY }],
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderText}>Send Media</Text>
              <TouchableOpacity onPress={closeAttachmentMenu}>
                <VectorIcons
                  icon="Ionicons"
                  name="close"
                  size={24}
                  color={colors.black_color}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.attachmentOptionsContainer}>
              {attachmentOptions.map(option => (
                <AttachmentOption
                  key={option.id}
                  icon={option.icon}
                  name={option.name}
                  onPress={option.onPress}
                />
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.base_color,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  headerTitleText: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  headerButton: {
    padding: Spacing.xs,
  },
  messagesContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  bubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexShrink: 1,
    maxWidth: '85%',
  },
  messageBubble: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  myMessage: {
    backgroundColor: colors.PrimaryGreen,
    borderBottomRightRadius: 0,
    marginRight: Spacing.xs,
  },
  otherMessage: {
    backgroundColor: '#EFEFEF',
    borderTopLeftRadius: 0,
    marginLeft: Spacing.xs,
  },
  myMessageText: {
    color: colors.base_color,
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
  },
  otherMessageText: {
    color: colors.black_color,
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
  },
  senderName: {
    color: '#E8803F',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
    fontSize: FontSize.sm,
  },
  messageTimestamp: {
    fontSize: FontSize.xs,
    color: '#555',
    fontFamily: 'Montserrat-Regular',
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
  },
  audioMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  audioDurationText: {
    marginLeft: Spacing.sm,
    fontFamily: 'Montserrat-Regular',
    fontSize: FontSize.sm,
  },

  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.sm,
  },
  inputOuterContainer: {
    padding: Spacing.sm,
    backgroundColor: colors.base_color,
  },
  inputInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? Spacing.xs : 0,
    fontFamily: 'Montserrat-Regular',
    maxHeight: 100,
  },
  attachmentButton: {
    padding: Spacing.xs,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  // Recording Styles
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF4444',
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingText: {
    color: colors.base_color,
    marginLeft: Spacing.sm,
    fontFamily: 'Montserrat-Medium',
    fontSize: FontSize.sm,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.base_color,
    marginLeft: Spacing.sm,
    opacity: 0.8,
  },
  stopRecordingButton: {
    backgroundColor: colors.base_color,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  stopRecordingText: {
    color: '#FF4444',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: FontSize.sm,
  },
  // Attachment Menu Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  attachmentMenu: {
    backgroundColor: colors.base_color,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuHeaderText: {
    fontSize: FontSize.md,
    fontFamily: 'Montserrat-SemiBold',
    color: colors.black_color,
  },
  attachmentOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  attachmentOption: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  attachmentIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  attachmentOptionText: {
    fontSize: FontSize.sm,
    fontFamily: 'Montserrat-Regular',
    color: colors.black_color,
    textAlign: 'center',
  },
  fileMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#EAEAEA',
    borderRadius: BorderRadius.md,
  },
  fileMessageText: {
    marginLeft: 8,
    fontFamily: 'Montserrat-Regular',
    fontSize: FontSize.sm,
    color: colors.black_color,
  },
});

export default ChatDetailScreen;
