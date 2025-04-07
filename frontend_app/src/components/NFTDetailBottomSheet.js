import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const NFTDetailBottomSheet = ({ visible, onClose, nft }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!nft) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.handle} />
              
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                  <Text style={styles.title}>NFT 상세 정보</Text>

                  {nft.metadata?.image && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: nft.metadata.image }}
                        style={styles.nftImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}

                  <Text style={styles.nftName}>
                    {nft.metadata?.name || "Unnamed NFT"}
                  </Text>

                  <View style={styles.infoContainer}>
                    <View style={styles.labelColumn}>
                      <Text style={styles.label}>NFT 주소</Text>
                      {nft.metadata?.symbol && (
                        <Text style={styles.label}>심볼</Text>
                      )}
                    </View>
                    <View style={styles.valueColumn}>
                      <Text style={styles.value} numberOfLines={1}>
                        {nft.mint}
                      </Text>
                      {nft.metadata?.symbol && (
                        <Text style={styles.value}>{nft.metadata.symbol}</Text>
                      )}
                    </View>
                  </View>

                  {nft.metadata?.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>설명</Text>
                      <Text style={styles.description}>
                        {nft.metadata.description}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  scrollView: {
    maxHeight: height * 0.75,
  },
  content: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  imageContainer: {
    alignSelf: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  nftImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  nftName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  labelColumn: {
    flex: 1,
    marginRight: 16,
  },
  valueColumn: {
    flex: 3,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  value: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 16,
  },
  descriptionContainer: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666666',
  },
  description: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
});

export default NFTDetailBottomSheet; 