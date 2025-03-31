"use client"

import React, { createContext, useState, useContext, useCallback, useRef, useEffect, ReactElement } from "react"

// Types
type PulloutDirection = "left" | "right"

interface PulloutContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  width: number
  setWidth: (width: number) => void
  minWidth: number
  maxWidth: number
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
  direction: PulloutDirection
}

// Context
const PulloutContext = createContext<PulloutContextType | undefined>(undefined)

// Hook
export function usePullout() {
  const context = useContext(PulloutContext)
  if (!context) {
    throw new Error("usePullout must be used within a Pullout component")
  }
  return context
}

// Root component
interface PulloutProps {
  children: React.ReactNode
  direction?: PulloutDirection
  defaultOpen?: boolean
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
}

export function Pullout({
  children,
  direction = "right",
  defaultOpen = false,
  minWidth = 200,
  maxWidth = 500,
  defaultWidth = 400,
}: PulloutProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isDragging, setIsDragging] = useState(false)
  const [width, setWidth] = useState(defaultWidth)
  
  return (
    <PulloutContext.Provider
      value={{
        isOpen,
        setIsOpen,
        width,
        setWidth,
        minWidth,
        maxWidth,
        isDragging,
        setIsDragging,
        direction,
      }}
    >
      <div className="h-screen w-screen flex">
        {children}
      </div>
    </PulloutContext.Provider>
  )
}

// Main content
interface PulloutMainProps {
  children: React.ReactNode
  className?: string
}

export function PulloutMain({ children, className = "" }: PulloutMainProps) {
  return (
    <div className={`h-full grow ${className}`}>
      {children}
    </div>
  )
}

// Trigger button
interface PulloutTriggerProps {
  children?: React.ReactNode | ((state: { isOpen: boolean }) => React.ReactNode)
  className?: string
  asChild?: boolean
}

export function PulloutTrigger({ children, className = "", asChild = false }: PulloutTriggerProps) {
  const { isOpen, setIsOpen } = usePullout()
  
  const toggleOpen = useCallback(() => {
    setIsOpen(!isOpen)
  }, [isOpen, setIsOpen])
  
  // Handle function as children (render props pattern)
  if (typeof children === "function") {
    const renderedChildren = children({ isOpen })
    
    // If asChild is true and rendered children is a valid element, clone it with needed props
    if (asChild && React.isValidElement(renderedChildren)) {
      return React.cloneElement(renderedChildren as ReactElement<any>, {
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          // Preserve the original onClick if it exists
          const childProps = (renderedChildren as ReactElement<any>).props;
          if (childProps.onClick && typeof childProps.onClick === 'function') {
            childProps.onClick(e);
          }
          toggleOpen();
        },
        "aria-expanded": isOpen,
        "data-state": isOpen ? "open" : "closed",
      });
    }
    
    // If not using asChild or not a valid element, just render it in a button
    return asChild ? (
      renderedChildren
    ) : (
      <button 
        onClick={toggleOpen}
        className={`px-4 py-2 bg-white rounded m-4 hover:bg-gray-100 transition-colors ${className}`}
        aria-expanded={isOpen}
        data-state={isOpen ? "open" : "closed"}
      >
        {renderedChildren}
      </button>
    );
  }
  
  // If asChild is true and a valid child is provided, clone it with the necessary props
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as ReactElement<any>, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        // Preserve the original onClick if it exists
        const childProps = (children as ReactElement<any>).props;
        if (childProps.onClick && typeof childProps.onClick === 'function') {
          childProps.onClick(e);
        }
        toggleOpen();
      },
      "aria-expanded": isOpen,
      "data-state": isOpen ? "open" : "closed",
    });
  }
  
  // Otherwise, render the default button
  return (
    <button 
      onClick={toggleOpen}
      className={`px-4 py-2 bg-white rounded m-4 hover:bg-gray-100 transition-colors ${className}`}
      aria-expanded={isOpen}
      data-state={isOpen ? "open" : "closed"}
    >
      {children || (isOpen ? "Close" : "Open")}
    </button>
  )
}

// Drawer (sidebar)
interface PulloutDrawerProps {
  children?: React.ReactNode
  className?: string
}

export function PulloutDrawer({
  children,
  className = "",
}: PulloutDrawerProps) {
  const { isOpen, width, isDragging, direction } = usePullout()
  
  return (
    <div 
      className={`h-full shrink-0 grow-0 overflow-hidden relative ${isOpen ? "" : "w-0"} ${
        !isDragging ? "transition-all duration-300 ease-in-out" : ""
      } ${className}`}
      style={{ 
        width: isOpen ? `${width}px` : "0px",
        order: direction === "left" ? -1 : 1
      }}
    >
      {children}
    </div>
  )
}

// Resize handle
interface PulloutHandleProps {
  className?: string
}

export function PulloutHandle({ className = "" }: PulloutHandleProps) {
  const { isOpen, width, setWidth, minWidth, maxWidth, setIsDragging, direction } = usePullout()
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true
    setIsDragging(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }, [width, setIsDragging])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return
    
    const deltaX = direction === "right" 
      ? startXRef.current - e.clientX 
      : e.clientX - startXRef.current;
      
    const newWidth = Math.min(Math.max(startWidthRef.current + deltaX, minWidth), maxWidth)
    setWidth(newWidth)
  }, [direction, minWidth, maxWidth, setWidth])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    setIsDragging(false)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }, [setIsDragging])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  if (!isOpen) return null

  return (
    <div 
      className={`absolute ${direction === "right" ? "left-0" : "right-0"} top-0 h-full w-4 cursor-col-resize flex items-center justify-center hover:bg-black/10 ${className}`}
      onMouseDown={handleMouseDown}
    >
      <div className="w-1 h-8 bg-white/50 rounded-full"></div>
    </div>
  )
} 