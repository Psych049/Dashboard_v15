import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (componentName) => {
  const startTime = useRef(performance.now());
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const endTime = performance.now();
    const loadTime = endTime - startTime.current;

    // Log performance metrics
    console.log(`${componentName} render time: ${loadTime.toFixed(2)}ms`);

    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', 'component_render', {
        component_name: componentName,
        render_time: loadTime,
        timestamp: new Date().toISOString()
      });
    }

    // Reset timer for next render
    startTime.current = performance.now();
  });

  // Monitor memory usage in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      console.log(`${componentName} memory usage:`, {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
      });
    }
  }, [componentName]);

  return {
    startTimer: () => {
      startTime.current = performance.now();
    },
    endTimer: () => {
      const endTime = performance.now();
      return endTime - startTime.current;
    }
  };
}; 