import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Animated,
    Alert,
    TouchableOpacity,
    RefreshControl,
} from 'react-native'
import React, {
    useState,
    useRef,
    useCallback,
} from 'react'
import tw from 'twrnc'
import { useAuth } from '../../../../Authorization/AuthContext'
import {
    useFocusEffect,
    useNavigation,
} from '@react-navigation/native'
import api from '../../../../Authorization/api'
import { useTheme } from '../../../../Authorization/ThemeContext'

import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

import LinearGradient from 'react-native-linear-gradient'

import { getAddressFromLatLng } from '../../../utils/patinetService.js/location'
import { getThemeStyles } from '../../../utils/themeStyles'

const UserLoginHistory = () => {
    const { userData } = useAuth()
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [loginHistory, setLoginHistory] = useState([])
    const [addresses, setAddresses] = useState({})
    const [loadingAddress, setLoadingAddress] =useState({})
    const navigation = useNavigation()
    const { theme } = useTheme()
    const themed = getThemeStyles(theme)
    const fadeAnim = useRef( new Animated.Value(0)).current
    const slideAnim = useRef(new Animated.Value(50)).current

    const headerFadeAnim = useRef(  new Animated.Value(0),).current

    const [itemAnimations, setItemAnimations] =
        useState({})

    const getLoggedInUserId = () => {
        return (
            userData?.user?.id ||
            userData?.id ||
            null
        )
    }

    const getAddressFromCoordinates =
        async ( latitude, longitude,sessionId, ) => {
            if (!latitude || !longitude)
                return null
            setLoadingAddress(prev => ({
                ...prev,
                [sessionId]: true,
            }))

            try {
                const address =  await getAddressFromLatLng(latitude,longitude)
                setAddresses(prev => ({
                    ...prev,
                    [sessionId]: address,
                }))
                return address
            } catch (error) {
                console.log(
                    'Address fetch error:',
                    error,
                )
                return null
            } finally {
                setLoadingAddress(prev => ({
                    ...prev,
                    [sessionId]: false,
                }))
            }
        }

    const getUserLoginHistory = async ( id, isRefresh = false,) => {
        try {
            if (!isRefresh) setLoading(true)
            const response = await api.get(`Login/login-history/${id}`, )
            if (response?.data) {
                setLoginHistory(response.data)
                response.data.forEach(
                    async item => {
                        if (item.latitudeApp &&item.longitudeApp
                        ) {
                            await getAddressFromCoordinates(
                                item.latitudeApp,
                                item.longitudeApp,
                                item.sessionId,
                            )
                        }
                    },
                )

                const animations = {}
                response.data.forEach(
                    (_, index) => { animations[index] = {
                            fade: new Animated.Value( 0, ),
                            slide: new Animated.Value(  30, ),
                        }
                    },
                )

                setItemAnimations(animations)
                Object.keys(
                    animations,
                ).forEach((key, index) => {
                    Animated.parallel([
                        Animated.timing(
                            animations[key].fade,
                            {
                                toValue: 1,
                                duration: 250,
                                delay:index * 20,
                                useNativeDriver: true,
                            },
                        ),

                        Animated.spring(
                            animations[key]
                                .slide,
                            {
                                toValue: 0,
                                damping: 15,
                                stiffness: 100,
                                delay:index * 20,
                                useNativeDriver: true,
                            },
                        ),
                    ]).start()
                })

                Animated.parallel([
                    Animated.timing(
                        fadeAnim,
                        {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true,
                        },
                    ),

                    Animated.timing(
                        slideAnim,
                        {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true,
                        },
                    ),

                    Animated.timing(
                        headerFadeAnim,
                        {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        },
                    ),
                ]).start()
            }
        } catch (error) {
            console.log(  'history error', error?.response,  )
            Alert.alert( 'Error', 'Failed to load login history', )
        } finally {
            setLoading(false)
            if (isRefresh)
                setRefreshing(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            const id = getLoggedInUserId()
            if (id) {
                getUserLoginHistory(id)
            } else {
                navigation.navigate( 'Dashboard',)
            }
            return () => { }
        }, [userData]),
    )

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        const id = getLoggedInUserId()
        if (id) {
            getUserLoginHistory(id, true)
        } else {
            setRefreshing(false)
        }
    }, [userData])

    const formatDate = dateString => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(
            diffMs / 60000,
        )
        const diffHours = Math.floor(
            diffMs / 3600000,
        )
        const diffDays = Math.floor(
            diffMs / 86400000,
        )
        let timeAgo = ''
        if (diffMins < 60) {
            timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''
                } ago`
        } else if (diffHours < 24) {
            timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''
                } ago`
        } else if (diffDays < 7) {
            timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''
                } ago`
        } else {
            timeAgo = date.toLocaleDateString('en-US',
                    {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    },
                )
        }

        return {
            formatted:
                date.toLocaleString(
                    'en-US',
                    {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    },
                ),
            timeAgo,
        }
    }

    const getDeviceIcon = ( browser, device, ) => {
        const deviceLower = (
            device || ''
        ).toLowerCase()
        const browserLower = (
            browser || ''
        ).toLowerCase()
        if (
            deviceLower.includes( 'iphone',) ||
            deviceLower.includes('ipad')
        )
            return 'logo-apple'
        if (
            deviceLower.includes( 'android', )
        )
            return 'logo-android'
        if (
            browserLower.includes( 'chrome', )
        )
            return 'logo-chrome'
        return 'laptop-outline'
    }

    const getDeviceColor = device => {
        const deviceLower = (
            device || ''
        ).toLowerCase()

        if (
            deviceLower.includes(  'iphone', )
        )
            return '#34C759'

        if (
            deviceLower.includes( 'android',)
        )
            return '#3DDC84'
        return '#3B82F6'
    }

    const RenderItemContent = ({
        item,
        index,
        isCurrent,
        dateInfo,
        deviceIcon,
        deviceColor,
        hasLocation,
        sessionAddress,
        isLoadingAddress,
    }) => (
        <View style={themed.border}>
            {isCurrent && (
                <LinearGradient
                    colors={[
                        '#10B981',
                        '#059669',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={tw`absolute top-0 right-0 px-3 py-1 rounded-bl-xl z-10`}
                >
                    <View
                        style={tw`flex-row items-center`}
                    >
                        <Ionicons  name="flash" size={12} color="white" />
                        <Text style={tw`text-white text-xs font-bold ml-1`} >
                            CURRENT
                        </Text>
                    </View>
                </LinearGradient>
            )}

            <View style={tw`p-4`}>
                <View
                    style={tw`flex-row items-start justify-between mb-3`}
                >
                    <View
                        style={tw`flex-row items-center flex-1`}
                    >
                        <View
                            style={[
                                tw`w-8 h-8 rounded-full items-center justify-center mr-3`,
                                {
                                    backgroundColor: `${deviceColor}15`,
                                },
                            ]}
                        >
                            <Ionicons name={deviceIcon} size={18} color={deviceColor} />
                        </View>

                        <View
                            style={tw`flex-1`}
                        >
                            <Text
                                style={[
                                    themed.inputText,
                                    tw`font-bold text-base`,
                                ]}
                            >
                                {item.device ||
                                    'Unknown Device'}
                            </Text>

                            <Text
                                style={[
                                    themed.inputText,
                                    tw`text-xs`,
                                ]}
                            >
                                {item.browser ||
                                    'Unknown Browser'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={tw`mb-3`}>
                    <Text style={[themed.inputText, tw`text-sm`,]} >
                        OS:{' '}  {item.os || 'Unknown'}
                    </Text>

                    <Text style={[themed.inputText, tw`text-sm mt-1`,]} >
                        IP:{' '}  {item.ipAddress || 'Unknown'}
                    </Text>

                    {hasLocation && (
                        <View style={tw`mt-3`} >

                            <View
                                style={tw`mt-1`}
                            >
                                {isLoadingAddress ? (
                                    <View
                                        style={tw`flex-row items-center`}
                                    >
                                        <ActivityIndicator
                                            size="small"
                                            color="#3b82f6"
                                        />

                                        <Text
                                            style={tw`text-xs text-gray-400 ml-2`}
                                        >
                                            Fetching
                                            address...
                                        </Text>
                                    </View>
                                ) : (
                                    <Text
                                        style={[
                                            themed.inputText,
                                            tw`text-xs text-gray-500`,
                                        ]}
                                    >
                                        {sessionAddress ||
                                            'Address not available'}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                <View
                    style={tw`flex-row justify-end items-end mt-2 pt-2 border-t border-gray-100`}
                >


                    <View style={tw`items-end`} >
                        <View style={tw`  py-1.5 rounded-lg`}   >
                            <Text style={[themed.mutedText]}>{dateInfo.formatted} </Text>
                        </View>

                        {!isCurrent && (
                            <Text style={tw`text-xs text-gray-400 mt-1`} > {dateInfo.timeAgo}</Text>
                        )}
                    </View>
                </View>
            </View>
        </View>
    )

    const renderItem = ({
        item,
        index,
    }) => {
        const dateInfo = formatDate(
            item.loginAt,
        )

        const isCurrent = index === 0

        const deviceIcon =
            getDeviceIcon(
                item.browser,
                item.device,
            )

        const deviceColor =
            getDeviceColor(item.device)

        const hasLocation =
            item.latitudeApp &&
            item.longitudeApp

        const sessionAddress =
            addresses[item.sessionId]

        const isLoadingAddress =
            loadingAddress[
            item.sessionId
            ]

        const animations =
            itemAnimations[index]

        if (!animations) {
            return null
        }

        return (
            <Animated.View
                style={[
                    themed.childScreen,
                    tw`mx-4 my-2 rounded-xl overflow-hidden`,
                    {
                        opacity:
                            animations.fade,
                        transform: [
                            {
                                translateX:
                                    animations.slide,
                            },
                        ],
                    },
                ]}
            >
                <RenderItemContent
                    item={item} index={index}
                    isCurrent={isCurrent}
                    dateInfo={
                        dateInfo
                    }
                    deviceIcon={
                        deviceIcon
                    }
                    deviceColor={
                        deviceColor
                    }
                    hasLocation={
                        hasLocation
                    }
                    sessionAddress={
                        sessionAddress
                    }
                    isLoadingAddress={
                        isLoadingAddress
                    }
                />
            </Animated.View>
        )
    }

    if (
        loading &&
        loginHistory.length === 0
    ) {
        return (
            <View
                style={[
                    themed.childScreen,
                    tw`flex-1 justify-center items-center`,
                ]}
            >
                <ActivityIndicator
                    size="large"
                    color="#3b82f6"
                />

                <Text
                    style={tw`mt-4 text-gray-600`}
                >
                    Loading login
                    history...
                </Text>
            </View>
        )
    }

    return (
        <View
            style={[
                themed.childScreen,
                tw`flex-1 `,
            ]}
        >
            <FlatList
                data={loginHistory}
                keyExtractor={(item, index) =>
                    `${item.sessionId}-${index}`
                }
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-8`}

                initialNumToRender={8}
                maxToRenderPerBatch={5}
                windowSize={10}
                removeClippedSubviews={true}
                updateCellsBatchingPeriod={50}

                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3b82f6']}
                    />
                }
            />
        </View>
    )
}

export default UserLoginHistory