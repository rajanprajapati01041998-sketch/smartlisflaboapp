import React, { useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

const SLIDER_WIDTH = width - 32;
const SLIDER_HEIGHT = 65;
const THUMB_SIZE = 55;
const MAX_TRANSLATE = SLIDER_WIDTH - THUMB_SIZE - 6;

const SwipeButton = ({ onComplete, title = 'Slide To Complete Delivery' }) => {
  const [completed, setCompleted] = useState(false);
  const translateX = useSharedValue(0);

  const handleComplete = async () => {
    setCompleted(true);

    if (onComplete) {
      try {
        const success = await onComplete();

        if (success === false) {
          setCompleted(false);
          translateX.value = withSpring(0);
        }
      } catch (e) {
        setCompleted(false);
        translateX.value = withSpring(0);
      }
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      if (completed) return;

      translateX.value = Math.max(0, Math.min(e.translationX, MAX_TRANSLATE));
    })
    .onEnd(() => {
      if (completed) return;

      if (translateX.value > MAX_TRANSLATE * 0.75) {
        translateX.value = withTiming(MAX_TRANSLATE, { duration: 180 });
        runOnJS(handleComplete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE,
    opacity: interpolate(
      translateX.value,
      [0, MAX_TRANSLATE],
      [0.85, 1],
      Extrapolate.CLAMP,
    ),
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, MAX_TRANSLATE * 0.7],
      [1, 0.15],
      Extrapolate.CLAMP,
    ),
  }));

  return (
    <View style={tw`items-center justify-center`}>
      <View
        style={[
          {
            width: SLIDER_WIDTH,
            height: SLIDER_HEIGHT,
            borderRadius: SLIDER_HEIGHT / 2,
            backgroundColor: 'rgba(255,255,255,0.20)',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.65)',
            overflow: 'hidden',
            shadowColor: '#2563eb',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 14,
            elevation: 8,
          },
        ]}
      >
        {/* blue-green full glass fill */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              borderRadius: SLIDER_HEIGHT / 2,
              overflow: 'hidden',
            },
            fillStyle,
          ]}
        >
          <LinearGradient
            colors={
              completed
                ? ['#16a34a', '#22c55e']
                : ['#2563eb', '#06b6d4', '#22c55e']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={tw`flex-1`}
          />
        </Animated.View>

        {/* soft glass overlay */}
        <LinearGradient
          colors={[
            'rgba(67, 169, 195, 0.7)',
            'rgba(83, 137, 188, 0.33)',
            'rgba(4, 191, 185, 0.71)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={tw`absolute inset-0`}
        />

        {/* title */}
        <View style={tw`absolute inset-0 items-center justify-center`}>
          <Text
            style={[
              tw`font-extrabold text-lg tracking-wide`,
              {
                color: '#087627ff',
                textShadowColor: 'rgba(3, 80, 10, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              },
            ]}
          >
            {completed ? '✓ Sample Delivered' : title}
          </Text>
        </View>

        {/* right animated arrows */}
        {!completed && (
          <Animated.View
            style={[
              tw`absolute right-8 top-0 bottom-0 justify-center`,
              arrowStyle,
            ]}
          >
            <Text style={tw`text-white/80 text-3xl font-black`}>›››</Text>
          </Animated.View>
        )}

        {/* thumb */}
        {!completed && (
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: 3,
                  top: 3,
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: THUMB_SIZE / 2,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#2563eb',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 10,
                },
                thumbStyle,
              ]}
            >
              <LinearGradient
                colors={['#ffffff', '#eef6ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  tw`items-center justify-center`,
                  {
                    width: THUMB_SIZE,
                    height: THUMB_SIZE,
                    borderRadius: THUMB_SIZE / 2,
                    borderWidth: 1,
                    borderColor: 'rgba(37,99,235,0.20)',
                  },
                ]}
              >
                <Text style={tw`text-blue-700 text-3xl font-black`}>››</Text>
              </LinearGradient>
            </Animated.View>
          </GestureDetector>
        )}
      </View>
    </View>
  );
};

export default SwipeButton;
