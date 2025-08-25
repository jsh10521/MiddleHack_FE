import { locationService } from './locationService';

const useMapController = ({ setCenter, setMarkers }) => {
  const moveTo = () => {
    setCenter({ lat: 37.5944, lng: 127.0509 });
  };

  const markingMap = async () => {
    try {
      const shelterData = await locationService();
      
      const newMarkers = shelterData.map(shelter => ({
        id: shelter.index, // 고유 key
        lat: shelter.latitude, // 'latitude' -> 'lat'
        lng: shelter.longitude, // 'longitude' -> 'lng'
        title: shelter.name
      }));
      
      setMarkers(newMarkers);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    moveTo,
    markingMap,
  };
};

export default useMapController;