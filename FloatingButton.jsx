import React, {useRef, useState} from 'react';
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  Modal,
  View,
  Text,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import tw from 'twrnc';
import GlobalSearchPatientList from './GlobalSearchPatientList';
import { useTheme } from './Authorization/ThemeContext';
import { getThemeStyles } from './src/utils/themeStyles';

const {width, height} = Dimensions.get('window');

const FloatingButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const {theme} = useTheme();
  const themed = getThemeStyles(theme);

  const pan = useRef(
    new Animated.ValueXY({
      x: width - 80,
      y: height - 180,
    }),
  ).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,

      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5 ||
        Math.abs(gestureState.dy) > 5,

      onPanResponderGrant: () => {
        pan.extractOffset();
      },

      onPanResponderMove: Animated.event(
        [null, {dx: pan.x, dy: pan.y}],
        {useNativeDriver: false},
      ),

      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    }),
  ).current;

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          tw`absolute z-50`,
          {
            transform: pan.getTranslateTransform(),
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
          style={tw`w-15 h-15 rounded-full bg-blue-500 justify-center items-center shadow-lg`}>
          <Feather name="search" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={tw`flex-1 bg-black/50 justify-center items-center`}>
          <View
            style={[themed.childScreen2, tw`w-[96%] min-h-[90%]  rounded-xl p-5 border`]}>
            <GlobalSearchPatientList onClose={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
};

export default FloatingButton;