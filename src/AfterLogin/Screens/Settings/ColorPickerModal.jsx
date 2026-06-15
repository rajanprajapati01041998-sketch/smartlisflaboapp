import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    TextInput,
    Dimensions,
} from "react-native";
import tw from 'twrnc';

const { width } = Dimensions.get('window');
const swatchSize = (width - 80) / 6; // Calculate responsive size for color swatches
import { colorPalette } from './ColorPallate'
import { useTheme } from "../../../../Authorization/ThemeContext";
import { getThemeStyles } from "../../../utils/themeStyles";

const ColorPickerModal = ({
    visible,
    onClose,
    onColorSelect,
    initialColor = "#FFFFFF",
    title = "Select color"
}) => {
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const [customColor, setCustomColor] = useState("");
    const { theme } = useTheme()
    const themed = getThemeStyles(theme)



    const getContrastColor = (hexColor) => {
        if (!hexColor || hexColor === '') return '#000000';
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    };

    const handleColorSelect = (color) => {
        setSelectedColor(color);
    };

    const handleCustomColorSubmit = () => {
        const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (customColor && hexPattern.test(customColor)) {
            setSelectedColor(customColor);
            setCustomColor("");
        } else if (customColor) {
            alert("Please enter a valid hex color code (e.g., #FF5733)");
        }
    };

    const handleConfirm = () => {
        onColorSelect(selectedColor);
        onClose();
    };

    const resetToInitial = () => {
        setSelectedColor(initialColor);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 bg-black bg-opacity-50 justify-end`}>
                <View style={[themed.childScreen2,tw` rounded-t-3xl p-5 max-h-[90%]`]} >
                    {/* Header */}
                    <View style={tw`flex-row justify-between items-center mb-5 pb-2 border-b border-gray-200`}>
                        <Text style={tw`text-xl font-bold text-gray-800`}>🎨 {title}</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={tw`w-8 h-8 rounded-full bg-gray-100 justify-center items-center`}
                        >
                            <Text style={tw`text-xl text-gray-600 font-semibold`}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Current Selected Color Preview */}
                    <View style={tw`mb-5`}>
                        <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Selected Color</Text>
                        <View style={[themed.border,
                            tw`w-full h-20 rounded-xl justify-center items-center `,
                            { backgroundColor: selectedColor }
                        ]}>
                            <Text style={[tw`text-base font-bold px-3 py-1 text-center rounded-full`, {
                                color: getContrastColor(selectedColor),
                                backgroundColor: 'rgba(0,0,0,0.1)'
                            }]}>
                                {selectedColor}
                            </Text>
                        </View>
                    </View>

                    {/* Color Palette Grid */}
                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        style={tw`mb-2`}
                        contentContainerStyle={tw`pb-2`}
                    >
                        <Text style={tw`text-sm font-semibold text-gray-700 mb-3`}>Preset Colors</Text>
                        <View style={tw`flex-row flex-wrap justify-between`}>
                            {colorPalette?.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        {
                                            width: swatchSize,
                                            height: swatchSize,
                                            borderRadius: 12,
                                            marginBottom: 12,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: item.color,
                                            borderWidth: selectedColor === item.color ? 3 : 1,
                                            borderColor: selectedColor === item.color ? '#10B981' : '#E5E7EB',
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 2,
                                            elevation: 2,
                                        }
                                    ]}
                                    onPress={() => handleColorSelect(item.color)}
                                >
                                    {selectedColor === item.color && (
                                        <View style={tw`w-6 h-6 rounded-full bg-green-500 justify-center items-center`}>
                                            <Text style={tw`text-white text-sm font-bold`}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Custom Color Input */}
                        <View style={tw`mt-4 pt-4 border-t border-gray-200`}>
                            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Custom Color</Text>
                            <View style={tw`flex-row gap-2`}>
                                <TextInput
                                    style={tw`flex-1 border border-gray-300 rounded-lg px-3 py-3 text-base bg-white`}
                                    placeholder="Enter hex code (e.g., #FF5733)"
                                    placeholderTextColor="#9CA3AF"
                                    value={customColor}
                                    onChangeText={setCustomColor}
                                    maxLength={7}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={tw`bg-blue-500 px-5 rounded-lg justify-center items-center shadow-sm`}
                                    onPress={handleCustomColorSubmit}
                                >
                                    <Text style={tw`text-white font-semibold text-base`}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Quick Actions */}
                        <View style={tw`flex-row gap-3 mt-4`}>
                            <TouchableOpacity
                                style={tw`flex-1 py-3 rounded-xl bg-gray-100 items-center border border-gray-200`}
                                onPress={resetToInitial}
                            >
                                <Text style={tw`text-sm font-semibold text-gray-700`}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={tw`flex-1 py-3 rounded-xl bg-gray-100 items-center border border-gray-200`}
                                onPress={() => setSelectedColor("#FFFFFF")}
                            >
                                <Text style={tw`text-sm font-semibold text-gray-700`}>White</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={tw`flex-1 py-3 rounded-xl bg-gray-100 items-center border border-gray-200`}
                                onPress={() => setSelectedColor("#000000")}
                            >
                                <Text style={tw`text-sm font-semibold text-gray-700`}>Black</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={tw`flex-row gap-3 mt-4 pt-3 border-t border-gray-200`}>
                        <TouchableOpacity
                            style={tw`flex-1 py-4 rounded-xl bg-gray-100 items-center border border-gray-200`}
                            onPress={onClose}
                        >
                            <Text style={tw`text-base font-semibold text-gray-700`}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={tw`flex-1 py-4 rounded-xl bg-green-500 items-center shadow-lg`}
                            onPress={handleConfirm}
                        >
                            <Text style={tw`text-base font-semibold text-white`}>Apply Color</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ColorPickerModal;