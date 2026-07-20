import { calculateDistance } from '../lib/geo';

describe('Geolocation logic', () => {
  it('calculates the distance between two same points as 0', () => {
    const lat = 13.7563;
    const lng = 100.5018;
    const distance = calculateDistance(lat, lng, lat, lng);
    expect(distance).toBe(0);
  });

  it('calculates distance between two known points correctly', () => {
    // Bangkok (Wat Phra Kaew)
    const lat1 = 13.7516;
    const lng1 = 100.4926;
    
    // Nonthaburi
    const lat2 = 13.8591;
    const lng2 = 100.5217;

    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    // Should be around 12.3 km (12300 meters)
    expect(distance).toBeGreaterThan(12000);
    expect(distance).toBeLessThan(13000);
  });

  it('calculates small distances correctly', () => {
    const lat1 = 13.751600;
    const lng1 = 100.492600;
    
    const lat2 = 13.751690; // About 10 meters north
    const lng2 = 100.492600;

    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    expect(distance).toBeGreaterThan(8);
    expect(distance).toBeLessThan(12);
  });
});
