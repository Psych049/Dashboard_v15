import { supabase } from '../lib/supabase';

// Analytics Service for advanced data analysis and insights
export class AnalyticsService {
  
  // Get analytics data for a specific time period
  static async getAnalyticsData(period = 'month') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const endDate = new Date();
      const startDate = this.getStartDate(period);
      
      // Get sensor data for the period
      const { data: sensorData, error: sensorError } = await supabase
        .rpc('get_sensor_data_for_charts', { p_user_id: user.id, p_hours: 24 * 30 });

      if (sensorError) throw sensorError;

      // Get zones data
      const { data: zones, error: zonesError } = await supabase
        .from('zones')
        .select('*')
        .eq('user_id', user.id);

      if (zonesError) throw zonesError;

      // Get watering controls data
      const { data: wateringControls, error: wateringError } = await supabase
        .from('watering_controls')
        .select('*');

      if (wateringError) throw wateringError;

      // Get commands data for water usage analysis
      const { data: commands, error: commandsError } = await supabase
        .from('device_commands')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (commandsError) throw commandsError;

      return {
        sensorData: sensorData || [],
        zones: zones || [],
        wateringControls: wateringControls || [],
        commands: commands || [],
        period,
        startDate,
        endDate
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  // Calculate water usage by zone
  static calculateWaterUsageByZone(commands, zones, period) {
    const waterUsage = {};
    
    // Initialize zones
    zones.forEach(zone => {
      waterUsage[zone.name] = {
        name: zone.name,
        usage: 0,
        sessions: 0,
        avgDuration: 0
      };
    });

    // Calculate from pump commands
    const pumpCommands = commands.filter(cmd => cmd.command_type === 'water');
    
    pumpCommands.forEach(cmd => {
      const duration = cmd.parameters?.duration || 30; // seconds
      const waterPerSecond = 0.5; // liters per second (adjust based on your pump)
      const waterUsed = (duration * waterPerSecond);
      
      // Find zone by device (simplified - you might need to enhance this mapping)
      const zone = zones.find(z => z.id === cmd.device_id);
      if (zone) {
        waterUsage[zone.name].usage += waterUsed;
        waterUsage[zone.name].sessions += 1;
        waterUsage[zone.name].avgDuration = 
          (waterUsage[zone.name].avgDuration + duration) / 2;
      }
    });

    return Object.values(waterUsage);
  }

  // Calculate water savings
  static calculateWaterSavings(commands, period) {
    const monthlyData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Calculate for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthCommands = commands.filter(cmd => {
        const cmdDate = new Date(cmd.created_at);
        return cmdDate >= monthStart && cmdDate <= monthEnd;
      });

      const pumpCommands = monthCommands.filter(cmd => cmd.command_type === 'pump_on');
      const totalWaterUsed = pumpCommands.reduce((sum, cmd) => {
        const duration = cmd.parameters?.duration || 30;
        return sum + (duration * 0.5); // 0.5L per second
      }, 0);

      // Estimate regular usage (without smart system)
      const estimatedRegularUsage = totalWaterUsed * 1.3; // 30% more without smart system
      const waterSaved = estimatedRegularUsage - totalWaterUsed;

      monthlyData.push({
        month: months[date.getMonth()],
        saved: Math.round(waterSaved * 10) / 10,
        regular: Math.round(estimatedRegularUsage * 10) / 10
      });
    }

    return monthlyData;
  }

  // Calculate moisture level distribution
  static calculateMoistureDistribution(sensorData) {
    const moistureLevels = sensorData.map(data => data.soil_moisture);
    
    let optimal = 0;
    let slightlyDry = 0;
    let tooDry = 0;
    let tooWet = 0;

    moistureLevels.forEach(level => {
      if (level >= 40 && level <= 60) optimal++;
      else if (level >= 30 && level < 40) slightlyDry++;
      else if (level < 30) tooDry++;
      else if (level > 60) tooWet++;
    });

    const total = moistureLevels.length;
    
    return [
      { name: 'Optimal', value: total > 0 ? Math.round((optimal / total) * 100) : 0, color: '#22c55e' },
      { name: 'Slightly Dry', value: total > 0 ? Math.round((slightlyDry / total) * 100) : 0, color: '#eab308' },
      { name: 'Too Dry', value: total > 0 ? Math.round((tooDry / total) * 100) : 0, color: '#ef4444' },
      { name: 'Too Wet', value: total > 0 ? Math.round((tooWet / total) * 100) : 0, color: '#3b82f6' }
    ].filter(item => item.value > 0);
  }

