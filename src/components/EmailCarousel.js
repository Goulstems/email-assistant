import React from "react";
import "./styles/EmailCarousel.css";

export default function EmailCarousel({
  logEmails,
  visibleCount,
  processingId,
  carouselRef,
}) {
  return (
    <div className="carousel-container log-carousel">
      <div className="carousel-list" ref={carouselRef}>
        {logEmails.slice(0, visibleCount).map((em) => {
          const cleanFrom = em.from.split('<')[0].trim();
          const formattedDate = new Date(em.date).toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          return (
            <div
              key={em.id}
              className={`carousel-item${processingId === em.id ? " processing" : ""}`}
              style={{
                opacity: processingId === em.id ? 0.5 : 1,
                transition: "opacity 0.6s"
              }}
            >
              <div className="carousel-from">{cleanFrom}</div>
              <div className="carousel-date">{formattedDate}</div>
              <div className="carousel-subject">{em.subject}</div>
              {processingId === em.id && (
                <div className="processing-overlay">
                  <div className="processing-text">Processing...</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}