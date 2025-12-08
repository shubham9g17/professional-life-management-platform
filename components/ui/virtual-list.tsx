'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
}

/**
 * Virtual scrolling list component for performance with large lists
 * Only renders visible items plus overscan buffer
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length,
    startIndex + visibleCount + overscan * 2
  )

  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for virtual scrolling with dynamic item heights
 */
export function useVirtualScroll<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  overscan = 3,
}: {
  items: T[]
  estimatedItemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map())

  const measureItem = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const next = new Map(prev)
      next.set(index, height)
      return next
    })
  }, [])

  const getItemHeight = (index: number) => {
    return itemHeights.get(index) ?? estimatedItemHeight
  }

  const getTotalHeight = () => {
    let height = 0
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i)
    }
    return height
  }

  const getStartIndex = () => {
    let height = 0
    let index = 0
    while (height < scrollTop && index < items.length) {
      height += getItemHeight(index)
      index++
    }
    return Math.max(0, index - overscan)
  }

  const getEndIndex = () => {
    const startIndex = getStartIndex()
    let height = 0
    let index = startIndex
    while (height < containerHeight && index < items.length) {
      height += getItemHeight(index)
      index++
    }
    return Math.min(items.length, index + overscan)
  }

  const getOffsetY = () => {
    let height = 0
    const startIndex = getStartIndex()
    for (let i = 0; i < startIndex; i++) {
      height += getItemHeight(i)
    }
    return height
  }

  return {
    scrollTop,
    setScrollTop,
    measureItem,
    startIndex: getStartIndex(),
    endIndex: getEndIndex(),
    offsetY: getOffsetY(),
    totalHeight: getTotalHeight(),
  }
}
