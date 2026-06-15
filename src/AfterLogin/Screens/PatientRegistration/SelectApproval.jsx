import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useToast } from '../../../../Authorization/ToastContext'
import { getApprovalByBranchId } from '../../../utils/patinetService.js/discountApproval'
import tw from 'twrnc'
import { useTheme } from 'react-native-paper'
import { getThemeStyles } from '../../../utils/themeStyles'

const SelectApproval = ({ loginBranchId, onClose, onSelectedApproval }) => {
    const { showToast } = useToast()
    const [approvalList, setApprovalList] = useState([])
    const [selectedId, setSelectedId] = useState(null)

    const { theme } = useTheme()
    const themed = getThemeStyles(theme);

    useEffect(() => {
        if (loginBranchId) {
            getAllApprovalList(loginBranchId)
        }
    }, [loginBranchId])

    const getAllApprovalList = async (branchId) => {
        try {
            const response = await getApprovalByBranchId(branchId)

            console.log("approval list", response)

            setApprovalList(response?.data || [])
        } catch (error) {
            showToast(`${error?.message || "Failed"}`, "error")
        }
    }

    const handleSelect = (item) => {
        setSelectedId(item.id);
        onSelectedApproval?.(item); // send full object
        onClose?.();
    };

    const renderItem = ({ item }) => {
        const isSelected = selectedId === item.id

        return (
            <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={[
                    themed.globalCard,
                    themed.cardPadding,
                    themed.border,
                    tw` p-3 flex-row justify-between items-center mt-2`,
                    isSelected && { borderColor: '#0f62fe', borderWidth: 2 }
                ]}
            >
                <Text style={[themed.labelText]}>
                    {item.name}
                </Text>

                {isSelected && (
                    <Text style={{ color: '#0f62fe', fontWeight: 'bold' }}>
                        ✓
                    </Text>
                )}
            </TouchableOpacity>
        )
    }

    return (
        <View style={[tw`p-4`]}>
            <Text style={[themed.headerTitle]}>
                Select Approval
            </Text>

            {approvalList.length === 0 ? (
                <Text style={[themed.inputText, tw`text-center mt-5`]}>
                    No Approval Found
                </Text>
            ) : (
                <FlatList
                    data={approvalList}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                />
            )}

        </View>
    )
}

export default SelectApproval