  // Calculate plant health scores
  static calculatePlantHealthScores(sensorData, zones) {
    const healthScores = [];
    
    zones.forEach(zone => {
      const zoneData = sensorData.filter(data => data.zone_id === zone.id);
      
      if (zoneData.length === 0) {
        healthScores.push({
          zone: zone.name,
          score: 0,
          dataPoints: 0
        });
        return;
      }

      // Calculate health score based on multiple factors
      const avgMoisture = zoneData.reduce((sum, data) => sum + data.soil_moisture, 0) / zoneData.length;
      const avgTemperature = zoneData.reduce((sum, data) => sum + data.temperature, 0) / zoneData.length;
      const avgHumidity = zoneData.reduce((sum, data) => sum + data.humidity, 0) / zoneData.length;
      
      // Moisture score (0-40 points)
      let moistureScore = 0;
      if (avgMoisture >= 40 && avgMoisture <= 60) moistureScore = 40;
      else if (avgMoisture >= 30 && avgMoisture < 40) moistureScore = 30;
      else if (avgMoisture >= 25 && avgMoisture < 30) moistureScore = 20;
      else if (avgMoisture < 25) moistureScore = 10;
      else moistureScore = 25; // Too wet

      // Temperature score (0-30 points)
      let tempScore = 0;
      if (avgTemperature >= 18 && avgTemperature <= 26) tempScore = 30;
      else if (avgTemperature >= 15 && avgTemperature < 18) tempScore = 25;
      else if (avgTemperature >= 26 && avgTemperature <= 30) tempScore = 20;
      else tempScore = 15;

      // Humidity score (0-30 points)
      let humidityScore = 0;
      if (avgHumidity >= 40 && avgHumidity <= 70) humidityScore = 30;
      else if (avgHumidity >= 30 && avgHumidity < 40) humidityScore = 25;
      else if (avgHumidity >= 70 && avgHumidity <= 80) humidityScore = 20;
      else humidityScore = 15;

      const totalScore = moistureScore + tempScore + humidityScore;
      
      healthScores.push({
        zone: zone.name,
        score: Math.round(totalScore),
        dataPoints: zoneData.length,
        avgMoisture: Math.round(avgMoisture * 10) / 10,
        avgTemperature: Math.round(avgTemperature * 10) / 10,
        avgHumidity: Math.round(avgHumidity * 10) / 10
      });
    });

    return healthScores;
  }

  // Generate ML insights
  static generateInsights(sensorData, zones, commands) {
    const insights = [];

    // Analyze watering patterns
    const pumpCommands = commands.filter(cmd => cmd.command_type === 'pump_on');
    if (pumpCommands.length > 0) {
      const wateringTimes = pumpCommands.map(cmd => new Date(cmd.created_at).getHours());
      const morningWatering = wateringTimes.filter(hour => hour >= 5 && hour <= 9).length;
      const afternoonWatering = wateringTimes.filter(hour => hour >= 12 && hour <= 16).length;
      const eveningWatering = wateringTimes.filter(hour => hour >= 18 && hour <= 22).length;

      if (morningWatering > afternoonWatering && morningWatering > eveningWatering) {
        insights.push({
          id: 1,
          title: 'Optimal Watering Time',
          description: 'Your morning watering schedule (5-9 AM) is optimal for plant health and water efficiency',
          icon: '⏰',
          type: 'positive'
        });
      } else {
        insights.push({
          id: 1,
          title: 'Watering Time Optimization',
          description: 'Consider watering in early morning (5-7 AM) to reduce evaporation and maximize efficiency',
          icon: '⏰',
          type: 'recommendation'
        });
      }
    }

    // Analyze moisture patterns
    const avgMoisture = sensorData.reduce((sum, data) => sum + data.soil_moisture, 0) / sensorData.length;
    if (avgMoisture < 30) {
      insights.push({
        id: 2,
        title: 'Low Moisture Alert',
        description: 'Average soil moisture is below optimal levels. Consider adjusting watering frequency or duration',
        icon: '💧',
        type: 'warning'
      });
    } else if (avgMoisture > 60) {
      insights.push({
        id: 2,
        title: 'Overwatering Detected',
        description: 'Soil moisture levels are high. Consider reducing watering frequency to prevent root rot',
        icon: '💧',
        type: 'warning'
      });
    }

    // Analyze temperature patterns
    const avgTemperature = sensorData.reduce((sum, data) => sum + data.temperature, 0) / sensorData.length;
    if (avgTemperature > 30) {
      insights.push({
        id: 3,
        title: 'High Temperature Alert',
        description: 'Average temperature is above optimal range. Consider providing shade or increasing watering',
        icon: '🌡️',
        type: 'warning'
      });
    }

    // Zone-specific insights
    zones.forEach(zone => {
      const zoneData = sensorData.filter(data => data.zone_id === zone.id);
      if (zoneData.length > 0) {
        const zoneAvgMoisture = zoneData.reduce((sum, data) => sum + data.soil_moisture, 0) / zoneData.length;
        
        if (zoneAvgMoisture < 25) {
          insights.push({
            id: insights.length + 1,
            title: `${zone.name} Needs Attention`,
            description: `${zone.name} has consistently low moisture levels. Check sensor placement and watering system`,
            icon: '🌱',
            type: 'warning'
          });
        }
      }
    });

    // Water efficiency insight
    const totalWaterUsed = pumpCommands.reduce((sum, cmd) => {
      const duration = cmd.parameters?.duration || 30;
      return sum + (duration * 0.5);
    }, 0);

    if (totalWaterUsed > 0) {
      const efficiency = this.calculateWaterEfficiency(sensorData, totalWaterUsed);
      if (efficiency > 0.8) {
        insights.push({
          id: insights.length + 1,
          title: 'Excellent Water Efficiency',
          description: `Your system is ${Math.round(efficiency * 100)}% efficient. Great job optimizing water usage!`,
          icon: '🏆',
          type: 'positive'
        });
      }
    }

    return insights.slice(0, 6); // Limit to 6 insights
  }

