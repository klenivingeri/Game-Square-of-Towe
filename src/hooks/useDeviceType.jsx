import { useState, useEffect } from 'react';

export function useDeviceType() {
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    
    const checkDeviceType = () => {
      if (mobileRegex.test(userAgent)) {
        setDeviceType('mobile');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDeviceType();
  }, []);

  return deviceType;
}
