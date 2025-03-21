import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';

// 더미 데이터: 카테고리
const categories = [
  { id: '1', name: '카테고리 1', icon: require('../../assets/category1.png') },
  { id: '2', name: '카테고리 2', icon: require('../../assets/category2.png') },
  { id: '3', name: '카테고리 3', icon: require('../../assets/category3.png') },
  { id: '4', name: '카테고리 4', icon: require('../../assets/category4.png') },
  { id: '5', name: '카테고리 5', icon: require('../../assets/category5.png') },
  { id: '6', name: '카테고리 6', icon: require('../../assets/category6.png') },
  { id: '7', name: '카테고리 7', icon: require('../../assets/category7.png') },
  { id: '8', name: '카테고리 8', icon: require('../../assets/category8.png') },
];

// 더미 데이터: 상품
const products = [
  { 
    id: '1', 
    image: require('../../assets/product1.png'), 
    brand: '브랜드명', 
    name: '물건 이름', 
    price: '0.0 WORK'
  },
  { 
    id: '2', 
    image: require('../../assets/product2.png'), 
    brand: '브랜드명', 
    name: '물건 이름', 
    price: '0.0 WORK'
  },
  { 
    id: '3', 
    image: require('../../assets/product3.png'), 
    brand: '브랜드명', 
    name: '물건 이름', 
    price: '0.0 WORK'
  },
  { 
    id: '4', 
    image: require('../../assets/product4.png'), 
    brand: '브랜드명', 
    name: '물건 이름', 
    price: '0.0 WORK'
  },
  { 
    id: '5', 
    image: require('../../assets/product5.png'), 
    brand: '브랜드명', 
    name: '물건 이름', 
    price: '0.0 WORK'
  },
  { 
    id: '6', 
    image: require('../../assets/product6.png'), 
    brand: '브랜드명', 
    name: '물건 이름', 
    price: '0.0 WORK'
  },
];

const StoreScreen = () => {
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 카테고리 아이콘 렌더링
  const renderCategoryIcon = () => {
    return (
      <TouchableOpacity 
        style={styles.tagIcon} 
        onPress={() => setShowCategories(!showCategories)}
      >
        <Image 
          source={require('../../assets/tag-icon.png')} 
          style={{ width: 30, height: 30, tintColor: showCategories ? '#FF8C00' : '#888' }} 
        />
      </TouchableOpacity>
    );
  };

  // 카테고리 아이템 렌더링
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem} 
      onPress={() => {
        setSelectedCategory(item.id);
        setShowCategories(false);
      }}
    >
      <Image source={item.icon} style={styles.categoryIcon} />
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // 상품 아이템 렌더링
  const renderProductItem = ({ item }) => (
    <View style={styles.productItem}>
      <Image source={item.image} style={styles.productImage} />
      <Text style={styles.productBrand}>{item.brand}</Text>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색바 및 장바구니 아이콘 */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="검색어를 입력하세요"
            placeholderTextColor="#aaa"
          />
        </View>
        <TouchableOpacity style={styles.cartIcon}>
          <Image 
            source={require('../../assets/cart-icon.png')} 
            style={{ width: 24, height: 24 }} 
          />
        </TouchableOpacity>
      </View>

      {/* 카테고리 및 정렬 옵션 */}
      <View style={styles.filterContainer}>
        {renderCategoryIcon()}
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortButtonText}>↑↓ 인기 순</Text>
        </TouchableOpacity>
      </View>

      {/* 카테고리 목록 (토글) */}
      {showCategories && (
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.selectedCategory,
                ]}
                onPress={() => {
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  );
                }}
              >
                <Image source={category.icon} style={styles.categoryIcon} />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 상품 그리드 */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchContainer: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    fontSize: 14,
  },
  cartIcon: {
    padding: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagIcon: {
    padding: 5,
  },
  sortButton: {
    borderWidth: 1,
    borderColor: '#FF8C00',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    color: '#FF8C00',
    fontSize: 14,
  },
  categoriesContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    paddingHorizontal: 5,
  },
  selectedCategory: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  categoryName: {
    fontSize: 12,
    marginTop: 5,
    color: '#333',
  },
  productList: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20, // 바텀 여백
  },
  productItem: {
    flex: 1,
    margin: 5,
    marginBottom: 20,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
  },
  productBrand: {
    fontSize: 12,
    color: '#888',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginVertical: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StoreScreen;