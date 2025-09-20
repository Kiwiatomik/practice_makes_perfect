import { trace } from 'firebase/performance';
import { performance } from '../config/firebase';

class PerformanceService {
  private isEnabled = () => {
    return performance && typeof window !== 'undefined';
  };

  // Measure page load times
  startTrace(traceName: string) {
    if (!this.isEnabled()) {
      console.log(`Performance (disabled): Starting trace ${traceName}`);
      return null;
    }

    try {
      const performanceTrace = trace(performance, traceName);
      performanceTrace.start();
      return performanceTrace;
    } catch (error) {
      console.error(`Failed to start performance trace ${traceName}:`, error);
      return null;
    }
  }

  stopTrace(performanceTrace: any) {
    if (!performanceTrace) return;

    try {
      performanceTrace.stop();
    } catch (error) {
      console.error('Failed to stop performance trace:', error);
    }
  }

  // Add custom metrics to traces
  addMetric(performanceTrace: any, metricName: string, value: number) {
    if (!performanceTrace) return;

    try {
      performanceTrace.putMetric(metricName, value);
    } catch (error) {
      console.error(`Failed to add metric ${metricName}:`, error);
    }
  }

  // Add custom attributes to traces
  addAttribute(performanceTrace: any, attributeName: string, value: string) {
    if (!performanceTrace) return;

    try {
      performanceTrace.putAttribute(attributeName, value);
    } catch (error) {
      console.error(`Failed to add attribute ${attributeName}:`, error);
    }
  }

  // Convenience methods for common traces
  measureApiCall(apiName: string) {
    return this.startTrace(`api_call_${apiName}`);
  }

  measurePageLoad(pageName: string) {
    return this.startTrace(`page_load_${pageName}`);
  }

  measureComponentRender(componentName: string) {
    return this.startTrace(`component_render_${componentName}`);
  }

  measureAIOperation(operationType: 'generate_question' | 'generate_solution') {
    return this.startTrace(`ai_operation_${operationType}`);
  }

  measureDatabaseOperation(operationType: 'read' | 'write' | 'query') {
    return this.startTrace(`database_${operationType}`);
  }

  // Measure and track custom timing
  measureCustomTiming(name: string, startTime: number) {
    const endTime = performance?.now ? performance.now() : Date.now();
    const duration = endTime - startTime;

    console.log(`Custom timing - ${name}: ${duration}ms`);

    // You could also send this to analytics
    return duration;
  }
}

export default new PerformanceService();