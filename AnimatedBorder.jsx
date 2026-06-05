import React, {useEffect, useRef} from 'react';
import {Animated} from 'react-native';

const AnimatedBorder = ({children}) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }),
    ).start();
  }, []);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      '#f182ba',
      '#efb671',
      '#7cdcd2',
      '#81b8f0',
      '#f182ba',
    ],
  });

  return (
    <Animated.View
      style={{
        borderWidth: 2,
        borderRadius: 16,
        borderColor,
        padding: 2,
      }}>
      {children}
    </Animated.View>
  );
};

export default AnimatedBorder;