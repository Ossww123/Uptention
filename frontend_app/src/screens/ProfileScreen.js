import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* 상단 지갑 아이콘 */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.walletIconContainer}>
              <Ionicons name="wallet-outline" size={25} color="black" />
            </TouchableOpacity>
          </View>

          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={15} color="black" />
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <View style={styles.profileImageContainer}>
                <View style={styles.profileImage} />
              </View>
              <View style={styles.infoContainer}>
                <View style={styles.textContainer}>
                  <View style={styles.profileDetails}>
                    <Text style={styles.label}>소속:</Text>
                    <Text style={styles.label}>이름:</Text>
                    <Text style={styles.label}>아이디:</Text>
                  </View>
                  <View style={styles.profileValues}>
                    <Text style={styles.value}>싸피</Text>
                    <Text style={styles.value}>박준수</Text>
                    <Text style={styles.value}>jjjjjuuuu</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 지갑 섹션 */}
          <View style={styles.walletSection}>
            <Text style={styles.sectionTitle}>지갑</Text>
            <View style={styles.tokenContainer}>
              <View style={styles.tokenItem}>
                <Text style={styles.tokenLabel}>WORK</Text>
                <Text style={styles.tokenValue}>100.06</Text>
              </View>
              <View style={styles.tokenItem}>
                <Text style={styles.tokenLabel}>SOLANA</Text>
                <Text style={styles.tokenValue}>100.06</Text>
              </View>
            </View>
          </View>

          {/* 메뉴 섹션 */}
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>주문 내역</Text>
              <Ionicons name="chevron-forward" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>선물함</Text>
              <Ionicons name="chevron-forward" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>NFT</Text>
              <Ionicons name="chevron-forward" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

    
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 130,
    borderRadius: 10,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingRight: 10,
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    backgroundColor: '#E1E1E1',
    borderRadius: 10,
  },
  profileDetails: {
    justifyContent: 'center',
    height: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 10,
    color: '#000',
  },
  value: {
    fontSize: 14,
    marginBottom: 10,
    color: '#000',
    textAlign: 'right',
  },
  editButton: {
    position: 'absolute',
    right: 8,
    top: 5,
    zIndex: 1,
  },
  walletSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginTop: 30,
    borderWidth: 2,
    borderColor: '#F8F8F8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  tokenContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  tokenLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 33,
    marginTop: 30,
    marginHorizontal: -20,
    borderWidth: 2,
    borderColor: '#F8F8F8',

  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    width: '40%',
    alignSelf: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
  },
  activeNavText: {
    color: '#FF8C00',
  },
  profileValues: {
    justifyContent: 'center',
    height: '100%',
    alignItems: 'flex-end',
  },
  headerSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  walletIconContainer: {
    padding: 8,
  },
});

export default HomeScreen; 