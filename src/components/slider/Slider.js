import React, { useEffect, useState } from 'react'
import { AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";
import { sliderData } from './slider-data';
import "./Slider.scss"

const Slider = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = sliderData.filter((slide) => slide.isActive !== false);
  const slideLength = slides.length;
  const autoScroll = true
  const intervalTime = 5000;


  const nextSlide = () => {
    setCurrentSlide((currentValue) =>
      currentValue === slideLength - 1 ? 0 : currentValue + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((currentValue) =>
      currentValue === 0 ? slideLength - 1 : currentValue - 1
    );
  };

  useEffect (() => {
    setCurrentSlide (0)
  }, [slideLength])
  useEffect(() => {
    if (!autoScroll || slideLength <= 1) {
      return undefined;
    }

    const slideInterval = setInterval(() => {
      setCurrentSlide((currentValue) =>
        currentValue === slideLength - 1 ? 0 : currentValue + 1
      );
    }, intervalTime);

    return () => clearInterval(slideInterval);
  }, [autoScroll, intervalTime, slideLength]);


  if (slideLength === 0) {
    return null;
  }

  return (
    <div className="slider">
     <AiOutlineArrowLeft className="arrow prev" onClick={prevSlide} />
      <AiOutlineArrowRight className="arrow next" onClick={nextSlide} />

      {slides.map((slide, index) => {
        const {image, subtitle, heading, desc} = slide;

        return(
        <div key={index} className={index === currentSlide ? "slide current" : "slide"}>
            <img
              src={image}
              alt={heading || "slide"}
              loading="eager"
              decoding="async"
              fetchPriority={index === 0 ? "high" : "auto"}
            />
          {index === currentSlide && (
            <>
            <div className="content">
              {subtitle ? <span className="subtitle">{subtitle}</span> : null}
              <h2>{heading}</h2>
              <p>{desc}</p>
              <hr />
              <a href="#product" className="--btn --btn-primary">
                shop now
              </a>

            </div>
            </>
          )}
        </div>
        )
      })}
        </div>
  )
}

export default Slider
