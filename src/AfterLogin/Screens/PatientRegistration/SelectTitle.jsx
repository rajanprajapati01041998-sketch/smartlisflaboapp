import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import tw from 'twrnc';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';

const SelectTitle = ({ onSelectTitle, onClose }) => {
  const [selected, setSelected] = useState('');
  const { theme } = useTheme();
  const themed = getThemeStyles(theme);

  const titles = [
    { label: 'Mr.', icon: 'male', color: '#3b82f6' },
    { label: 'Mrs.', icon: 'female', color: '#ec4899' },
    { label: 'Miss.', icon: 'female', color: '#ec4899' },
    { label: 'Ms.', icon: 'female', color: '#ec4899' },
    { label: 'Dr.', icon: 'user-md', color: '#8b5cf6' },
    { label: 'Other', icon: 'user', color: '#6b7280' },
  ];

  const handleSelect = title => {
    setSelected(title);
    onSelectTitle(title);
    onClose();
  };

  return (
    <View style={tw`mb-4`}>
      <Text style={[themed.modalHeaderTitle, tw`text-xl font-bold mb-4 text-center`]}>
        Select Title
      </Text>

      {titles.map((item, index) => {
        const isSelected = selected === item.label;

        return (
          <TouchableOpacity
            key={index}
            onPress={() => handleSelect(item.label)}
            activeOpacity={0.75}
            style={[
              themed.border,
              tw`flex-row items-center px-4 py-3 rounded-xl mb-2`,
              isSelected
                ? { backgroundColor: item.color, borderColor: item.color }
                : themed.inputBox,
            ]}
          >
            <FontAwesome5
              name={item.icon}
              size={18}
              color={isSelected ? '#ffffff' : item.color}
              style={tw`mr-3`}
            />

            <Text
              style={[
                tw`font-bold text-base`,
                isSelected ? tw`text-white` : themed.inputText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default SelectTitle;