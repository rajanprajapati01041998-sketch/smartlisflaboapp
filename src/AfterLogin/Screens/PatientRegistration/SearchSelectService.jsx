import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchInvestigation } from './services/doctorService';
import Icon from 'react-native-vector-icons/Feather';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
  Keyboard,
  InteractionManager,
} from 'react-native';

import SearchSelectServiceItem from './SearchSelectServiceItem';
import { useAuth } from '../../../../Authorization/AuthContext';
import { useToast } from '../../../../Authorization/ToastContext';
import styles from '../../../utils/InputStyle';
import { useTheme } from '../../../../Authorization/ThemeContext';
import { getThemeStyles } from '../../../utils/themeStyles';

const SearchSelectService = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const searchInputRef = useRef(null);

  const { serviceItem } = useAuth();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const themed = getThemeStyles(theme);

  const getItemId = useCallback(item => {
    return Number(item?.itemId ?? item?.serviceItemId ?? item?.id ?? 0);
  }, []);

  const focusSearchInput = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        searchInputRef.current?.focus?.();
      }, 50);
    });
  }, []);

  useEffect(() => {
    focusSearchInput();
  }, [focusSearchInput]);

  useEffect(() => {
    if (!Array.isArray(serviceItem?.Services) || serviceItem.Services.length === 0) {
      return;
    }

    setSelectedServices(prev => {
      if (prev.length > 0) return prev;

      return serviceItem.Services
        .filter(s => Number(s?.IsUnderPackage ?? s?.isUnderPackage ?? 0) === 0)
        .map(s => ({
          itemId: s?.ServiceItemId ?? s?.serviceItemId,
          serviceItemId: s?.ServiceItemId ?? s?.serviceItemId,
          categoryId: s?.CategoryId ?? s?.categoryId ?? 0,
          subCategoryId: s?.SubCategoryId ?? s?.subCategoryId ?? 0,
          subSubCategoryId: s?.SubSubCategoryId ?? s?.subSubCategoryId ?? 0,
          name: s?.ServiceName ?? s?.serviceName ?? '',
        }))
        .filter(x => x.itemId);
    });
  }, [serviceItem?.Services]);

  useEffect(() => {
    if (!modalVisible) {
      focusSearchInput();
    }
  }, [modalVisible, focusSearchInput]);

  const searchInvestigationService = async query => {
    try {
      setLoading(true);

      const response = await searchInvestigation(query);

      if (response?.success) {
        setResults(response.data || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.log('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      const q = searchQuery.trim();

      if (q.length >= 3) {
        searchInvestigationService(q);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleSelectItem = item => {
    const normalizedItemId = getItemId(item);

    if (!normalizedItemId) {
      showToast('Invalid service item. Please try another test.', 'warning');
      return;
    }

    Keyboard.dismiss();

    const exists = selectedServices.some(i => getItemId(i) === normalizedItemId);

    if (exists) {
      showToast('This service is already selected.', 'warning');
      return;
    }

    setSelectedServices(prev => [
      ...prev,
      {
        ...item,
        itemId: normalizedItemId,
        serviceItemId: normalizedItemId,
      },
    ]);

    setIsDirty(true);
    setSearchQuery('');
    setResults([]);
  };

  const handleDelete = item => {
    const deleteId = getItemId(item);

    setSelectedServices(prev => prev.filter(i => getItemId(i) !== deleteId));
    setIsDirty(true);
  };

  const handleSaved = () => {
    setIsDirty(false);
  };

  const showNext = Boolean(serviceItem?.Services?.length > 0 && !isDirty);
  const selectedCount = selectedServices.length;

  return (
    <View style={[themed.childScreen, tw`flex-1 relative`]}>
      <View style={tw`px-4 pt-3`}>
        <View style={tw`w-12 h-1 bg-gray-300 self-center mb-3 rounded-full`} />
      </View>

      <View style={[themed.searchContainer,tw`mt-6`]}>
        <View style={themed.searchBox}>
          <Icon name="search" size={18} color={themed.iconColor} />
          <TextInput
            ref={searchInputRef}
            placeholder="Search Investigation..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={themed.searchInput}
            placeholderTextColor={themed.placeholderColor}
            autoFocus
          />
        </View>
      </View>

      {loading && <ActivityIndicator size="large" />}

      <FlatList
        data={results}
        keyExtractor={(item, index) =>
          String(item?.itemId ?? item?.serviceItemId ?? item?.id ?? index)
        }
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-3 pb-6`}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelectItem(item)}
            style={[
              themed.childScreen,
              themed.border,
              tw`p-3 mb-2 rounded`,
            ]}
          >
            <Text style={themed.inputText}>{item?.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* {selectedCount > 0 && (
        <View style={tw`px-4 pb-2`}>
          <Text style={tw`text-xs text-gray-500`}>
            {selectedCount} test{selectedCount > 1 ? 's' : ''} selected
          </Text>
        </View>
      )} */}

      {/* <View style={tw`px-4`}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={tw`text-white text-center font-semibold`}>
            Close
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* Cart / selected items button (no auto-open after every selection) */}
      {selectedCount > 0 && !modalVisible && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setModalVisible(true)}
          style={tw`absolute top-2 right-4 z-50 rounded-xl bg-red-800/20 border border-red-800/40 px-4 py-2 flex-row items-center`}
        >
          {/* <Icons name="shopping" size={18} color="#fff" /> */}
          <Text style={[tw`text-red-600 font-bold`]}>Add</Text>
          <Text style={tw`text-red-600 font-bold ml-2`}>{`(${selectedCount}) Test}`}</Text>
        </TouchableOpacity>
      )}

      {modalVisible && (
        <View style={tw`absolute inset-0 justify-end`}>
          <Pressable
            style={tw`absolute inset-0 bg-black/40`}
            onPress={() => setModalVisible(false)}
          />

          <View style={[themed.childScreen, tw`w-full rounded-t-3xl pt-3`]}>
            <View style={[themed.cardPadding, tw`flex-1 `]}>
              <SearchSelectServiceItem
                data={selectedServices}
                onDelete={handleDelete}
                isDirty={isDirty}
                onDirtyChange={setIsDirty}
                onSaved={handleSaved}
              />
            </View>

            <View style={tw`pb-4 pt-2`}>
              <View style={tw`flex-row gap-3`}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    tw`flex-1 flex-row items-center justify-center py-3 rounded-xl bg-blue-800/20 mx-2 border border-blue-800/40`,
                  ]}
                  onPress={() => setModalVisible(false)}
                >
                  <Icons name="refresh" size={18} color="#2563EB" style={tw`mr-2`} />

                  <Text style={tw`text-blue-600 text-center font-semibold text-base`}>
                    select Another
                  </Text>
                </TouchableOpacity>

                {showNext && (
                  <TouchableOpacity
                    style={tw`flex-1 bg-green-800/20 border border-green-800/40 py-3 rounded-xl mr-2`}
                    onPress={() => {
                      setModalVisible(false);
                      onClose?.();
                    }}
                  >
                    <Text style={tw`text-green-500 text-center font-medium`}>
                      Next
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default SearchSelectService;