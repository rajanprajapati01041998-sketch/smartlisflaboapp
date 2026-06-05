import tw from 'twrnc';
import LinearGradient from 'react-native-linear-gradient';
import { teal400 } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

export const getThemeStyles = (theme) => {
  const isDark = theme === 'dark';

  return {
    // Screen
    screen: tw.style(
      'flex-1',
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    ),

    childScreen: tw.style(
      'flex-1',
      isDark ? 'bg-gray-800' : 'bg-white'
    ),
    childScreen2: tw.style(
      isDark ? 'bg-gray-800' : 'bg-white'
    ),

    labelText: tw.style(
      'text-md font-bold',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),
    labelTextXs: tw.style(
      'text-[10px] font-bold',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),


    statusBarBg: isDark ? '#111827' : '#FFFFFF',

    // Header
    header: tw.style(
      'px-4 pt-2 pb-1 border-b',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ),

    headerSubText: tw.style(
      'text-xs mb-1',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),

    headerTitle: tw.style(
      'text-md font-bold',
      isDark ? 'text-white' : 'text-gray-800'
    ),

    dateText: tw.style(
      'text-xs ml-1',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),

    // Global reusable card
    card: tw.style(
      'rounded-2xl border',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ),
    loginBtn: tw.style(
      'bg-teal-700 text-white p-4 rounded-md',
      isDark ? 'text-white' : 'text-white'
    ),

    cardPadding: tw.style('p-4'),

    cardCompact: tw.style('p-2'),

    checkbox: {
      margin: 0,
      padding: 0,
    },

    checkboxColor: '#2563eb',          // checked color (blue)
    checkboxUncheckedColor: '#9ca3af', // unchecked color (gray)

    cardActive: tw.style(
      isDark ? 'border-blue-400 shadow-lg' : 'border-blue-200 shadow-lg'
    ),

    sectionCard: tw.style(
      'rounded-xl shadow-sm overflow-hidden',
      isDark ? 'bg-gray-800' : 'bg-white'
    ),

    sectionHeader: tw.style(
      'px-3 pt-2 pb-1 border-b',
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-100'
    ),

    sectionHeaderText: tw.style(
      'text-xs font-semibold uppercase tracking-wide',
      isDark ? 'text-gray-300' : 'text-gray-600'
    ),

    addButton: tw.style(
      'flex-row gap-1 items-center px-3 py-2.5 rounded-lg',
      isDark ? 'bg-blue-600' : 'bg-blue-500'
    ),

    addButtonText: tw.style(
      isDark ? 'text-white' : 'text-white'
    ),

    mutedText: tw.style(
      isDark ? 'text-gray-400 text-xs' : 'text-gray-500 text-xs'
    ),

    normalText: tw.style(
      isDark ? 'text-white' : 'text-gray-800'
    ),

    // Modal
    modalOverlay: tw.style(
      'flex-1 justify-end',
      isDark ? 'bg-black/70' : 'bg-black/50'
    ),

    modalContainer: tw.style(
      'rounded-2xl overflow-hidden',
      isDark ? 'bg-gray-800' : 'bg-white'
    ),
    modalContainer2: tw.style(
      'rounded-2xl ',
      isDark ? 'bg-gray-800' : 'bg-white'
    ),

    modalCard: tw.style(
      'overflow-hidden',
      isDark ? 'bg-gray-800' : 'bg-white'
    ),

    modalHeader: tw.style(
      'flex-row justify-between items-center px-5 pt-2 pb-2 border-b',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    ),

    modalHeaderTitle: tw.style(
      'text-base font-bold',
      isDark ? 'text-white' : 'text-gray-800'
    ),

    modalHeaderSubTitle: tw.style(
      'text-xxs mt-1',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),

    modalTitle: tw.style(
      'text-lg font-bold',
      isDark ? 'text-white' : 'text-gray-800'
    ),

    modalSubTitle: tw.style(
      'text-xxs mt-1',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),

    modalCloseButton: tw.style(
      'p-1 rounded-full',
      isDark ? 'bg-gray-700 border border-gray-500' : 'bg-gray-100'
    ),

    // Divider / labels
    globalDivider: tw.style(
      'border-gray-700',
      !isDark && 'border-gray-200'
    ),

    transactionDivider: tw.style(
      'border-gray-700',
      !isDark && 'border-gray-200'
    ),

    transactionLabel: tw.style(
      'text-xs',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),

    // Search / input
    searchWrapper: tw.style(
      'px-4 py-2 border-b',
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
    ),

    searchBox: tw.style(
      'flex-row items-center rounded-xl px-3 h-12 border',
      isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
    ),

    searchInput: tw.style(
      'flex-1 ml-2 text-base',
      isDark ? 'text-white' : 'text-gray-800'
    ),

    inputContainer: tw.style('flex-1'),

    inputLabel: tw.style(
      'text-md mb-1 font-semibold',
      isDark ? 'text-gray-400' : 'text-gray-600'
    ),

    inputBox: tw.style(
      'rounded-lg p-3 border',
      isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
    ),

    inputText: tw.style(
      isDark ? 'text-white' : 'text-gray-800'
    ),

    inputPlaceholder: '#9CA3AF',

    // List items
    listItemText: tw.style(
      'text-base',
      isDark ? 'text-gray-300' : 'text-gray-800'
    ),

    listItem: (isSelected) =>
      tw.style(
        'flex-row items-center justify-between px-4 py-3 mx-2 my-1 rounded-xl border',
        isSelected
          ? 'bg-blue-50 border-blue-200'
          : isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-100'
      ),

    listItemIconWrap: (isSelected) =>
      tw.style(
        'p-2 rounded-lg mr-3',
        isSelected
          ? 'bg-blue-100'
          : isDark
            ? 'bg-gray-700'
            : 'bg-gray-100'
      ),

    // Filter / chips / buttons
    filterButton: tw.style(
      'flex-row items-center px-3 py-2 rounded-lg border',
      isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-200'
    ),

    filterButtonText: tw.style(
      'text-sm ml-2 font-medium',
      isDark ? 'text-white' : 'text-gray-800'
    ),

    filterButtonIcon: isDark ? '#D1D5DB' : '#374151',

    chip: tw.style(
      'px-4 py-2 rounded-full',
      isDark ? 'bg-gray-700' : 'bg-gray-100'
    ),

    chipSelectedText: tw.style('text-white'),

    saveButton: tw.style(
      'px-4 py-2 rounded-lg w-20',
      isDark ? 'bg-blue-600' : 'bg-blue-500'
    ),

    saveButtonText: tw.style(
      'text-center font-medium text-white'
    ),

    closeButton: tw.style(
      'px-4 py-2 rounded-lg border w-20',
      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
    ),

    closeButtonText: tw.style(
      'text-center font-medium',
      isDark ? 'text-white' : 'text-gray-700'
    ),

    cancelButton: tw.style(
      'flex-1 py-3 rounded-xl border',
      isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-300'
    ),

    cancelButtonText: tw.style(
      'text-center font-medium',
      isDark ? 'text-white' : 'text-gray-700'
    ),

    primaryButton: tw.style(
      'py-3 rounded-xl bg-blue-500'
    ),

    primaryButtonText: tw.style(
      'text-center font-semibold text-white'
    ),

    footer: tw.style(
      'p-4 border-t',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    ),

    // Profile page
    profileHeader: tw.style(
      'px-4 pt-4 pb-3 border-b',
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    ),

    profileHeaderTitle: tw.style(
      'font-bold text-md',
      isDark ? 'text-white' : 'text-gray-900'
    ),

    profileCard: tw.style(
      'rounded-2xl',
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    ),

    profileItemLabel: tw.style(
      'ml-3 text-sm font-medium',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),

    profileItemValue: tw.style(
      'text-base ml-11 font-semibold mt-2',
      isDark ? 'text-white' : 'text-gray-900'
    ),

    profileIconBox: tw.style(
      'p-3 rounded-xl mr-4',
      isDark ? 'bg-blue-900' : 'bg-blue-50'
    ),

    profileStatusCard: tw.style(
      'p-4 rounded-2xl',
      isDark ? 'bg-blue-900 border-gray-700' : 'bg-blue-50 border-gray-200'
    ),

    profileStatusTitle: tw.style(
      'ml-2 font-medium',
      isDark ? 'text-blue-200' : 'text-blue-800'
    ),

    profileStatusText: tw.style(
      'text-sm',
      isDark ? 'text-gray-200' : 'text-gray-700'
    ),

    bottomBar: tw.style(
      'absolute bottom-0 left-0 right-0',
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    ),

    // Generic text helpers
    globalCardText: tw.style(
      'text-xs',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),

    globalCardLabel: tw.style(
      'text-xs',
      isDark ? 'text-gray-400' : 'text-gray-500'
    ),

    globalCardValue: tw.style(
      'text-base font-bold',
      isDark ? 'text-white' : 'text-gray-800'
    ),

    globalDescLabel: tw.style(
      'text-xs font-medium ml-1.5',
      isDark ? 'text-gray-300' : 'text-gray-600'
    ),

    globalDescText: tw.style(
      'text-sm leading-5',
      isDark ? 'text-gray-200' : 'text-gray-700'
    ),

    // Common colors
    iconMuted: isDark ? '#535455' : '#ccced2',
    chevronColor: isDark ? '#f8f9fa' : '#6B7280',


    // for search input 
    searchContainer: {
      paddingHorizontal: 16,
    },

    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#D1D5DB',
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    },

    searchInput: {
      flex: 1,
      marginLeft: 8,
      paddingVertical: 12,
      fontSize: 16,
      color: isDark ? '#F9FAFB' : '#111827',
    },

    iconColor: isDark ? '#9CA3AF' : '#6B7280',

    placeholderColor: isDark ? '#6B7280' : '#9CA3AF',


    // for border 
    border: tw.style(
      'border rounded-xl',
      isDark ? 'border-gray-700 ' : 'border-gray-200'
    ),
    borderTop: tw.style(
      'border-t',
      isDark ? 'border-gray-700' : 'border-gray-200'
    ),
    borderBottom: tw.style(
      'border-b',
      isDark ? 'border-gray-700' : 'border-gray-200'
    ),
    borderLeft: tw.style(
      'border-l',
      isDark ? 'border-gray-700' : 'border-gray-200'
    ),
    borderRight: tw.style(
      'border-r',
      isDark ? 'border-gray-700' : 'border-gray-200'
    ),

    // search button 
    searchButton: tw.style(
      'flex-row items-center justify-center py-3.5 px-7 rounded-lg',
      isDark ? 'bg-blue-600' : 'bg-blue-500'
    ),

    // ✅ Search Button Text
    searchButtonText: tw.style(
      'text-white text-sm font-semibold'
    ),
  };
};