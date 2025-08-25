import { Map, MapMarker } from 'react-kakao-maps-sdk';
import styled from 'styled-components';

const StyledMap = styled(Map)`
  width: 100%;
  height: 100%;
  border-radius: 20px;
`;

const Kakao = ({ center, level, markers }) => {
  return (
    <StyledMap center={center} level={level}>
      {markers.map((marker) => (
        <MapMarker 
          key={marker.id} 
          position={{ lat: marker.lat, lng: marker.lng }}
          title={marker.title}
        />
      ))}
    </StyledMap>
  );
};

export default Kakao;