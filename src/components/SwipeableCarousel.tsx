"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableCarouselProps {
  children: React.ReactNode[];
  className?: string;
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  showArrows?: boolean;
  showDots?: boolean;
}

export function SwipeableCarousel({
  children,
  className,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 3 },
  showArrows = true,
  showDots = true,
}: SwipeableCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalItems = children.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView.desktop);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Update scroll position when currentIndex changes
  useEffect(() => {
    if (scrollRef.current) {
      const itemWidth = scrollRef.current.scrollWidth / totalItems;
      scrollRef.current.scrollTo({
        left: currentIndex * itemWidth,
        behavior: "smooth",
      });
    }
  }, [currentIndex, totalItems]);

  if (totalItems === 0) {
    return <div className={cn("text-center py-8 text-muted-foreground", className)}>No items to display</div>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex overflow-hidden scrollbar-hide"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div className="flex space-x-4 min-w-full">
          {children.map((child, index) => (
            <div
              key={index}
              className={cn(
                "flex-shrink-0",
                "w-full sm:w-1/2 lg:w-1/3", // Responsive widths
                "px-2" // Add some padding between items
              )}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && totalItems > itemsPerView.desktop && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalItems > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: Math.min(totalItems, 5) }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                currentIndex === index
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              )}
              onClick={() => handleDotClick(index)}
            />
          ))}
          {totalItems > 5 && (
            <span className="text-xs text-muted-foreground ml-2">
              {currentIndex + 1} / {totalItems}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
