/**
 * Variable Resolver - Implements the $ variable reference pattern
 * 
 * Usage:
 *   BEFORE: function(circles: Circle[]) // 5000 tokens
 *   AFTER:  function('$circles')        // 5 tokens
 * 
 * Token Savings: ~99% for large data structures
 */

export class VariableResolver {
  public registry = new Map<string, any>(); // Changed from private to public
  private computedCache = new Map<string, { value: any; timestamp: number }>();
  private readonly CACHE_TTL = 100; // ms
  
  /**
   * Register a value with a variable name
   * @param name Variable name (without $)
   * @param value The actual data
   */
  register(name: string, value: any): void {
    this.registry.set(name, value);
    // Clear computed cache for this variable
    this.clearComputedCache(name);
  }
  
  /**
   * Bulk register multiple variables
   */
  registerAll(vars: Record<string, any>): void {
    for (const [name, value] of Object.entries(vars)) {
      this.register(name, value);
    }
  }
  
  /**
   * Resolve a $ variable reference
   * Supports nested access: $circles.0.x
   */
  resolve(ref: string): any {
    // Not a variable reference
    if (!ref.startsWith('$')) {
      return ref;
    }
    
    const varPath = ref.slice(1); // Remove $
    const parts = varPath.split('.');
    const varName = parts[0];
    
    // Get root value
    let value = this.registry.get(varName);
    
    if (value === undefined) {
      console.warn(`Variable $${varName} not found in registry`);
      return undefined;
    }
    
    // Navigate nested path
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      
      // Array index
      if (!isNaN(Number(part))) {
        value = value?.[Number(part)];
      } else {
        value = value?.[part];
      }
      
      if (value === undefined) {
        console.warn(`Path $${varPath} resolved to undefined at "${part}"`);
        return undefined;
      }
    }
    
    return value;
  }
  
  /**
   * Resolve all $ references in an arguments object
   * Deep resolution for nested objects
   */
  resolveArgs<T extends Record<string, any>>(args: T): T {
    const resolved: any = {};
    
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        // Variable reference
        resolved[key] = this.resolve(value);
      } else if (Array.isArray(value)) {
        // Recursively resolve array elements
        resolved[key] = value.map(item => 
          typeof item === 'object' && item !== null
            ? this.resolveArgs(item)
            : typeof item === 'string' && item.startsWith('$')
            ? this.resolve(item)
            : item
        );
      } else if (typeof value === 'object' && value !== null) {
        // Recursively resolve nested objects
        resolved[key] = this.resolveArgs(value);
      } else {
        // Primitive value
        resolved[key] = value;
      }
    }
    
    return resolved;
  }
  
  /**
   * Register a computed value (lazy evaluation)
   * Value is computed on first access and cached
   */
  registerComputed(name: string, computer: () => any): void {
    // Store the computer function
    this.registry.set(`__computed_${name}`, computer);
  }
  
  /**
   * Get a computed value (with caching)
   */
  getComputed(name: string): any {
    const cached = this.computedCache.get(name);
    const now = Date.now();
    
    // Return cached if still valid
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.value;
    }
    
    // Compute new value
    const computer = this.registry.get(`__computed_${name}`);
    if (!computer) {
      console.warn(`Computed variable $${name} not found`);
      return undefined;
    }
    
    const value = computer();
    this.computedCache.set(name, { value, timestamp: now });
    return value;
  }
  
  /**
   * Clear computed cache (call when dependencies change)
   */
  clearComputedCache(varName?: string): void {
    if (varName) {
      // Clear specific variable's computed values
      for (const key of this.computedCache.keys()) {
        if (key.startsWith(varName)) {
          this.computedCache.delete(key);
        }
      }
    } else {
      // Clear all
      this.computedCache.clear();
    }
  }
  
  /**
   * Check if a variable exists
   */
  has(name: string): boolean {
    return this.registry.has(name);
  }
  
  /**
   * Remove a variable
   */
  unregister(name: string): void {
    this.registry.delete(name);
    this.clearComputedCache(name);
  }
  
  /**
   * Get all registered variable names
   */
  getVariableNames(): string[] {
    return Array.from(this.registry.keys())
      .filter(k => !k.startsWith('__computed_'));
  }
  
  /**
   * Clear all variables
   */
  clear(): void {
    this.registry.clear();
    this.computedCache.clear();
  }
  
  /**
   * Get memory usage stats
   */
  getStats(): { 
    variables: number; 
    computed: number; 
    cacheSize: number;
  } {
    return {
      variables: this.registry.size,
      computed: Array.from(this.registry.keys()).filter(k => k.startsWith('__computed_')).length,
      cacheSize: this.computedCache.size,
    };
  }
}

// Global instance
export const variableResolver = new VariableResolver();

// React hook for using the resolver
import { useEffect, useCallback } from 'react';

export function useVariableResolver() {
  const register = useCallback((name: string, value: any) => {
    variableResolver.register(name, value);
  }, []);
  
  const registerAll = useCallback((vars: Record<string, any>) => {
    variableResolver.registerAll(vars);
  }, []);
  
  const resolve = useCallback((ref: string) => {
    return variableResolver.resolve(ref);
  }, []);
  
  const resolveArgs = useCallback(<T extends Record<string, any>>(args: T): T => {
    return variableResolver.resolveArgs(args);
  }, []);
  
  return {
    register,
    registerAll,
    resolve,
    resolveArgs,
    resolver: variableResolver,
    $get: (name: string) => {
      // Direct registry access without $ prefix requirement
      // This is more intuitive: $get('circles') instead of $get('$circles')
      return variableResolver.registry.get(name);
    },
    $set: (name: string, value: any) => variableResolver.register(name, value),
  };
}

/**
 * Example usage:
 * 
 * // Register data
 * variableResolver.register('circles', myCircles);
 * variableResolver.register('layers', myLayers);
 * 
 * // Instead of:
 * exportAnimation({
 *   circles: myCircles.map(c => ({...c})), // 5000 tokens
 *   layers: myLayers.map(l => ({...l}))    // 2000 tokens
 * });
 * 
 * // Do this:
 * exportAnimation({
 *   circles: '$circles',  // 2 tokens
 *   layers: '$layers'     // 2 tokens
 * });
 * 
 * // Inside exportAnimation:
 * function exportAnimation(args: any) {
 *   const resolved = variableResolver.resolveArgs(args);
 *   // resolved.circles = actual array
 *   // resolved.layers = actual array
 * }
 */
