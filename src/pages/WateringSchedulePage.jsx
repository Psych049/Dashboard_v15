import React, { useEffect, useState } from "react";
import { WateringScheduleService } from "../services/wateringScheduleService";
import { format } from "date-fns";

// Use the service for frequency options and conversion
const frequencyOptions = WateringScheduleService.getFrequencyOptions();
const frequencyToCron = WateringScheduleService.frequencyToCron;

const WateringSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [zones, setZones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    zone_id: "",
    name: "",
    frequency: "Daily", // Keep frequency for UI, convert to cron_expression
    duration: 30,
    is_active: true,
  });

  const fetchSchedules = async () => {
    try {
      const data = await WateringScheduleService.fetchWateringSchedules();
      setSchedules(data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setSchedules([]);
    }
  };

  const fetchZones = async () => {
    try {
      const data = await WateringScheduleService.fetchZones();
      setZones(data);
    } catch (err) {
      console.error('Error fetching zones:', err);
    }
  };

  const handleRefresh = () => {
    fetchSchedules();
    fetchZones();
  };

  useEffect(() => {
    fetchSchedules();
    fetchZones();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => {
      const updated = {
        ...f,
        [name]: name === "duration" ? parseInt(value) : value,
      };
      
      // No need to update cron_expression here since we convert it when submitting
      
      return updated;
    });
  };

  const handleSubmit = async () => {
    try {
      // Convert frequency to cron_expression
      const cron_expression = frequencyToCron(formData.frequency);

      const scheduleData = {
        zone_id: formData.zone_id,
        name: formData.name,
        cron_expression: cron_expression,
        duration: formData.duration,
        is_active: formData.is_active,
      };

      await WateringScheduleService.createWateringSchedule(scheduleData);
      
      setShowModal(false);
      setFormData({ 
        zone_id: "", 
        name: "", 
        frequency: "Daily", 
        duration: 30, 
        is_active: true 
      });
      fetchSchedules();
    } catch (err) {
      console.error('Error creating schedule:', err);
      alert('Failed to create watering schedule. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await WateringScheduleService.deleteWateringSchedule(id);
      fetchSchedules();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Failed to delete watering schedule. Please try again.');
    }
  };

  const handleEdit = (schedule) => {
    // Convert cron_expression back to frequency for UI
    let frequency = "Daily";
    if (schedule.cron_expression === "0 7 */2 * *") frequency = "Every 2 days";
    else if (schedule.cron_expression === "0 7 */3 * *") frequency = "Every 3 days";
    else if (schedule.cron_expression === "0 7 * * 0") frequency = "Weekly";
    else if (schedule.cron_expression === "0 7 * * *") frequency = "Daily";

    setFormData({
      id: schedule.id,
      zone_id: schedule.zone_id,
      name: schedule.name,
      frequency: frequency,
      duration: schedule.water_duration,
      is_active: schedule.is_active,
    });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      const { id, frequency, ...updateData } = formData;
      
      // Convert frequency to cron_expression
      const cron_expression = frequencyToCron(frequency);
      
      await WateringScheduleService.updateWateringSchedule(id, {
        ...updateData,
        cron_expression: cron_expression
      });
      
      setShowModal(false);
      setFormData({ 
        zone_id: "", 
        name: "", 
        frequency: "Daily", 
        duration: 30, 
        is_active: true 
      });
      fetchSchedules();
    } catch (err) {
      console.error('Error updating schedule:', err);
      alert('Failed to update watering schedule. Please try again.');
    }
  };

  const toggleScheduleStatus = async (schedule) => {
    try {
      await WateringScheduleService.toggleScheduleStatus(schedule.id, !schedule.is_active);
      fetchSchedules();
    } catch (err) {
      console.error('Error toggling schedule status:', err);
      alert('Failed to update schedule status. Please try again.');
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Watering Schedule</h1>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-lg transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            title="Refresh data"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={zones.length === 0}
          >
            + Add Schedule
          </button>
        </div>
      </div>

      {zones.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200">
            No plant zones available. Please create a plant zone first before adding watering schedules.
          </p>
        </div>
      )}

      <div className="overflow-x-auto shadow bg-white dark:bg-gray-800 rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-gray-700 text-left text-gray-700 dark:text-gray-200">
            <tr>
              <th className="p-3">Zone</th>
              <th className="p-3">Schedule Name</th>
              <th className="p-3">Frequency</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-3 text-gray-800 dark:text-gray-100">
                  {schedule.zones?.name || 'Unknown Zone'}
                </td>
                <td className="p-3 text-gray-800 dark:text-gray-100">
                  {schedule.name}
                </td>
                <td className="p-3 text-gray-800 dark:text-gray-100">
                  {schedule.cron_expression === "0 7 * * *" ? "Daily" :
                   schedule.cron_expression === "0 7 */2 * *" ? "Every 2 days" :
                   schedule.cron_expression === "0 7 */3 * *" ? "Every 3 days" :
                   schedule.cron_expression === "0 7 * * 0" ? "Weekly" :
                   schedule.cron_expression}
                </td>
                <td className="p-3 text-gray-800 dark:text-gray-100">
                  {schedule.water_duration} seconds
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleScheduleStatus(schedule)}
                    className={`px-2 py-1 text-sm rounded-full transition-colors ${
                      schedule.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100 hover:bg-green-200"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {schedule.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3 space-x-2">
                  <button 
                    onClick={() => handleEdit(schedule)} 
                    className="text-green-600 dark:text-green-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(schedule.id)} 
                    className="text-red-600 dark:text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {schedules.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No watering schedules found. Create your first schedule to get started.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              {formData.id ? "Edit Schedule" : "Add Schedule"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plant Zone *
                </label>
                <select
                  name="zone_id"
                  value={formData.zone_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select a zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 dark:text-white"
                  placeholder="e.g., Morning Watering"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency *
                </label>
                <select
                  name="frequency"
                  value={formData.frequency || "Daily"}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 dark:text-white"
                >
                  {frequencyOptions.map((freq) => (
                    <option key={freq} value={freq}>
                      {freq}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (seconds) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-900 dark:text-white"
                  min="1"
                  max="300"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(f => ({ ...f, is_active: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={formData.id ? handleUpdate : handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!formData.zone_id || !formData.name}
              >
                {formData.id ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WateringSchedulePage;
