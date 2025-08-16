# 🌿 FarmFlow Dashboard

A modern, responsive IoT garden monitoring dashboard built with React, Supabase, and Tailwind CSS. Monitor your plants, control watering systems, and analyze sensor data in real-time.

![FarmFlow Dashboard](https://img.shields.io/badge/React-18.2.0-blue?style=flat-square&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-2.52.0-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.0-38B2AC?style=flat-square&logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-7.0.5-646CFF?style=flat-square&logo=vite)

## ✨ Features

### 🌱 **Smart Garden Management**
- **Real-time Sensor Monitoring**: Temperature, humidity, soil moisture, and water usage
- **Plant Zone Management**: Organize plants by zones with custom soil types
- **Automated Watering**: Schedule-based watering with manual override controls
- **Health Alerts**: Get notified about critical conditions and system updates

### 📊 **Advanced Analytics**
- **Interactive Charts**: Real-time data visualization with Recharts
- **Historical Analysis**: Track trends and patterns over time
- **Performance Metrics**: Monitor system efficiency and water usage
- **Export Capabilities**: Download data for external analysis

### 🎨 **Modern UI/UX**
- **Dark/Light Theme**: Seamless theme switching with system preference detection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Smooth Animations**: Enhanced user experience with micro-interactions

### 🔧 **System Management**
- **ESP32 Integration**: Direct communication with IoT sensors
- **Device Management**: Monitor and configure multiple sensors
- **System Status**: Real-time health monitoring and diagnostics
- **Configuration Tools**: Easy setup and maintenance

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Project_Dashboard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the schema from `supabase/schema.sql` in your Supabase SQL editor
   - Copy your Supabase URL and anon key

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   pnpm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
Project_Dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── charts/         # Data visualization components
│   │   ├── layout/         # Layout components
│   │   └── ...
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── data/              # Mock data and utilities
│   ├── lib/               # External library configurations
│   ├── pages/             # Page components
│   ├── services/          # API and data services
│   └── ...
├── supabase/
│   ├── functions/         # Edge functions
│   └── schema.sql         # Database schema
└── ...
```

## 🔧 Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build

## 🌐 Pages & Features

### Dashboard (`/dashboard`)
- **Overview**: Garden health summary with key metrics
- **Real-time Data**: Live sensor readings and status
- **Weather Integration**: Current weather conditions
- **Quick Actions**: Fast access to common tasks
- **Auto-refresh**: Data updates every 30 seconds

### Plants (`/plants`)
- **Zone Management**: Create and organize plant zones
- **Soil Analysis**: Track soil types and conditions
- **Plant Recommendations**: AI-powered suggestions
- **Health Monitoring**: Visual indicators for plant status

### Watering Schedule (`/schedule`)
- **Automated Scheduling**: Time-based watering plans
- **Zone-specific Controls**: Individual zone management
- **Manual Override**: Emergency watering controls
- **Schedule History**: Track past watering events

### Sensors (`/sensors`)
- **Device Configuration**: Setup and manage ESP32 devices
- **Data Visualization**: Real-time sensor readings
- **Calibration Tools**: Sensor accuracy optimization
- **Health Status**: Device connectivity and performance

### Analytics (`/analytics`)
- **Historical Data**: Long-term trend analysis
- **Performance Metrics**: System efficiency tracking
- **Custom Reports**: Generate specific data reports
- **Export Options**: Download data in multiple formats

### System (`/system`)
- **Status Monitoring**: Real-time system health
- **Configuration**: System settings and preferences
- **Maintenance Tools**: Diagnostic and repair utilities
- **System Logs**: Detailed activity and error logs

### Settings (`/settings`)
- **User Preferences**: Personalization options
- **Theme Customization**: Dark/light mode settings
- **API Key Management**: Secure credential storage
- **Account Settings**: Profile and security management

## 🔌 API Integration

The dashboard integrates with ESP32 sensors through Supabase Edge Functions:

- **ESP32 Data Function**: Receives sensor data from ESP32 devices
- **Simulate Sensor Data**: Generates mock data for testing
- **Command System**: Sends commands to ESP32 devices
- **Real-time Updates**: Live data synchronization

### Sensor Data Format
```json
{
  "zone_id": "uuid",
  "temperature": 24.5,
  "humidity": 65.2,
  "soil_moisture": 78.9,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🎨 UI/UX Improvements

### Enhanced Design System
- **Custom Color Palette**: Extended green, blue, orange, and purple scales
- **Improved Typography**: Better font hierarchy and readability
- **Consistent Spacing**: Standardized spacing system
- **Modern Shadows**: Soft shadows for depth and elevation

### Accessibility Features
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG AA compliant color ratios

### Performance Optimizations
- **Code Splitting**: Automatic chunk optimization
- **Lazy Loading**: Component-level code splitting
- **Bundle Optimization**: Reduced bundle sizes
- **Caching Strategies**: Efficient data caching

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Enhanced tablet experience
- **Desktop Optimization**: Full-featured desktop interface
- **Touch-Friendly**: Optimized touch interactions

## 🔒 Security Features

- **Authentication**: Secure user authentication with Supabase
- **Environment Variables**: Secure credential management
- **Input Validation**: Client and server-side validation
- **Error Handling**: Graceful error management

## 🚀 Deployment

### Production Build
```bash
pnpm run build
```

### Environment Setup
Ensure all environment variables are configured in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Recommended Hosting
- **Vercel**: Optimized for React applications
- **Netlify**: Easy deployment with Git integration
- **AWS S3 + CloudFront**: Scalable static hosting
- **Supabase Hosting**: Integrated hosting solution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the backend infrastructure
- **Tailwind CSS** for the utility-first CSS framework
- **React** for the component library
- **Recharts** for data visualization
- **React Icons** for the icon library

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the troubleshooting guide

---

**Built with ❤️ for smart gardening** 
#   D a s h b o a r d _ v 1 5  
 #   D a s h b o a r d _ v 1 5  
 