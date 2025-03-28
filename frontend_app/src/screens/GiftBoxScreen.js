import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const GiftBoxScreen = () => {
  const [activeTab, setActiveTab] = useState('waiting');
  const navigation = useNavigation();

  const giftData = useMemo(() => [
    {
      id: '1',
      storeName: '투썸플레이스',
      itemName: '스트로베리 케이크',
      sender: '박준수',
      date: '2025.03.02',
      status: 'waiting',
      quantity: 1,
    },
    {
      id: '2',
      storeName: '투썸플레이스',
      itemName: '스트로베리 케이크',
      sender: '박준수',
      date: '2025.03.02',
      status: 'completed',
      quantity: 1,
    },
    {
      id: '3',
      storeName: '투썸플레이스',
      itemName: '스트로베리 케이크',
      sender: '박준수',
      date: '2025.03.02',
      status: 'waiting',
      quantity: 1,
    },
    {
      id: '4',
      storeName: '투썸플레이스',
      itemName: '스트로베리 케이크',
      sender: '박준수',
      date: '2025.03.02',
      status: 'completed',
      quantity: 1,
    },
  ], []);

  const filteredGiftData = useMemo(() => {
    return giftData.filter(item => item.status === activeTab);
  }, [giftData, activeTab]);

  const renderGiftItems = () => {
    const rows = [];
    for (let i = 0; i < filteredGiftData.length; i += 2) {
      const row = (
        <View key={`row-${i}`} style={styles.row}>
          <TouchableOpacity
            style={styles.giftItem}
            onPress={() => navigation.navigate('GiftDetail', { item: filteredGiftData[i] })}
          >
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>케이크 이미지</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.storeName}>{filteredGiftData[i].storeName}</Text>
              <Text style={styles.itemName}>{filteredGiftData[i].itemName}</Text>
              <View style={styles.bottomInfo}>
                <Text style={styles.sender}>보낸이 : {filteredGiftData[i].sender}</Text>
                <Text style={styles.date}>{filteredGiftData[i].date}</Text>
              </View>
            </View>
          </TouchableOpacity>
          {i + 1 < filteredGiftData.length && (
            <TouchableOpacity
              style={styles.giftItem}
              onPress={() => navigation.navigate('GiftDetail', { item: filteredGiftData[i + 1] })}
            >
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>케이크 이미지</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.storeName}>{filteredGiftData[i + 1].storeName}</Text>
                <Text style={styles.itemName}>{filteredGiftData[i + 1].itemName}</Text>
                <View style={styles.bottomInfo}>
                  <Text style={styles.sender}>보낸이 : {filteredGiftData[i + 1].sender}</Text>
                  <Text style={styles.date}>{filteredGiftData[i + 1].date}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      );
      rows.push(row);
    }
    return rows;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'waiting' && styles.activeTab]}
          onPress={() => setActiveTab('waiting')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'waiting' && styles.activeTabText
          ]}>수령 대기</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'completed' && styles.activeTabText
          ]}>수령 완료</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {renderGiftItems()}
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: -15,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  itemContainer: {
    width: itemWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: itemWidth,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  placeholderText: {
    color: '#999999',
    fontSize: 14,
  },
  itemInfo: {
    padding: 10,
  },
  storeName: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sender: {
    fontSize: 12,
    color: '#333333',
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF8C00',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#FF8C00',
    fontWeight: '600',
  },
  giftItem: {
    width: itemWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  giftImage: {
    width: '100%',
    height: itemWidth,
  },
});

export default GiftBoxScreen; 