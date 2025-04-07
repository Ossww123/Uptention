import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as Linking from 'expo-linking';
import { Buffer } from 'buffer';
import { useWallet } from '../contexts/WalletContext';
import NFTDetailBottomSheet from '../components/NFTDetailBottomSheet';

// Metaplex 관련 상수
const METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
const DEVNET_CONNECTION = new Connection('https://api.devnet.solana.com', {
  wsEndpoint: 'wss://api.devnet.solana.com/',
  commitment: 'confirmed'
});

const NFTScreen = ({ navigation }) => {
  const [nfts, setNfts] = useState([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const { publicKey } = useWallet();
  const [selectedNft, setSelectedNft] = useState(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  // NFT 선택 핸들러
  const handleNftPress = (nft) => {
    setSelectedNft(nft);
    setIsBottomSheetVisible(true);
  };

  // 바텀시트 닫기 핸들러
  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    setSelectedNft(null);
  };

  // NFT 목록 가져오기
  const fetchNFTs = async () => {
    if (!publicKey) return;

    try {
      setLoadingNfts(true);
      const walletPublicKey = new PublicKey(publicKey);

      // 지갑의 모든 토큰 계정 가져오기
      const tokenAccounts = await DEVNET_CONNECTION.getParsedTokenAccountsByOwner(
        walletPublicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      // NFT 필터링 (supply가 1이고 decimals가 0인 토큰)
      const nftAccounts = tokenAccounts.value.filter(account => {
        const tokenAmount = account.account.data.parsed.info.tokenAmount;
        return tokenAmount.decimals === 0 && tokenAmount.amount === "1";
      });

      // NFT 메타데이터 가져오기
      const nftsWithMetadata = await Promise.all(
        nftAccounts.map(async (account) => {
          const mint = account.account.data.parsed.info.mint;
          try {
            const metadataPDA = await PublicKey.findProgramAddress(
              [
                Buffer.from('metadata'),
                new PublicKey(METADATA_PROGRAM_ID).toBytes(),
                new PublicKey(mint).toBytes(),
              ],
              new PublicKey(METADATA_PROGRAM_ID)
            );

            const accountInfo = await DEVNET_CONNECTION.getAccountInfo(metadataPDA[0]);
            
            if (accountInfo) {
              try {
                // 메타데이터 파싱
                const buffer = accountInfo.data;
                
                // 키와 업데이트 권한 건너뛰기
                let offset = 1 + 32 + 32 + 32;
                
                // 이름 길이
                const nameLength = buffer[offset];
                offset += 4;
                
                // 이름
                const name = buffer.slice(offset, offset + nameLength).toString('utf8');
                offset += nameLength;
                
                // 심볼 길이
                const symbolLength = buffer[offset];
                offset += 4;
                
                // 심볼
                const symbol = buffer.slice(offset, offset + symbolLength).toString('utf8');
                offset += symbolLength;
                
                // URI 길이
                const uriLength = buffer[offset];
                offset += 4;
                
                // URI
                const uri = buffer.slice(offset, offset + uriLength).toString('utf8');

                try {
                  // URI에서 메타데이터 가져오기
                  const response = await fetch(uri);
                  if (!response.ok) {
                    throw new Error(`메타데이터 가져오기 실패: ${response.status}`);
                  }
                  const metadata = await response.json();

                  // 이미지 URL 처리
                  let imageUrl = metadata.image;
                  if (imageUrl) {
                    if (imageUrl.startsWith('ipfs://')) {
                      imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                    } else if (imageUrl.startsWith('ar://')) {
                      imageUrl = imageUrl.replace('ar://', 'https://arweave.net/');
                    }
                  }

                  return {
                    mint,
                    tokenAccount: account.pubkey.toString(),
                    metadata: {
                      name: metadata.name || name || 'Unnamed NFT',
                      symbol: metadata.symbol || symbol || '',
                      image: imageUrl || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`,
                      description: metadata.description || `NFT Token: ${mint}`
                    }
                  };
                } catch (metadataError) {
                  return {
                    mint,
                    tokenAccount: account.pubkey.toString(),
                    metadata: {
                      name: name || 'Unnamed NFT',
                      symbol: symbol || '',
                      image: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`,
                      description: `NFT Token: ${mint}`
                    }
                  };
                }
              } catch (error) {
                return {
                  mint,
                  tokenAccount: account.pubkey.toString(),
                  metadata: {
                    name: 'Unknown NFT',
                    symbol: '',
                    image: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`,
                    description: `NFT Token: ${mint}`
                  }
                };
              }
            }
          } catch (error) {
            console.error('NFT 메타데이터 가져오기 실패:', error);
          }
          
          return {
            mint,
            tokenAccount: account.pubkey.toString(),
            metadata: null
          };
        })
      );

      setNfts(nftsWithMetadata.filter(nft => nft !== null));
    } catch (error) {
      console.error('NFT 가져오기 실패:', error);
    } finally {
      setLoadingNfts(false);
    }
  };

  // 컴포넌트 마운트 시 NFT 가져오기
  useEffect(() => {
    if (publicKey) {
      fetchNFTs();
    }
  }, [publicKey]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.nftListContainer}>
        <View style={styles.nftHeader}>
          <Text style={styles.nftTitle}>보유 중인 NFT</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchNFTs}
            disabled={loadingNfts}
          >
            <Text style={styles.refreshButtonText}>
              {loadingNfts ? "로딩 중..." : "새로고침"}
            </Text>
          </TouchableOpacity>
        </View>

        {loadingNfts ? (
          <Text style={styles.loadingText}>NFT 로딩 중...</Text>
        ) : (
          <View style={styles.nftGrid}>
            {nfts.length > 0 ? (
              nfts.map((nft, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.nftCard}
                  onPress={() => handleNftPress(nft)}
                >
                  {nft.metadata?.image && (
                    <Image
                      source={{ uri: nft.metadata.image }}
                      style={styles.nftImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.nftInfo}>
                    <Text style={styles.nftName} numberOfLines={2}>
                      {nft.metadata?.name || "Unnamed NFT"}
                    </Text>
                    <Text style={styles.nftAddress} numberOfLines={1}>
                      {nft.mint.slice(0, 4)}...{nft.mint.slice(-4)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noNfts}>보유 중인 NFT가 없습니다.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <NFTDetailBottomSheet
        isVisible={isBottomSheetVisible}
        onClose={handleCloseBottomSheet}
        nft={selectedNft}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  nftListContainer: {
    padding: 20,
  },
  nftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nftTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1f36',
  },
  refreshButton: {
    backgroundColor: '#f7f9fc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refreshButtonText: {
    color: '#4a5568',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    color: '#718096',
    fontSize: 16,
    paddingVertical: 12,
  },
  nftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nftCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nftImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f7f9fc',
  },
  nftInfo: {
    padding: 12,
  },
  nftName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  nftAddress: {
    fontSize: 12,
    color: '#718096',
  },
  noNfts: {
    textAlign: 'center',
    color: '#718096',
    fontSize: 15,
    width: '100%',
    marginTop: 12,
  },
});

export default NFTScreen; 