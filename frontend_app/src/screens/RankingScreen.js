import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import { useAuth } from '../contexts/AuthContext';

const RankingScreen = ({ navigation }) => {
  const [selectedRank, setSelectedRank] = useState(1);
  const [rankingData, setRankingData] = useState({});
  const [loading, setLoading] = useState(true);
  const { authToken } = useAuth();

  useEffect(() => {
    fetchRankingData();
  }, []);

  const fetchRankingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/mining-time`, {
        params: {
          top: 3
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('API Response:', response.data); // 응답 데이터 로깅
      
      // API 응답 데이터를 rankingData 형식에 맞게 변환
      const formattedData = {};
      Object.entries(response.data).forEach(([rank, users]) => {
        formattedData[parseInt(rank)] = users.map((user, index) => ({
          id: index,
          name: user.username,
          employeeNumber: `${user.totalMiningMinutes}분`,
          points: user.totalMiningMinutes
        }));
      });

      console.log('Formatted Data:', formattedData); // 변환된 데이터 로깅
      setRankingData(formattedData);
    } catch (error) {
      console.error('랭킹 데이터 조회 실패:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const renderRankItem = (item) => (
    <View key={item.id} style={styles.rankItem}>
      <Text style={styles.nameText}>{item.name}</Text>
      <Text style={styles.employeeNumberText}>{item.employeeNumber}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.rankingContainer}>
          {/* 2등 */}
          <TouchableOpacity 
            style={[styles.rankBox, styles.secondPlace]}
            onPress={() => setSelectedRank(2)}
          >
            <Text style={styles.rankText}>2등</Text>
          </TouchableOpacity>

          {/* 1등 */}
          <TouchableOpacity 
            style={[styles.rankBox, styles.firstPlace]}
            onPress={() => setSelectedRank(1)}
          >
            <Text style={styles.rankText}>1등</Text>
          </TouchableOpacity>

          {/* 3등 */}
          <TouchableOpacity 
            style={[styles.rankBox, styles.thirdPlace]}
            onPress={() => setSelectedRank(3)}
          >
            <Text style={styles.rankText}>3등</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rankListHeader}>
          <Text style={styles.rankListTitle}>{selectedRank}등</Text>
        </View>

        <View style={styles.rankListContainer}>
          {rankingData[selectedRank]?.map(renderRankItem)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flexGrow: 1,
  },
  rankingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    margin: 20,
  },
  rankBox: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  firstPlace: {
    height: 160,
    backgroundColor: '#FF8C00',
    zIndex: 3,
  },
  secondPlace: {
    height: 120,
    backgroundColor: '#FFA500',
    zIndex: 2,
  },
  thirdPlace: {
    height: 80,
    backgroundColor: '#FFB732',
    zIndex: 1,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rankListHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  rankListTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rankListContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  rankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  employeeNumberText: {
    fontSize: 14,
    color: '#666666',
  }
});

export default RankingScreen;