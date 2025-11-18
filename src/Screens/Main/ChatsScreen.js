// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   FlatList,
//   TextInput,
//   Image,
//   TouchableOpacity,
// } from 'react-native';
// import { BorderRadius, Shadow, Spacing } from '../../constants/theme/matrics';
// import { FontSize } from '../../constants/theme';
// import colors from '../../constants/colors';
// import VectorIcons from '../../assets/vectorIcons/VectorIcons';
// import { useNavigation } from '@react-navigation/native';

// const chats = [
//   {
//     id: '1',
//     name: 'John Doe',
//     avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
//     lastMessage: 'Sure, I will send the documents over by EOD.',
//     timestamp: '10:45 AM',
//     unreadCount: 2,
//     isOnline: true,
//   },
//   {
//     id: '2',
//     name: 'Jane Smith',
//     avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
//     lastMessage: 'Thank you for the update!',
//     timestamp: '9:30 AM',
//     unreadCount: 0,
//     isOnline: false,
//   },
//   {
//     id: '3',
//     name: 'Acme Corp Legal',
//     avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
//     lastMessage: 'Please review the attached contract.',
//     timestamp: 'Yesterday',
//     unreadCount: 1,
//     isOnline: true,
//   },
//   {
//     id: '4',
//     name: 'Robert Johnson',
//     avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
//     lastMessage: 'Got it, thanks!',
//     timestamp: 'Yesterday',
//     unreadCount: 0,
//     isOnline: false,
//   },
//   {
//     id: '5',
//     name: 'Emily White',
//     avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
//     lastMessage: 'Can we schedule a call for tomorrow?',
//     timestamp: '2 days ago',
//     unreadCount: 0,
//     isOnline: true,
//   },
// ];

// const ChatItem = ({ item, navigation }) => (
//   <TouchableOpacity
//     style={styles.chatItemContainer}
//     onPress={() =>
//       navigation.navigate('ChatDetailScreen', {
//         chatId: item.id,
//         name: item.name,
//         avatar: item.avatar,
//       })
//     }
//   >
//     <View style={styles.avatarContainer}>
//       <Image source={{ uri: item.avatar }} style={styles.avatar} />
//       <View
//         style={[
//           styles.statusDot,
//           item.isOnline ? styles.onlineStatus : styles.offlineStatus,
//         ]}
//       />
//     </View>
//     <View style={styles.chatContent}>
//       <Text style={styles.chatName}>{item.name}</Text>
//       <Text style={styles.lastMessage} numberOfLines={1}>
//         {item.lastMessage}
//       </Text>
//     </View>
//     <View style={styles.chatMeta}>
//       <Text style={styles.timestamp}>{item.timestamp}</Text>
//       {item.unreadCount > 0 && (
//         <View style={styles.unreadBadge}>
//           <Text style={styles.unreadText}>{item.unreadCount}</Text>
//         </View>
//       )}
//     </View>
//   </TouchableOpacity>
// );

// const ChatsScreen = () => {
//   const navigation = useNavigation();
//   const [isSearchVisible, setIsSearchVisible] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [filteredChats, setFilteredChats] = useState(chats);

//   useEffect(() => {
//     if (searchQuery.trim() === '') {
//       setFilteredChats(chats);
//     } else {
//       const filteredData = chats.filter(chat =>
//         chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
//       );
//       setFilteredChats(filteredData);
//     }
//   }, [searchQuery]);

//   const handleSearchCancel = () => {
//     setIsSearchVisible(false);
//     setSearchQuery('');
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {isSearchVisible ? (
//         <View style={styles.searchHeader}>
//           <TouchableOpacity
//             onPress={handleSearchCancel}
//             style={styles.backButton}
//           >
//             <VectorIcons
//               icon="Ionicons"
//               name="arrow-back"
//               size={24}
//               color={colors.black_color}
//             />
//           </TouchableOpacity>
//           <TextInput
//             placeholder="Search chats..."
//             placeholderTextColor={colors.dark_gray}
//             style={styles.searchInput}
//             autoFocus={true}
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//         </View>
//       ) : (
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Recent Chats</Text>
//           <TouchableOpacity
//             onPress={() => setIsSearchVisible(true)}
//             style={styles.searchButton}
//           >
//             <VectorIcons
//               icon="Ionicons"
//               name="search"
//               size={22}
//               color={colors.black_color}
//             />
//           </TouchableOpacity>
//         </View>
//       )}

//       <FlatList
//         data={filteredChats}
//         renderItem={({ item }) => (
//           <ChatItem item={item} navigation={navigation} />
//         )}
//         keyExtractor={item => item.id}
//         contentContainerStyle={{ padding: Spacing.md }}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'white',
//   },
//   // This style is not used with the dynamic search header, so it can be removed.
//   // searchContainer: { ... },
//   // This style is not used with the dynamic search header, so it can be removed.
//   // searchIcon: { ... },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: Spacing.md,
//   },
//   headerTitle: {
//     fontSize: FontSize.lg,
//     fontFamily: 'Montserrat-SemiBold',
//     color: colors.black_color,
//   },
//   searchButton: {
//     padding: Spacing.xs,
//   },
//   searchHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: Spacing.md,
//     paddingVertical: Spacing.sm,
//   },
//   backButton: {
//     marginRight: Spacing.md,
//   },
//   searchInput: {
//     flex: 1,
//     height: 40,
//     fontSize: FontSize.md,
//     color: colors.black_color,
//     backgroundColor: '#EFEFEF',
//     borderRadius: BorderRadius.md,
//     paddingHorizontal: Spacing.md,
//     fontFamily: 'Montserrat-Regular',
//   },
//   chatItemContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.base_color,
//     borderRadius: BorderRadius.lg,
//     padding: Spacing.md,
//     borderColor: '#D3D3D3',
//     borderWidth: 0.5,
//     marginBottom: Spacing.sm,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: Spacing.md,
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//   },
//   statusDot: {
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     borderWidth: 2,
//     borderColor: colors.base_color,
//   },
//   onlineStatus: {
//     backgroundColor: '#4CE417',
//   },
//   offlineStatus: {
//     backgroundColor: '#BDBDBD',
//   },
//   chatContent: {
//     flex: 1,
//   },
//   chatName: {
//     fontSize: FontSize.md,
//     fontFamily: 'Montserrat-SemiBold',
//     color: colors.black_color,
//   },
//   lastMessage: {
//     fontSize: FontSize.sm,
//     fontFamily: 'Montserrat-Regular',
//     color: colors.dark_gray,
//     marginTop: 2,
//   },
//   chatMeta: {
//     alignItems: 'flex-end',
//   },
//   timestamp: {
//     fontSize: FontSize.xs,
//     color: colors.dark_gray,
//     marginBottom: Spacing.xs,
//     fontFamily: 'Montserrat-Regular',
//   },
//   unreadBadge: {
//     backgroundColor: colors.PrimaryGreen,
//     borderRadius: 10,
//     minWidth: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   unreadText: {
//     color: 'white',
//     fontSize: FontSize.xs,
//     fontFamily: 'Montserrat-Bold',
//   },
// });

// export default ChatsScreen;
import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const ChatsScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Coming Soon!</Text>
    </View>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
