import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import tw from 'twrnc';
import Icon2 from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';

const SelectRelativeName = ({ onSelectRelative, onClose }) => {
  const { theme } = useTheme();
  const themed = getThemeStyles(theme);
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValue, setSelectedValue] = useState(null);

  const relations = [
    { id: 1, name: 'Father' },
    { id: 2, name: 'Mother' },
    { id: 3, name: 'Husband' },
    { id: 4, name: 'Wife' },
    { id: 5, name: 'Brother' },
    { id: 6, name: 'Sister' },
    { id: 7, name: 'Son' },
    { id: 8, name: 'Daughter' },
    { id: 9, name: 'Guardian' },
    { id: 10, name: 'Other' },
  ];

  const filteredRelations = relations.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSelect = item => {
    setSelectedValue(item.id);
    onSelectRelative?.(item);
    onClose?.();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
      style={[
        themed.border,
        tw`p-4 mb-3 rounded-xl flex-row justify-between items-center`,
        {
          backgroundColor: isDark ? '#16263a' : '#ffffff',
          borderWidth: 1,
          borderColor:
            selectedValue === item.id
              ? '#10b981'
              : isDark
              ? '#334155'
              : '#e5e7eb',
        },
      ]}
    >
      <Text
        style={{
          color: isDark ? '#F8FAFC' : '#1F2937',
          fontSize: 16,
          fontWeight: '600',
        }}
      >
        {item.name}
      </Text>

      {selectedValue === item.id && (
        <MaterialIcons
          name="check-circle"
          size={22}
          color="#10b981"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[themed.childScreen, tw`flex-1`]}>
      {/* Header */}
      <View style={themed.borderBottom}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Text style={themed.modalHeaderTitle}>
            Select patient's relation
          </Text>

          <TouchableOpacity
            onPress={onClose}
            style={[
              tw`p-2 rounded-full`,
              {
                backgroundColor: isDark ? '#e5e7eb' : '#f3f4f6',
              },
            ]}
          >
            <Icon2
              name="close"
              size={20}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>

        
      </View>

      {/* Search */}
      <View style={tw`p-3`}>
        <View style={themed.searchBox}>
          <Icon2
            name="search-outline"
            size={20}
            color={themed.iconColor}
          />

          <TextInput
            style={themed.searchInput}
            placeholder="Search relation..."
            placeholderTextColor={themed.placeholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Icon2
                name="close-circle"
                size={20}
                color={themed.iconColor}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredRelations}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={tw`px-3 pb-5`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={tw`items-center mt-10`}>
            <Text
              style={{
                color: isDark ? '#CBD5E1' : '#6B7280',
              }}
            >
              No Relation Found
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default SelectRelativeName;