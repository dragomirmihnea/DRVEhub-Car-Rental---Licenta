import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Searchbar, Modal, Button, PaperProvider } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { Drawer } from 'react-native-drawer-layout';
import { useFocusEffect } from '@react-navigation/native';

const COLORS = { primary: '#7F3DFF', primaryLight: '#EEE5FF', white: '#FFFFFF', text: '#111111' };

export default function HomeScreen() {
  const mapStyle = [
    { "featureType": "poi", "elementType": "all", "stylers": [{ "hue": "#000000" }, { "saturation": -100 }, { "lightness": -100 }, { "visibility": "off" }] },
    { "featureType": "road.local", "elementType": "all", "stylers": [{ "hue": "#ffffff" }, { "saturation": -100 }, { "lightness": 100 }, { "visibility": "on" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "hue": "#bbbbbb" }, { "saturation": -100 }, { "lightness": 26 }, { "visibility": "on" }] }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [dateRange, setDateRange] = useState('Selectează perioada');
  const [selected, setSelected] = useState<any>({});
  const [startDate, setStartDate] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [selectedCar, setSelectedCar] = useState<any>(null);

useFocusEffect(
  React.useCallback(() => {
    fetch('http://192.168.21.236:3000/api/cars')
      .then(res => res.json())
      .then(data => setCars(data))
      .catch(err => console.error(err));
  }, [])
);

  useEffect(() => {
    // Schimbă IP-ul cu cel obținut din ipconfig/ifconfig
    fetch('http://192.168.21.236:3000/api/cars') 
      .then(res => res.json())
      .then(data => setCars(data))
      .catch(err => console.error("Eroare API:", err));
  }, []);

  const onDayPress = (day: any) => {
    const date = day.dateString;
    if (!startDate || (startDate && Object.keys(selected).length > 1)) {
      setStartDate(date);
      setSelected({ [date]: { selected: true, startingDay: true, color: COLORS.primary, textColor: 'white' } });
    } else {
      setSelected(getRange(startDate, date));
      setDateRange(`${startDate} -> ${date}`);
      setStartDate('');
    }
  };

  const getRange = (start: string, end: string) => {
    let range: any = {};
    let d1 = new Date(start);
    let d2 = new Date(end);
    if (d1 > d2) [d1, d2] = [d2, d1];
    let temp = new Date(d1);
    while (temp <= d2) {
      const dateStr = temp.toISOString().split('T')[0];
      range[dateStr] = { selected: true, color: COLORS.primary, textColor: 'white', 
        ...(temp.getTime() === d1.getTime() && { startingDay: true }),
        ...(temp.getTime() === d2.getTime() && { endingDay: true }) };
      temp.setDate(temp.getDate() + 1);
    }
    return range;
  };

  return (
    <PaperProvider>
      <Drawer
        open={isDrawerOpen}
        onOpen={() => setIsDrawerOpen(true)}
        onClose={() => setIsDrawerOpen(false)}
        drawerType="front"
        renderDrawerContent={() => (
          <View style={styles.drawerContent}>
            <Text style={styles.drawerTitle}>DRVEhub</Text>
            <Text style={styles.menuItem}>🚗 Istoric Rezervări</Text>
            <Text style={styles.menuItem}>👤 Profilul meu</Text>
            <Text style={styles.menuItem}>📞 Contact</Text>
          </View>
        )}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.menuButton} onPress={() => setIsDrawerOpen(true)}>
              <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>☰</Text>
            </TouchableOpacity>
            <Searchbar placeholder="Caută..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} iconColor={COLORS.primary} />
          </View>

          <TouchableOpacity style={styles.dateFilter} onPress={() => setVisible(true)}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>📅 {dateRange}</Text>
          </TouchableOpacity>

          <MapView 
  style={styles.map} 
  provider="google" 
  customMapStyle={mapStyle} 
  initialRegion={{ latitude: 45.6427, longitude: 25.5887, latitudeDelta: 0.05, longitudeDelta: 0.05 }} 
>
  {cars
    .filter((car: any) => car.status.trim() === 'Disponibil') // Am adăugat .trim() pentru a elimina spațiile goale
    .map((car: any) => (
      car.lat && car.lng && (
        <Marker 
          key={car.id} 
          coordinate={{ latitude: parseFloat(car.lat), longitude: parseFloat(car.lng) }} 
          onPress={() => setSelectedCar(car)} 
        />
      )
    ))
  }
</MapView>

          {/* Modal Detalii Mașină - Varianta îmbunătățită */}
          <Modal visible={!!selectedCar} onDismiss={() => setSelectedCar(null)} contentContainerStyle={styles.modal}>
            <Text style={{fontSize: 24, fontWeight: 'bold', color: COLORS.primary}}>{selectedCar?.marca} {selectedCar?.model}</Text>
            <View style={{marginVertical: 15}}>
              <Text style={styles.detailText}>📅 An: {selectedCar?.an}</Text>
              <Text style={styles.detailText}>⛽ Combustibil: {selectedCar?.combustibil}</Text>
              <Text style={styles.detailText}>💧 Consum: {selectedCar?.consum}</Text>
              <Text style={styles.detailText}>🛣️ Km: {selectedCar?.km}</Text>
              <Text style={[styles.detailText, {fontWeight: 'bold'}]}>💰 Preț: {selectedCar?.pret} €/zi</Text>
            </View>
            <Button mode="contained" buttonColor={COLORS.primary} onPress={() => { setSelectedCar(null); alert("Rezervare inițiată!"); }}>Rezervă acum</Button>
            <Button 
  mode="outlined" 
  style={{marginTop: 10}} 
  onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${selectedCar?.lat},${selectedCar?.lng}`)}
>
  Navighează
</Button>
          </Modal>

          <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
            <Calendar markingType={'period'} markedDates={selected} onDayPress={onDayPress} theme={{ todayTextColor: COLORS.primary, selectedDayBackgroundColor: COLORS.primary, arrowColor: COLORS.primary }} />
            <Button mode="contained" buttonColor={COLORS.primary} style={{marginTop: 20}} onPress={() => setVisible(false)}>Confirmă</Button>
          </Modal>
        </View>
      </Drawer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  header: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', zIndex: 10 },
  menuButton: { padding: 15, marginRight: 10, backgroundColor: COLORS.white, borderRadius: 10, elevation: 5 },
  searchBar: { flex: 1, backgroundColor: COLORS.white, borderRadius: 10, elevation: 5 },
  dateFilter: { position: 'absolute', top: 110, left: 20, backgroundColor: COLORS.primaryLight, padding: 12, borderRadius: 20, zIndex: 10 },
  modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 20 },
  detailText: { fontSize: 16, marginBottom: 5, color: COLORS.text },
  drawerContent: { flex: 1, paddingTop: 80, paddingHorizontal: 20, backgroundColor: COLORS.white },
  drawerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 40 },
  menuItem: { fontSize: 18, paddingVertical: 20, color: COLORS.text }
});