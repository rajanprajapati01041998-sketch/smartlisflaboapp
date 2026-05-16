import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
} from 'react-native';
import tw from 'twrnc';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SelectList} from 'react-native-dropdown-select-list';

const AddBarcodePatientRegistration = ({
  visible,
  onClose,
  onSave,
  themed,
  groups,
  groupBarcodeDraft,
  setGroupBarcodeDraft,
  barcodeDraft,
  setBarcodeDraft,
  sampleGroupExpanded,
  setSampleGroupExpanded,
  remarkExpanded,
  setRemarkExpanded,
  setBarcodeForServiceIds,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={themed.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={tw`absolute inset-0`} />
        </TouchableWithoutFeedback>

        <View style={[themed.modalContainer, tw`w-full h-[85%] rounded-t-3xl overflow-hidden`]}>
          <View style={tw`px-4 pt-4 pb-3 border-b border-gray-100`}>
            <View style={tw`flex-row justify-between items-center`}>
              <View style={tw`flex-1 pr-3`}>
                <Text style={themed.modalHeaderTitle}>Barcodes & Remarks</Text>
                <Text style={themed.mutedText}>Enter details for selected tests</Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={tw`w-9 h-9 rounded-full bg-gray-100 items-center justify-center`}>
                <MaterialCommunityIcons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={groups}
            keyExtractor={g => String(g?.key)}
            style={tw`flex-1`}
            contentContainerStyle={tw`px-4 pt-3 pb-6`}
            keyboardShouldPersistTaps="handled"
            renderItem={({item: group}) => {
              const groupKey = String(group?.key ?? 'unknown');
              const expanded = !!sampleGroupExpanded?.[groupKey];
              const groupBarcode = String(groupBarcodeDraft?.[groupKey] ?? '');
              const serviceIds = (group?.items || []).map(s => s?.ServiceItemId).filter(Boolean);

              return (
                <View style={[themed.childScreen, themed.border, tw`p-4 mb-4 rounded-xl`]}>
                  <TouchableOpacity
                    onPress={() =>
                      setSampleGroupExpanded(prev => ({
                        ...(prev || {}),
                        [groupKey]: !prev?.[groupKey],
                      }))
                    }
                    style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-1 pr-3`}>
                      <Text style={[themed.inputText, tw`font-semibold`]}>
                        {group?.sampleType || 'Sample Type'} ({group?.items?.length || 0})
                      </Text>
                      <Text style={tw`text-xs text-gray-500`}>
                        Tap to {expanded ? 'collapse' : 'expand'} tests
                      </Text>
                    </View>

                    <MaterialCommunityIcons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  <View style={tw`mt-3 mb-2`}>
                    <Text style={tw`text-xs font-medium text-gray-600 mb-1.5 ml-1`}>
                      Barcode Number
                    </Text>
                    <TextInput
                      value={groupBarcode}
                      onChangeText={txt =>
                        setGroupBarcodeDraft(prev => ({
                          ...(prev || {}),
                          [groupKey]: txt,
                        }))
                      }
                      onEndEditing={e => {
                        const txt = String(e?.nativeEvent?.text ?? '').trim();
                        if (txt) setBarcodeForServiceIds(serviceIds, txt);
                      }}
                      placeholder="Enter barcode"
                      placeholderTextColor="#9CA3AF"
                      style={[themed.inputBox, themed.inputText]}
                    />
                  </View>

                  {expanded &&
                    (group?.items || []).map(s => {
                      const id = s?.ServiceItemId;
                      const draft = id ? barcodeDraft?.[id] : null;
                      const isRemarkOpen = !!remarkExpanded?.[id];

                      const sampleTypes = Array.isArray(s?.SampleTypes)
                        ? s.SampleTypes
                        : Array.isArray(s?.sampleTypes)
                          ? s.sampleTypes
                          : [];

                      const sampleTypeOptions = sampleTypes
                        .filter(st => st?.sampleTypeId != null)
                        .map(st => ({
                          key: String(st.sampleTypeId),
                          value: String(st.sampleType || ''),
                        }));

                      return (
                        <View key={String(id)} style={[themed.border, tw`p-3 mb-3 rounded-xl`]}>
                          <Text style={[themed.inputText, tw`mb-2`]}>{s?.ServiceName || ''}</Text>

                          {sampleTypeOptions.length > 0 && (
                            <View style={tw`mb-3`}>
                              <Text style={tw`text-xs font-medium text-gray-600 mb-1.5 ml-1`}>
                                Sample Type
                              </Text>

                              <SelectList
                                data={sampleTypeOptions}
                                save="key"
                                defaultOption={
                                  sampleTypeOptions.find(
                                    o => o.key === String(draft?.sampleTypeId ?? s?.SampleTypeId ?? ''),
                                  ) || sampleTypeOptions[0]
                                }
                                setSelected={key => {
                                  if (!id) return;
                                  const selected = sampleTypeOptions.find(o => o.key === String(key));
                                  setBarcodeDraft(prev => ({
                                    ...(prev || {}),
                                    [id]: {
                                      ...(prev?.[id] || {}),
                                      sampleTypeId: key ? Number(key) : null,
                                      sampleType: selected?.value || '',
                                    },
                                  }));
                                }}
                                boxStyles={themed.inputBox}
                                inputStyles={themed.inputText}
                                dropdownStyles={themed.inputBox}
                                dropdownTextStyles={themed.inputText}
                              />
                            </View>
                          )}

                          <TouchableOpacity
                            onPress={() =>
                              setRemarkExpanded(prev => ({
                                ...(prev || {}),
                                [id]: !prev?.[id],
                              }))
                            }
                            style={tw`flex-row justify-between items-center`}>
                            <Text style={tw`text-xs font-medium text-gray-600`}>
                              Test Remark
                            </Text>
                            <MaterialCommunityIcons
                              name={isRemarkOpen ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color="#6B7280"
                            />
                          </TouchableOpacity>

                          {isRemarkOpen && (
                            <TextInput
                              value={draft?.testRemark ?? ''}
                              onChangeText={txt => {
                                if (!id) return;
                                setBarcodeDraft(prev => ({
                                  ...(prev || {}),
                                  [id]: {
                                    ...(prev?.[id] || {}),
                                    testRemark: txt,
                                  },
                                }));
                              }}
                              placeholder="Enter test remark"
                              placeholderTextColor="#9CA3AF"
                              multiline
                              style={[themed.inputBox, themed.inputText, tw`mt-2 h-20`]}
                            />
                          )}
                        </View>
                      );
                    })}
                </View>
              );
            }}
          />

          <View style={tw`p-4 border-t border-gray-100 flex-row gap-3`}>
            <TouchableOpacity onPress={onClose} style={[themed.card, tw`flex-1 py-3 rounded-xl`]}>
              <Text style={[themed.inputText, tw`text-center font-semibold`]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onSave} style={[themed.primaryButton, tw`flex-1`]}>
              <Text style={themed.primaryButtonText}>Save Patient</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddBarcodePatientRegistration;