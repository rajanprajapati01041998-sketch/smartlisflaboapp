import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
} from 'react-native';
import tw from 'twrnc';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FilterDate from '../FilterDate';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useAuth} from '../../../../Authorization/AuthContext';
import DashboardCollection from './DashboardCollection';
import {useDash} from '../../../../Authorization/DashContext';
import {useTheme} from '../../../../Authorization/ThemeContext';
import {getThemeStyles} from '../../../utils/themeStyles';
import {getLiveLocationSession} from '../../../utils/backgroundLocationPrefs';

const LabDashboard = () => {
  const {
    userData,
    allBranchInfo,
    loginBranchId,
    fieldBoyId,
  } = useAuth();

  const {dashboardWallet} = useDash();
  const {theme} = useTheme();
  const themed = getThemeStyles(theme);
  const navigation = useNavigation();

  const dashboardRef = React.useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const [filetrModal, setFilterModal] = useState(false);

  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const [branchModal, setBranchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [liveSession, setLiveSession] = useState(null);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useFocusEffect(
    useCallback(() => {
      const today = getTodayDate();

      if (!fromDate) {
        setFromDate(today);
      }

      if (!toDate) {
        setToDate(today);
      }

      dashboardWallet(loginBranchId);

      let mounted = true;
      const loadSession = async () => {
        try {
          const session = await getLiveLocationSession();
          if (mounted) setLiveSession(session);
        } catch {}
      };

      loadSession();
      const interval = setInterval(loadSession, 1200);

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }, [fromDate, toDate, loginBranchId, dashboardWallet]),
  );

  const formatDateToAPI = date => {
    if (!date) {
      return getTodayDate();
    }

    if (date.includes('-') && date.split('-')[0].length === 4) {
      return date;
    }

    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}`;
  };

  const handleSearchFilter = data => {
    const formattedFrom = formatDateToAPI(data.fromDate);
    const formattedTo = formatDateToAPI(data.toDate);

    setFromDate(formattedFrom);
    setToDate(formattedTo);
    setFilterModal(false);

    setTimeout(() => {
      dashboardRef.current?.refresh?.();
    }, 200);
  };

  const toggleBranch = branch => {
    const exists = selectedBranches.find(b => b.branchId === branch.branchId);

    if (exists) {
      setSelectedBranches(prev =>
        prev.filter(b => b.branchId !== branch.branchId),
      );
    } else {
      setSelectedBranches(prev => [...prev, branch]);
    }
  };

  const filteredBranches = useMemo(() => {
    return (
      allBranchInfo?.filter(branch =>
        branch.branchName?.toLowerCase().includes(searchQuery.toLowerCase()),
      ) || []
    );
  }, [allBranchInfo, searchQuery]);

  const handleSelectAll = () => {
    if (selectAll) {
      filteredBranches.forEach(branch => {
        if (selectedBranches.some(b => b.branchId === branch.branchId)) {
          toggleBranch(branch);
        }
      });
    } else {
      filteredBranches.forEach(branch => {
        if (!selectedBranches.some(b => b.branchId === branch.branchId)) {
          toggleBranch(branch);
        }
      });
    }

    setSelectAll(!selectAll);
  };

  useEffect(() => {
    const allFilteredSelected =
      filteredBranches.length > 0 &&
      filteredBranches.every(branch =>
        selectedBranches.some(b => b.branchId === branch.branchId),
      );

    setSelectAll(allFilteredSelected);
  }, [selectedBranches, filteredBranches]);

  const clearAllBranches = () => {
    setSelectedBranches([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await dashboardRef.current?.refresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={themed.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#10b981"
          colors={['#10b981']}
          progressBackgroundColor={themed.progressBgColor}
        />
      }>

      <View style={themed.header}>
        <View style={tw`flex-row justify-between items-start`}>
          <View style={tw`flex-1`}>
            <Text style={themed.headerSubText}>Welcome back,</Text>



            <View style={tw`flex-row items-center`}>
              <Icon name="calendar" size={12} color="#9ca3af" />
              <Text style={themed.dateText}>
                {fromDate || getTodayDate()} → {toDate || getTodayDate()}
              </Text>
            </View>
          </View>

          <View style={tw`flex-row gap-2`}>
            <TouchableOpacity
              onPress={() => setFilterModal(true)}
              style={themed.filterButton}>
              <MaterialIcons
                name="calendar-month"
                size={18}
                color={themed.filterButtonIcon}
              />
              <Text style={themed.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {liveSession?.active && liveSession?.sampleId != null ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('FlaboShareLiveLocation', {id: liveSession.sampleId})
          }
          style={tw`mx-4 mt-3 mb-2 bg-emerald-600 rounded-2xl px-4 py-3 flex-row items-center justify-between`}
        >
          <View>
            <Text style={tw`text-white font-bold text-base`}>Live Location is ON</Text>
            <Text style={tw`text-white/90 text-xs mt-0.5`}>
              Sample ID: {String(liveSession.sampleId)}
            </Text>
          </View>
          <View style={tw`bg-white/20 px-3 py-2 rounded-xl`}>
            <Text style={tw`text-white font-bold`}>Open</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {selectedBranches.length > 0 && (
        <View style={tw`px-2 mb-2 mt-1`}>
          <View style={themed.sectionCard}>
            <View style={themed.sectionHeader}>
              <Text style={themed.sectionHeaderText}>Selected Branches</Text>
            </View>

            <View style={tw`flex-row items-center px-3 py-2`}>
              <Icon
                name="store-marker"
                size={18}
                color="#3b82f6"
                style={tw`mr-2`}
              />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tw`flex-1`}
                contentContainerStyle={tw`flex-row items-center py-1`}>
                {selectedBranches.map(branch => (
                  <TouchableOpacity
                    key={branch.branchId}
                    onPress={() => toggleBranch(branch)}
                    style={tw`flex-row items-center bg-blue-50 rounded-full px-3 py-1.5 mr-2 border border-blue-200`}
                    activeOpacity={0.7}>
                    <Icon name="store" size={12} color="#3b82f6" style={tw`mr-1`} />

                    <Text style={tw`text-xs text-blue-700 font-medium`}>
                      {branch.branchName}
                    </Text>

                    <Icon
                      name="close-circle"
                      size={14}
                      color="#3b82f6"
                      style={tw`ml-1`}
                    />
                  </TouchableOpacity>
                ))}

                {selectedBranches.length > 1 && (
                  <TouchableOpacity
                    onPress={clearAllBranches}
                    style={themed.selectedBranchesClearBtn}
                    activeOpacity={0.7}>
                    <Icon name="delete-outline" size={14} color="#ef4444" />
                    <Text style={tw`text-xs text-red-600 font-medium ml-1`}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <View style={tw`ml-2 bg-blue-500 rounded-full min-w-[24px] h-6 items-center justify-center px-1.5`}>
                <Text style={tw`text-white text-xs font-bold`}>
                  {selectedBranches.length}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={tw`px-4 py-4`}>
        <DashboardCollection
          ref={dashboardRef}
          fromDate={fromDate || getTodayDate()}
          toDate={toDate || getTodayDate()}
          fieldBoyId={fieldBoyId}
        />
      </View>

      <Modal visible={filetrModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setFilterModal(false)}>
          <View style={tw`flex-1 justify-center items-center bg-black/60`}>
            <TouchableWithoutFeedback>
              <View style={[themed.modalContainer, tw`w-[95%]`]}>
                <FilterDate
                  onClose={() => setFilterModal(false)}
                  onSave={handleSearchFilter}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={branchModal} transparent animationType="slide" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setBranchModal(false)}>
          <View style={tw`flex-1 justify-center items-center bg-black/60`}>
            <TouchableWithoutFeedback>
              <View style={[themed.modalCard, tw`w-[95%] max-h-[85%] shadow-xl rounded-2xl`]}>
                <View style={themed.modalHeader}>
                  <View>
                    <Text style={themed.modalTitle}>Select Branches</Text>
                    <Text style={themed.modalSubTitle}>Choose branches to view data</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setBranchModal(false)}
                    style={themed.modalCloseButton}>
                    <Feather name="x" size={20} color={themed.closeIconColor} />
                  </TouchableOpacity>
                </View>

                <View style={themed.searchWrapper}>
                  <View style={themed.searchBox}>
                    <Feather name="search" size={18} color={themed.inputPlaceholder} />

                    <TextInput
                      style={themed.searchInput}
                      placeholder="Search branches..."
                      placeholderTextColor={themed.inputPlaceholder}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />

                    {searchQuery?.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Feather name="x-circle" size={18} color={themed.inputPlaceholder} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {filteredBranches.length > 0 && (
                  <TouchableOpacity
                    onPress={handleSelectAll}
                    style={tw`flex flex-row p-2 justify-between`}>
                    <View style={tw`flex-row items-center`}>
                      <View style={themed.selectAllIconWrap}>
                        <Feather name="check-square" size={18} color="#3b82f6" />
                      </View>

                      <View style={tw`mx-2`}>
                        <Text style={themed.inputLabel}>
                          {selectAll ? 'Deselect All' : 'Select All'}
                        </Text>

                        <Text style={themed.inputLabel}>
                          {filteredBranches.length} branches available
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        tw`w-5 h-5 rounded border-2 items-center justify-center`,
                        selectAll
                          ? {backgroundColor: '#3b82f6', borderColor: '#3b82f6'}
                          : themed.checkboxBorder,
                      ]}>
                      {selectAll && <Feather name="check" size={12} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                )}

                <FlatList
                  data={filteredBranches}
                  keyExtractor={(item, index) => `${item.branchId}-${index}`}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={tw`py-2`}
                  ListEmptyComponent={
                    <View style={tw`items-center justify-center py-12`}>
                      <Feather name="inbox" size={48} color={themed.emptyIconColor} />
                      <Text style={themed.emptyTitle}>No branches found</Text>
                      <Text style={themed.emptySubTitle}>
                        Try searching with different keywords
                      </Text>
                    </View>
                  }
                  renderItem={({item}) => {
                    const isSelected = selectedBranches.some(
                      b => b.branchId === item.branchId,
                    );

                    return (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleBranch(item)}
                        style={[
                          themed.border,
                          tw`flex flex-row p-2 mx-2 my-1 rounded-md`,
                        ]}>
                        <View style={tw`flex-row items-center flex-1`}>
                          <Feather
                            name="briefcase"
                            size={18}
                            color={isSelected ? '#3b82f6' : themed.iconSecondary}
                          />

                          <Text style={[themed.listItemText, tw`flex-1 ml-2`]}>
                            {item.branchName}
                          </Text>
                        </View>

                        <View
                          style={[
                            tw`w-6 h-6 rounded-full border-2 items-center justify-center`,
                            isSelected
                              ? {backgroundColor: '#3b82f6', borderColor: '#3b82f6'}
                              : themed.checkboxBorder,
                          ]}>
                          {isSelected && <Feather name="check" size={12} color="#fff" />}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />

                <View style={themed.footer}>
                  <View style={tw`flex-row gap-3`}>
                    <TouchableOpacity
                      onPress={() => setBranchModal(false)}
                      style={themed.cancelButton}>
                      <Text style={themed.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setBranchModal(false)}
                      style={[
                        tw`flex-1 py-3 rounded-xl`,
                        {backgroundColor: '#3b82f6'},
                      ]}>
                      <Text style={tw`text-white text-center font-semibold`}>
                        Apply ({selectedBranches.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

export default LabDashboard;
