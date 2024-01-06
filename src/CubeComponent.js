// CubeComponent.js
import React from 'react';
import Cube from './Cube'; // Import your Cube component

const CubeComponent = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%' }}>
      <Cube />
    </div>
  );
};

export default CubeComponent;
