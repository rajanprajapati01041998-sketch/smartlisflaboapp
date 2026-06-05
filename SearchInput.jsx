import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Animated,
} from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from './Authorization/ThemeContext';
import { getThemeStyles } from './src/utils/themeStyles';

const SearchInput = ({
    onSearch,
    placeholder = "Search by name, UHID, or mobile...",
    autoCollapse = true,
}) => {
    const { theme } = useTheme();
    const themed = getThemeStyles(theme);

    const [isExpanded, setIsExpanded] = useState(true);
    const [searchText, setSearchText] = useState('');
    
    const widthAnim = useRef(new Animated.Value(48)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isExpanded) {
            Animated.parallel([
                Animated.timing(widthAnim, {
                    toValue: 300,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(widthAnim, {
                    toValue: 48,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isExpanded]);

    const handleSearchPress = () => {
        if (searchText.trim()) {
            onSearch(searchText.trim());
            if (autoCollapse) setIsExpanded(false);
        }
        if (autoCollapse) setIsExpanded(false);
    };

    const handleClear = () => {
        setSearchText('');
        onSearch('');
        if (autoCollapse) setIsExpanded(false);
    };

    const handleCancel = () => {
        setSearchText('');
        onSearch('');
        if (autoCollapse) setIsExpanded(false);
    };

    return (
        <View style={[themed.childScreen2,tw`flex-row items-center justify-end`]}>
            {isExpanded ? (
                <Animated.View
                    style={[
                        themed.childScreen2,
                        themed.border,
                        tw`flex-1 flex-row items-center rounded-xl overflow-hidden`,
                        { opacity: opacityAnim }
                    ]}
                >
                    <View style={tw`px-3`}>
                        <Icon name="search-outline" size={20} color="#9ca3af" />
                    </View>
                    <TextInput
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholder={placeholder}
                        placeholderTextColor={themed.placeholderColor}
                        autoFocus
                        returnKeyType="search"
                        onSubmitEditing={handleSearchPress}
                        style={[
                            themed.inputText,
                            tw`flex-1 py-3 text-base`,
                        ]}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={handleClear} style={tw`px-3`}>
                            <Icon name="close-circle" size={18} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={handleSearchPress}
                        style={[themed.searchButton, tw`mr-2 p-2 `]}
                    >
                        <Text style={[themed.searchButtonText]}>Search</Text>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                ""
            )}
        </View>
    );
};

export default SearchInput;
