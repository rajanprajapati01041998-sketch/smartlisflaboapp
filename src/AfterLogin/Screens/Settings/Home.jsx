import React, { useState, useEffect } from "react";
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Switch,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { getPageSetting, updatePageSetting } from "../../../utils/pageSettings";
import { useTheme } from "../../../../Authorization/ThemeContext";
import { getThemeStyles } from "../../../utils/themeStyles";
import tw from 'twrnc';
import { useToast } from "../../../../Authorization/ToastContext";
import ColorPickerModal from "./ColorPickerModal";
import { useAuth } from "../../../../Authorization/AuthContext";

const Home = () => {
    const { loginBranchId } = useAuth();
    const { theme } = useTheme();
    const themed = getThemeStyles(theme);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [switchLoading, setSwitchLoading] = useState({
        FieldBoy: false,
        Relation: false,
        MaritalStatus: false,
        AadharNo: false,
        ContactNumber: false,
        MedicalHistory: false,
        Email: false,
        Address: false,
        RelativeName: false,
        ReferLab:false
    });
    const [colorLoading, setColorLoading] = useState(false);
    const { showToast } = useToast();

    // Color Picker Modal State
    const [colorPickerVisible, setColorPickerVisible] = useState(false);
    const [activeColorField, setActiveColorField] = useState("");
    const [currentColorValue, setCurrentColorValue] = useState("");

    const loadPageSettings = async () => {
        try {
            setLoading(true);
            const response = await getPageSetting(loginBranchId);
            console.log("page=", response);
            if (response?.result) {
                setSettings(response.data);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loginBranchId) {
            loadPageSettings();
        }
    }, [loginBranchId]);

    const openColorPicker = (fieldName, currentColor) => {
        setActiveColorField(fieldName);
        setCurrentColorValue(currentColor || "#FFFFFF");
        setColorPickerVisible(true);
    };

    const handleColorSelect = async (selectedColor) => {
        setColorLoading(true);

        // Update local state immediately for better UX
        let updatedSettings = { ...settings };
        switch (activeColorField) {
            case "BackgroundColor":
                updatedSettings.BackgroundColor = selectedColor;
                break;
            case "TextColor":
                updatedSettings.TextColor = selectedColor;
                break;
            case "DarkBackground":
                updatedSettings.DarkBackground = selectedColor;
                break;
            case "DarkText":
                updatedSettings.DarkText = selectedColor;
                break;
            default:
                break;
        }
        setSettings(updatedSettings);

        try {
            // Prepare payload with updated color
            const payload = {
                branchId: settings.BranchId,
                fieldBoy: settings.FieldBoy,
                relation: settings.Relation,
                maritalStatus: settings.MaritalStatus,
                medicalHistory: settings.MedicalHistory,
                aadharNo: settings.AadharNo,
                email: settings.Email,
                address: settings.Address,
                relativeName: settings.RelativeName,
                referLab: settings.ReferLab,
                backgroundColor: activeColorField === "BackgroundColor" ? selectedColor : settings.BackgroundColor,
                textColor: activeColorField === "TextColor" ? selectedColor : settings.TextColor,
                darkBackground: activeColorField === "DarkBackground" ? selectedColor : settings.DarkBackground,
                darkText: activeColorField === "DarkText" ? selectedColor : settings.DarkText,
            };

            const response = await updatePageSetting(payload);

            if (response?.result) {
                showToast(`${activeColorField.replace(/([A-Z])/g, ' $1').trim()} updated successfully`, 'success');
                // Reload settings to ensure consistency
                await loadPageSettings();
            } else {
                // Revert on error
                setSettings(settings);
                showToast(`Failed to update color`, 'error');
            }
        } catch (error) {
            console.log(error);
            // Revert the color on error
            setSettings(settings);
            showToast(`Error updating color`, 'error');
        } finally {
            setColorLoading(false);
        }
    };

    // Function to handle switch toggle with API call
    const handleSwitchToggle = async (fieldName, value) => {
        setSettings({ ...settings, [fieldName]: value });
        setSwitchLoading(prev => ({ ...prev, [fieldName]: true }));
        try {
            const payload = {
                branchId: settings.BranchId,
                fieldBoy: fieldName === "FieldBoy" ? value : settings.FieldBoy,
                relation: fieldName === "Relation" ? value : settings.Relation,
                maritalStatus: fieldName === "MaritalStatus" ? value : settings.MaritalStatus,
                aadharNo: fieldName === "AadharNo" ? value : settings.AadharNo,
                email: fieldName === "Email" ? value : settings.Email,
                contactNumber:
                    fieldName === "ContactNumber"
                        ? value
                        : settings.ContactNumber,
                medicalHistory:
                    fieldName === "MedicalHistory"
                        ? value
                        : settings.MedicalHistory,
                relativeName:
                    fieldName === "RelativeName"
                        ? value
                        : settings.RelativeName,
                relation:
                    fieldName === "Relation"
                        ? value
                        : settings.Relation,
                referLab:
                    fieldName === "ReferLab"
                        ? value
                        : settings.ReferLab,

                address: fieldName === "Address" ? value : settings.Address,
                backgroundColor: settings.BackgroundColor,
                textColor: settings.TextColor,
                darkBackground: settings.DarkBackground,
                darkText: settings.DarkText,
            };

            const response = await updatePageSetting(payload);

            if (response?.result) {
                showToast(`${fieldName} updated successfully`, 'success');
                // Reload settings to ensure consistency
                await loadPageSettings();
            } else {
                // Revert on error
                setSettings({ ...settings, [fieldName]: !value });
                showToast(`Failed to update ${fieldName}`, 'error');
            }
        } catch (error) {
            console.log(error);
            // Revert the switch on error
            setSettings({ ...settings, [fieldName]: !value });
            showToast(`Error updating ${fieldName}`, 'error');
        } finally {
            setSwitchLoading(prev => ({ ...prev, [fieldName]: false }));
        }
    };

    // Helper to get contrasting text color
    const getContrastColor = (hexColor) => {
        if (!hexColor || typeof hexColor !== 'string') {
            return '#000000';
        }

        const hex = hexColor.replace('#', '');

        if (hex.length < 6) {
            return '#000000';
        }

        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return '#000000';
        }

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        return brightness > 128 ? '#000000' : '#FFFFFF';
    };
    const formFields = [
        {
            key: "FieldBoy",
            title: "Field Boy",
            description: "Enable/disable field boy field in forms",
        },
        {
            key: "Relation",
            title: "Relation",
            description: "Show relationship field",
        },
        {
            key: "MaritalStatus",
            title: "Marital Status",
            description: "Show marital status field",
        },
        {
            key: "AadharNo",
            title: "Aadhar Number",
            description: "Show Aadhar card field",
        },
        {
            key: "ContactNumber",
            title: "Contact Number",
            description: "Show contact number field",
        },
        {
            key: "Email",
            title: "Email",
            description: "Show email address field",
        },
        {
            key: "Address",
            title: "Address",
            description: "Show address field",
        },
        {
            key: "MedicalHistory",
            title: "Medical History",
            description: "Show Medical History field",
        },
        {
            key: "RelativeName",
            title: "Relative",
            description: "Relative Name",
        },
        {
            key: "ReferLab",
            title: "Refer Lab",
            description: "Refer Lab",
        }
    ];

    if (loading && !settings) {
        return (
            <SafeAreaView style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator size={30} color={themed.iconColor} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[themed.childScreen2, tw`flex-1`]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={tw`p-4`}>
                    {/* Header Section */}
                    <View style={tw`mb-5 pt-3`}>
                        <Text style={[themed.headerTitle, tw`font-bold mb-1`]}>Page Settings</Text>
                        <Text style={[themed.labelTextXs]}>Configure form fields and appearance</Text>
                    </View>

                    {/* FORM FIELDS SECTION */}
                    <View>
                        {formFields.map((item, index) => (
                            <View
                                key={item.key}
                                style={[
                                    themed.border,
                                    tw`flex-row justify-between items-center py-3 px-2`,
                                    index > 0 && tw`my-2`,
                                ]}
                            >
                                <View style={tw`flex-1 mr-4`}>
                                    <Text style={[themed.labelText]}>
                                        {item.title}
                                    </Text>

                                    <Text style={[themed.labelTextXs]}>
                                        {item.description}
                                    </Text>
                                </View>

                                {switchLoading[item.key] ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#34C759"
                                    />
                                ) : (
                                    <Switch
                                        value={!!settings?.[item.key]}
                                        onValueChange={(value) =>
                                            handleSwitchToggle(item.key, value)
                                        }
                                        trackColor={{
                                            false: "#767577",
                                            true: "#34C759",
                                        }}
                                        thumbColor={
                                            settings?.[item.key]
                                                ? "#ffffff"
                                                : "#f4f3f4"
                                        }
                                    />
                                )}
                            </View>
                        ))}
                    </View>

                    {/* COLOR THEME SECTION */}
                    <View style={[tw`mb-5 mt-4`]}>
                        <View style={tw`flex-row items-center mb-3`}>
                            <Text style={[themed.headerTitle]}>Color Theme Configuration</Text>
                        </View>

                        {/* 
                        Color */}
                        <View style={[themed.border, tw`flex-row justify-between items-center py-3 px-2 my-2`]}>
                            <View style={tw`flex-1 mr-4`}>
                                <Text style={[themed.labelText]}>Background Color (Light Mode)</Text>
                                <Text style={[themed.labelTextXs]}>Main background color for light theme</Text>
                            </View>
                            {colorLoading && activeColorField === "BackgroundColor" ? (
                                <ActivityIndicator size="small" color="#34C759" />
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        tw`w-24 h-10 rounded-lg justify-center items-center border border-gray-200 shadow-sm`,
                                        { backgroundColor: settings?.BackgroundColor || '#FFFFFF' }
                                    ]}
                                    onPress={() => openColorPicker("BackgroundColor", settings?.BackgroundColor)}
                                >
                                    <Text style={[tw`text-xs font-semibold`, { color: getContrastColor(settings?.BackgroundColor) }]}>
                                        {settings?.BackgroundColor || '#FFFFFF'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Text Color */}
                        <View style={[themed.border, tw`flex-row justify-between items-center py-3 px-2 my-2`]}>
                            <View style={tw`flex-1 mr-4`}>
                                <Text style={[themed.labelText]}>Text Color (Light Mode)</Text>
                                <Text style={[themed.labelTextXs]}>Main text color for light theme</Text>
                            </View>
                            {colorLoading && activeColorField === "TextColor" ? (
                                <ActivityIndicator size="small" color="#34C759" />
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        tw`w-24 h-10 rounded-lg justify-center items-center border border-gray-200 shadow-sm`,
                                        { backgroundColor: settings?.TextColor || '#000000' }
                                    ]}
                                    onPress={() => openColorPicker("TextColor", settings?.TextColor)}
                                >
                                    <Text style={[tw`text-xs font-semibold`, { color: getContrastColor(settings?.TextColor) }]}>
                                        {settings?.TextColor || '#000000'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Dark Background Color */}
                        <View style={[themed.border, tw`flex-row justify-between items-center py-3 px-2 my-2`]}>
                            <View style={tw`flex-1 mr-4`}>
                                <Text style={[themed.labelText]}>Dark Background Color</Text>
                                <Text style={[themed.labelTextXs]}>Main background color for dark theme</Text>
                            </View>
                            {colorLoading && activeColorField === "DarkBackground" ? (
                                <ActivityIndicator size="small" color="#34C759" />
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        tw`w-24 h-10 rounded-lg justify-center items-center border border-gray-200 shadow-sm`,
                                        { backgroundColor: settings?.DarkBackground || '#1F2937' }
                                    ]}
                                    onPress={() => openColorPicker("DarkBackground", settings?.DarkBackground)}
                                >
                                    <Text style={[tw`text-xs font-semibold`, { color: getContrastColor(settings?.DarkBackground) }]}>
                                        {settings?.DarkBackground || '#1F2937'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Dark Text Color */}
                        <View style={[themed.border, tw`flex-row justify-between items-center py-3 px-2 my-2`]}>
                            <View style={tw`flex-1 mr-4`}>
                                <Text style={[themed.labelText]}>Dark Text Color</Text>
                                <Text style={[themed.labelTextXs]}>Main text color for dark theme</Text>
                            </View>
                            {colorLoading && activeColorField === "DarkText" ? (
                                <ActivityIndicator size="small" color="#34C759" />
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        tw`w-24 h-10 rounded-lg justify-center items-center border border-gray-200 shadow-sm`,
                                        { backgroundColor: settings?.DarkText || '#FFFFFF' }
                                    ]}
                                    onPress={() => openColorPicker("DarkText", settings?.DarkText)}
                                >
                                    <Text style={[tw`text-xs font-semibold`, { color: getContrastColor(settings?.DarkText) }]}>
                                        {settings?.DarkText || '#FFFFFF'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Live Preview Section */}
                        <View style={[themed.border, tw`mt-5 p-3`]}>
                            <Text style={[themed.labelText, tw`mb-3`]}>Live Preview</Text>
                            <View style={tw`flex-row justify-between`}>
                                {/* Light Mode Preview */}
                                <View
                                    style={[
                                        tw`flex-1 p-4 rounded-xl items-center border border-gray-200 mr-2 justify-center`,
                                        {
                                            backgroundColor: settings?.BackgroundColor || '#FFFFFF',
                                            height: 100,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            tw`text-md font-medium mb-2 text-center`,
                                            { color: settings?.TextColor || '#000000' },
                                        ]}
                                    >
                                        Light Preview
                                    </Text>
                                    <View style={tw`px-3 py-2 rounded-full bg-black bg-opacity-5`}>
                                        <Text
                                            style={[
                                                tw`text-xs`,
                                                { color: settings?.TextColor || '#000000' },
                                            ]}
                                        >
                                            Sample Text
                                        </Text>
                                    </View>
                                </View>

                                {/* Dark Mode Preview */}
                                <View
                                    style={[
                                        tw`flex-1 p-4 rounded-xl items-center border border-gray-200 ml-2 justify-center`,
                                        {
                                            backgroundColor: settings?.DarkBackground || '#1F2937',
                                            height: 100,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            tw`text-md font-medium mb-2 text-center`,
                                            { color: settings?.DarkText || '#FFFFFF' },
                                        ]}
                                    >
                                        Dark Preview
                                    </Text>
                                    <View style={tw`px-3 py-2 rounded-full bg-white bg-opacity-10`}>
                                        <Text
                                            style={[
                                                tw`text-xs`,
                                                { color: settings?.DarkText || '#FFFFFF' },
                                            ]}
                                        >
                                            Sample Text
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Color Picker Modal - Imported Component */}
            <ColorPickerModal
                visible={colorPickerVisible}
                onClose={() => setColorPickerVisible(false)}
                onColorSelect={handleColorSelect}
                initialColor={currentColorValue}
                title={`Select ${activeColorField.replace(/([A-Z])/g, ' $1').trim()}`}
            />
        </SafeAreaView>
    );
};

export default Home;