  // Calculate water efficiency
  static calculateWaterEfficiency(sensorData, totalWaterUsed) {
    if (sensorData.length === 0 || totalWaterUsed === 0) return 0;
    
    const optimalReadings = sensorData.filter(data => 
      data.soil_moisture >= 40 && data.soil_moisture <= 60
    ).length;
    
    return optimalReadings / sensorData.length;
  }

  // Get performance metrics
  static async getPerformanceMetrics(period = 'month') {
    try {
      const data = await this.getAnalyticsData(period);
      
      const waterUsageByZone = this.calculateWaterUsageByZone(data.commands, data.zones, period);
      const waterSavings = this.calculateWaterSavings(data.commands, period);
      const moistureDistribution = this.calculateMoistureDistribution(data.sensorData);
      const healthScores = this.calculatePlantHealthScores(data.sensorData, data.zones);
      const insights = this.generateInsights(data.sensorData, data.zones, data.commands);

      // Calculate summary metrics
      const totalWaterUsage = waterUsageByZone.reduce((sum, zone) => sum + zone.usage, 0);
      const totalWaterSaved = waterSavings.reduce((sum, month) => sum + month.saved, 0);
      const avgMoisture = data.sensorData.length > 0 
        ? data.sensorData.reduce((sum, data) => sum + data.soil_moisture, 0) / data.sensorData.length 
        : 0;
      const avgHealthScore = healthScores.length > 0 
        ? healthScores.reduce((sum, zone) => sum + zone.score, 0) / healthScores.length 
        : 0;

      return {
        summary: {
          totalWaterUsage: Math.round(totalWaterUsage * 10) / 10,
          totalWaterSaved: Math.round(totalWaterSaved * 10) / 10,
          avgMoisture: Math.round(avgMoisture * 10) / 10,
          avgHealthScore: Math.round(avgHealthScore),
          dataPoints: data.sensorData.length,
          zones: data.zones.length
        },
        waterUsageByZone,
        waterSavings,
        moistureDistribution,
        healthScores,
        insights,
        period
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      throw error;
    }
  }

  // Helper function to get start date based on period
  static getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Get trend data for charts
  static async getTrendData(period = 'month') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const endDate = new Date();
      const startDate = this.getStartDate(period);
      
      const { data: sensorData, error } = await supabase
        .rpc('get_sensor_data_for_charts', { p_user_id: user.id, p_hours: 24 * 30 });

      if (error) throw error;

      // Group data by day/hour based on period
      const groupedData = this.groupDataByTime(sensorData, period);
      
      return groupedData;
    } catch (error) {
      console.error('Error fetching trend data:', error);
      throw error;
    }
  }

  // Group sensor data by time intervals
  static groupDataByTime(sensorData, period) {
    const grouped = {};
    
    sensorData.forEach(data => {
      const date = new Date(data.reading_timestamp || data.time || data.timestamp);
      let key;
      
      if (period === 'week') {
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (period === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short' });
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          temperature: [],
          humidity: [],
          soil_moisture: []
        };
      }
      
      grouped[key].temperature.push(data.temperature);
      grouped[key].humidity.push(data.humidity);
      grouped[key].soil_moisture.push(data.soil_moisture);
    });

    // Calculate averages
    return Object.entries(grouped).map(([key, values]) => ({
      time: key,
      temperature: Math.round(values.temperature.reduce((a, b) => a + b, 0) / values.temperature.length * 10) / 10,
      humidity: Math.round(values.humidity.reduce((a, b) => a + b, 0) / values.humidity.length * 10) / 10,
      soil_moisture: Math.round(values.soil_moisture.reduce((a, b) => a + b, 0) / values.soil_moisture.length * 10) / 10
    }));
  }
}

export default AnalyticsService; 