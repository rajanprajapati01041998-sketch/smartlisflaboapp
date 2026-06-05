import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native'
import React, { useState } from 'react'
import tw from 'twrnc'
import CustomStyles from '../../../Custom.styles'
import Entypo from 'react-native-vector-icons/Entypo'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import DateTimePicker from '@react-native-community/datetimepicker'
import ButtonStyles from '../../utils/ButtonStyle'
import { getThemeStyles } from '../../utils/themeStyles'
import { useTheme } from '../../../Authorization/ThemeContext'

const FilterDate = ({ onClose, onSave }) => {

    const { theme } = useTheme()
    const themed = getThemeStyles(theme)

    const [fromDate, setFromDate] = useState(new Date())
    const [toDate, setToDate] = useState(new Date())
    const [showPicker, setShowPicker] = useState(null)
    const [tempDate, setTempDate] = useState(new Date())

    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}-${month}-${year}`
    }

    const onChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowPicker(null)

            if (selectedDate) {
                if (showPicker === 'from') setFromDate(selectedDate)
                else if (showPicker === 'to') setToDate(selectedDate)
            }
        } else {
            if (selectedDate) setTempDate(selectedDate)
        }
    }

    const onIOSConfirm = () => {
        if (showPicker === 'from') setFromDate(tempDate)
        else if (showPicker === 'to') setToDate(tempDate)

        setShowPicker(null)
    }

    const renderDatePicker = () => {
        if (Platform.OS === 'android') {
            if (showPicker) {
                return (
                    <DateTimePicker
                        value={showPicker === 'from' ? fromDate : toDate}
                        mode="date"
                        display="default"
                        onChange={onChange}
                        maximumDate={new Date()}
                    />
                )
            }
            return null
        } else {
            if (showPicker) {
                return (
                    <Modal visible animationType="slide" transparent>
                        <View style={tw`flex-1 justify-end bg-black/40`}>
                            <View style={[themed.modalCard, tw`p-4 rounded-t-2xl`]}>
                                
                                {/* Header */}
                                <View style={tw`flex-row justify-between items-center mb-4`}>
                                    <Text style={themed.modalTitle}>
                                        Select {showPicker === 'from' ? 'From' : 'To'} Date
                                    </Text>

                                    <TouchableOpacity onPress={() => setShowPicker(null)}>
                                        <Text style={{ color: 'red', fontSize: 16 }}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>

                                <DateTimePicker
                                    value={showPicker === 'from' ? fromDate : toDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={onChange}
                                    maximumDate={new Date()}
                                />

                                <TouchableOpacity
                                    style={tw`mt-4 py-3 rounded-lg bg-blue-500`}
                                    onPress={onIOSConfirm}
                                >
                                    <Text style={tw`text-white text-center font-semibold`}>
                                        Confirm
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                )
            }
            return null
        }
    }

    return (
        <View style={[themed.modalCard, tw`p-4`]}>

            {/* Header */}
            <View style={tw`flex-row justify-between items-center`}>
                <Text style={themed.modalHeaderTitle}>Filter</Text>

                <TouchableOpacity onPress={onClose}>
                    <Entypo name="cross" size={22} color={themed.chevronColor} />
                </TouchableOpacity>
            </View>

            <View style={tw`mt-8`}>

                {/* From */}
                <Text style={[themed.mutedText, tw`mb-1`]}>From</Text>
                <TouchableOpacity
                    style={[themed.inputBox,themed.inputText,tw`flex flex-row justify-between`]}
                    onPress={() => {
                        setTempDate(fromDate)
                        setShowPicker('from')
                    }}
                >
                    <Text style={themed.listItemText}>{formatDate(fromDate)}</Text>
                    <MaterialIcons name="calendar-month" size={20} color={themed.chevronColor} />
                </TouchableOpacity>

                {/* To */}
                <Text style={[themed.headerSubText, tw`mt-4 mb-2`]}>To</Text>
                <TouchableOpacity
                    style={[themed.inputBox,themed.inputText,tw`flex flex-row justify-between`]}
                    onPress={() => {
                        setTempDate(toDate)
                        setShowPicker('to')
                    }}
                >
                    <Text style={themed.listItemText}>{formatDate(toDate)}</Text>
                    <MaterialIcons name="calendar-month" size={20} color={themed.chevronColor} />
                </TouchableOpacity>

                {/* Buttons */}
                <View style={tw`flex-row gap-2 justify-end items-center mt-6`}>
                    <TouchableOpacity
                        style={[themed.saveButton]}
                        onPress={() =>
                            onSave({
                                fromDate: formatDate(fromDate),
                                toDate: formatDate(toDate),
                            })
                        }
                     >
                        <Text style={themed.saveButtonText}>Search</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setFromDate(new Date())
                            setToDate(new Date())
                            onClose()
                        }}
                        style={[themed.closeButton]}
                    >
                        <Text style={themed.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>

            </View>

            {renderDatePicker()}
        </View>
    )
}

export default FilterDate