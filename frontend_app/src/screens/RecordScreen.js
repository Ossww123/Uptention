import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RecordScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>기록 화면</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 16,
    color: '#000000',
  },
});

export default RecordScreen; 