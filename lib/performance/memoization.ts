import { useMemo, useCallback, useRef } from 'react'

/**
 * Memoize expensive calculations with custom equality check
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (a: T, b: T) => boolean
): T {
  const valueRef = useRef<T | undefined>(undefined)
  const depsRef = useRef<React.DependencyList | undefined>(undefined)

  const shouldUpdate =
    !depsRef.current ||
    depsRef.current.length !== deps.length ||
    depsRef.current.some((dep, i) => !Object.is(dep, deps[i]))

  if (shouldUpdate) {
    const newValue = factory()
    if (!valueRef.current || !isEqual || !isEqual(valueRef.current, newValue)) {
      valueRef.current = newValue
    }
    depsRef.current = deps
  }

  return valueRef.current as T
}

/**
 * Memoize async functions with caching
 */
export function createMemoizedAsync<Args extends any[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: {
    maxCacheSize?: number
    ttl?: number // milliseconds
    keyGenerator?: (...args: Args) => string
  } = {}
) {
  const {
    maxCacheSize = 100,
    ttl = 5 * 60 * 1000, // 5 minutes default
    keyGenerator = (...args) => JSON.stringify(args),
  } = options

  const cache = new Map<
    string,
    { value: Promise<Result>; timestamp: number }
  >()

  return async (...args: Args): Promise<Result> => {
    const key = keyGenerator(...args)
    const now = Date.now()

    // Check if cached value exists and is not expired
    const cached = cache.get(key)
    if (cached && now - cached.timestamp < ttl) {
      return cached.value
    }

    // Execute function and cache result
    const promise = fn(...args)
    cache.set(key, { value: promise, timestamp: now })

    // Cleanup old entries if cache is too large
    if (cache.size > maxCacheSize) {
      const entries = Array.from(cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = entries.slice(0, cache.size - maxCacheSize)
      toDelete.forEach(([key]) => cache.delete(key))
    }

    return promise
  }
}

/**
 * Debounce expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * Throttle expensive operations
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRunRef.current

      if (timeSinceLastRun >= delay) {
        callback(...args)
        lastRunRef.current = now
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(
          () => {
            callback(...args)
            lastRunRef.current = Date.now()
          },
          delay - timeSinceLastRun
        )
      }
    },
    [callback, delay]
  )
}

/**
 * Memoize object/array values to prevent unnecessary re-renders
 */
export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value)

  if (!deepEqual(ref.current, value)) {
    ref.current = value
  }

  return ref.current
}

/**
 * Deep equality check for objects and arrays
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(a[key], b[key])) return false
  }

  return true
}

/**
 * Memoize expensive selector functions
 */
export function createSelector<State, Result>(
  selector: (state: State) => Result,
  isEqual: (a: Result, b: Result) => boolean = Object.is
) {
  let lastState: State | undefined
  let lastResult: Result | undefined

  return (state: State): Result => {
    if (lastState !== state) {
      const newResult = selector(state)
      if (!lastResult || !isEqual(lastResult, newResult)) {
        lastResult = newResult
      }
      lastState = state
    }
    return lastResult as Result
  }
}

/**
 * Batch multiple state updates to reduce re-renders
 */
export function useBatchedUpdates() {
  const pendingUpdatesRef = useRef<(() => void)[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const batchUpdate = useCallback((update: () => void) => {
    pendingUpdatesRef.current.push(update)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      const updates = pendingUpdatesRef.current
      pendingUpdatesRef.current = []
      updates.forEach(update => update())
    }, 0)
  }, [])

  return batchUpdate
}
