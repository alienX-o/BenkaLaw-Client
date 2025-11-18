import React from 'react';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Fontisto from 'react-native-vector-icons/Fontisto';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

// Mapping icon type to component
const ICON_MAP = {
  Feather,
  AntDesign,
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome,
  EvilIcons,
  Entypo,
  Ionicons,
  Octicons,
  FontAwesome5,
  FontAwesome6: FontAwesome5, // alias
  Fontisto,
  SimpleLineIcons,
};

const VectorIcon = ({
  icon = 'Feather',
  name,
  color = '#000',
  size = 20,
  style,
  ...rest
}) => {
  const IconComponent = ICON_MAP[icon];

  if (!IconComponent || !name) {
    console.warn(`⚠️ Invalid icon type: "${icon}" or name: "${name}"`);
    return null;
  }

  return (
    <IconComponent
      name={name}
      color={color}
      size={size}
      style={style}
      {...rest}
    />
  );
};

export default VectorIcon;

// Useage example
{/* <VectorIcon icon="FontAwesome" name="home" size={24} color="#4B5E9E" />
<VectorIcon icon="AntDesign" name="pluscircle" size={30} color="green" />
<VectorIcon icon="FontAwesome6" name="file-pdf" color="red" /> */}