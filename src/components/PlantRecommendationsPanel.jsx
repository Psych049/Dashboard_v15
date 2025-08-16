import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { soilRecommendations } from '../data/mockData';

const PlantRecommendationsPanel = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedSoil, setSelectedSoil] = useState('Loam soil');
  const soilTypes = Object.keys(soilRecommendations);

  const currentRecommendation = soilRecommendations[selectedSoil];

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Plant Recommendations</h2>
      
      <div className="mb-4">
        <label htmlFor="soil-select" className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Choose soil type:
        </label>
        <select
          id="soil-select"
          className={`block w-full rounded-md shadow-sm focus:ring focus:ring-green-200 focus:ring-opacity-50 ${
            isDark 
              ? 'border-gray-600 bg-gray-700 text-white focus:border-green-500' 
              : 'border-gray-300 bg-white text-gray-900 focus:border-green-500'
          }`}
          value={selectedSoil}
          onChange={(e) => setSelectedSoil(e.target.value)}
        >
          {soilTypes.map((soil) => (
            <option key={soil} value={soil}>
              {soil}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className={`flex items-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="mr-2">📘</span>
            Soil Characteristics
          </h3>
          <p className={`mt-1 text-sm ml-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentRecommendation.characteristics}
          </p>
        </div>
        
        <div>
          <h3 className={`flex items-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="mr-2">🌼</span>
            Ideal Plants
          </h3>
          <div className="mt-1 ml-6">
            <div className="flex flex-wrap gap-2">
              {currentRecommendation.idealPlants.map((plant, index) => (
                <span 
                  key={index}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isDark 
                      ? 'bg-green-900 bg-opacity-20 text-green-300 border border-green-800' 
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {plant}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className={`flex items-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="mr-2">💧</span>
            Watering Tips
          </h3>
          <p className={`mt-1 text-sm ml-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentRecommendation.wateringTips}
          </p>
        </div>
        
        <div>
          <h3 className={`flex items-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className="mr-2">🪴</span>
            Amendments
          </h3>
          <p className={`mt-1 text-sm ml-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentRecommendation.amendments}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlantRecommendationsPanel;