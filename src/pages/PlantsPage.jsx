import React, { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';

const PlantsPage = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    soil_type: 'Loamy',
    moisture_threshold: 30,
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      console.error('Error loading zones:', err);
      setError('Failed to load plant zones. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadZones();
  };

  const handleAddZone = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.user) {
      setError('User not logged in');
      return;
    }
    const user = currentUser.user;

    if (!newZone.name.trim()) {
      setError('Zone name is required');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('zones')
        .insert([
          {
            user_id: user.id,
            name: newZone.name,
            description: newZone.description,
            soil_type: newZone.soil_type,
            moisture_threshold: newZone.moisture_threshold,
            pump_on: false, // Initialize pump_on status
          },
        ])
        .select();

      if (error) throw error;
      setZones((prev) => [...prev, ...data]);
      setNewZone({
        name: '',
        description: '',
        soil_type: 'Loamy',
        moisture_threshold: 30,
      });
    } catch (err) {
      console.error('Add zone failed:', err.message);
      setError('Failed to add plant zone.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteZone = async (id) => {
    try {
      const { error } = await supabase.from('zones').delete().eq('id', id);
      if (error) throw error;
      setZones((prev) => prev.filter((z) => z.id !== id));
    } catch (err) {
      console.error('Delete failed:', err.message);
      setError('Failed to delete zone.');
    }
  };

  const handleTogglePump = async (zoneId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('zones')
        .update({ pump_on: !currentStatus })
        .eq('id', zoneId);

      if (error) throw error;
      setZones((prevZones) =>
        prevZones.map((zone) =>
          zone.id === zoneId ? { ...zone, pump_on: !currentStatus } : zone
        )
      );
    } catch (err) {
      console.error('Pump toggle failed:', err);
      setError('Could not update pump status.');
    }
  };

  return (
    <div className="p-6 space-y-6 text-gray-800 dark:text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Plant Zones</h1>
        <button 
          onClick={handleRefresh}
          className="p-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          title="Refresh zones"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-800 border-l-4 border-red-500 text-red-700 dark:text-white rounded">
          {error}
        </div>
      )}

      {/* Add Zone Form */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Add Plant Zone</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Zone Name</label>
            <input
              className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 dark:text-white"
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              placeholder="Enter zone name"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <input
              className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 dark:text-white"
              value={newZone.description}
              onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
              placeholder="Enter description"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Soil Type</label>
            <select
              className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 dark:text-white"
              value={newZone.soil_type}
              onChange={(e) => setNewZone({ ...newZone, soil_type: e.target.value })}
            >
              <option value="Loamy">Loamy</option>
              <option value="Sandy">Sandy</option>
              <option value="Clay">Clay</option>
              <option value="Silty">Silty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Moisture Threshold (%)</label>
            <input
              type="number"
              className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 dark:text-white"
              value={newZone.moisture_threshold}
              onChange={(e) =>
                setNewZone({
                  ...newZone,
                  moisture_threshold: e.target.value ? parseInt(e.target.value) : 0,
                })
              }
              placeholder="Enter moisture threshold"
            />
          </div>
        </div>
        <button
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleAddZone}
          disabled={adding}
        >
          {adding ? 'Adding...' : 'Add Zone'}
        </button>
      </div>

      {/* Zones Grid */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-5xl mb-4">🪴</div>
          <p className="text-gray-600 dark:text-gray-400">No zones added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-3"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{zone.name}</h3>
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
                  {zone.soil_type}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {zone.description || 'No description'}
              </p>
              <div>
                <div className="text-xs mb-1">Moisture Threshold</div>
                <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full">
                  <div
                    className={`h-full rounded-full ${
                      zone.moisture_threshold < 30
                        ? 'bg-red-500'
                        : zone.moisture_threshold < 40
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${zone.moisture_threshold}%` }}
                  ></div>
                </div>
                <div className="text-xs text-right mt-1">{zone.moisture_threshold}%</div>
              </div>
              <div className="mt-2">
                {zone.pump_on ? (
                  <span className="text-green-500 text-sm font-bold">🚿 Pump is ON</span>
                ) : (
                  <span className="text-gray-500 text-sm font-semibold">Pump is OFF</span>
                )}
              </div>
              <div className="flex justify-between items-center gap-2">
                <button
                  className="text-sm text-red-600 hover:text-red-800"
                  onClick={() => handleDeleteZone(zone.id)}
                >
                  Delete
                </button>
                <button
                  className={`text-sm px-3 py-1 rounded font-medium ${
                    zone.pump_on
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  onClick={() => handleTogglePump(zone.id, zone.pump_on)}
                >
                  {zone.pump_on ? 'Turn Off Pump' : 'Turn On Pump'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlantsPage;