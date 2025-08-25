import React, { useState, useEffect } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import Kakao from './Kakao';
import useMapController from './useMapController';
import axios from 'axios';

/*export default function MapView() {
  // 쉼터 데이터를 저장할 상태(state)를 만듭니다.
  const [shelters, setShelters] = useState([]);

  // useEffect를 사용해 컴포넌트가 처음 렌더링될 때 API를 호출합니다.
  useEffect(() => {
    const fetchShelters = async () => {
      try {
        // 이전에 사용하셨던 API 주소로 GET 요청을 보냅니다.
        const response = await axios.get('http://openddm.store/shelter/list/');

        console.log("MapView에서 받은 쉼터 데이터:", response.data);
        
        // API 응답으로 받은 데이터를 shelters 상태에 저장합니다.
        setShelters(response.data);
      } catch (error) {
        console.error("API 호출 에러:", error);
      }
    };

    fetchShelters();
  }, []); // 빈 배열을 전달하여 최초 1회만 실행되도록 합니다.
  

  return (
    <Map 
      center={{ lat: 37.5744, lng: 127.0571 }} // 지도의 중심을 동대문구청 근처로 설정
      style={{ width: '100%', height: '100%' }}
      level={10} // 여러 마커를 잘 보이도록 레벨을 조정
    >
      
      {shelters.map((shelter) => (
        <MapMarker
          key={shelter.index} // 각 마커를 구분하기 위한 고유 key
          position={{ lat: shelter.latitude, lng: shelter.longitude }}
          title={shelter.name} // 마커에 마우스를 올리면 쉼터 이름이 표시됩니다.
        />
      ))}
    </Map>
  );


}*/


export default function MapView() {
  // 지도의 상태를 관리합니다.
  const [center, setCenter] = useState({ lat: 37.597489, lng: 127.05885 });
  const [markers, setMarkers] = useState([]);
  
  // 지도 로직을 커스텀 훅에서 가져옵니다.
  const { markingMap } = useMapController({ setCenter, setMarkers });

  // 컴포넌트가 처음 렌더링될 때 쉼터 마커를 표시합니다.
  useEffect(() => {
    markingMap();
  }, []); // 최초 1회만 실행

  return (
    <Kakao 
      center={center}
      level={10}
      markers={markers}
    />
  );
}

