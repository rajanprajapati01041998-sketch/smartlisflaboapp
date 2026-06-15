import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import tw from 'twrnc';
import Icon2 from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';

const SelectMaritalStatus = ({ onSelectMarital, onClose }) => {
  const { theme } = useTheme();
  const themed = getThemeStyles(theme);
  const isDark = theme === 'dark';

  const [selectedValue, setSelectedValue] = useState(null);

  const maritalStatusList = [
    { id: 1, name: 'Married' },
    { id: 2, name: 'Un-Married' },
  ];

  const handleSelect = (item) => {
    setSelectedValue(item.id);
    onSelectMarital(item);
    onClose();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        themed.border,
        tw`p-4 mb-3 rounded-xl flex-row justify-between items-center`,
        {
          borderWidth: 1,
          borderColor:
            selectedValue === item.id
              ? '#10b981'
              : isDark
              ? '#334155'
              : '#e5e7eb',
        },
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[themed.inputText, tw`text-base font-medium`]}>
        {item.name}
      </Text>

      {selectedValue === item.id && (
        <Icon2 name="checkmark-circle" size={24} color="#10b981" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[themed.childScreen, tw`flex-1 p-4`]}>
      <View style={[themed.borderBottom, tw`pb-3 mb-3`]}>
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={themed.modalHeaderTitle}>
            Select Marital Status
          </Text>

          <TouchableOpacity onPress={onClose}>
            <Icon2 name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={maritalStatusList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default SelectMaritalStatus;