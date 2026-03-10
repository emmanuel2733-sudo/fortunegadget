import React, { useState } from 'react'
import styles from "./Pagination.module.scss";
import  PropTypes  from "prop-types";


const Pagination = ({currentPage, setCurrentPage, productsPerPage, totalProducts}) => {

    Pagination.propTypes = {
        currentPage: PropTypes.node.isRequired, 
        setCurrentPage: PropTypes.node.isRequired, 
        productsPerPage: PropTypes.node.isRequired, 
        totalProducts: PropTypes.node.isRequired,  
     }; 

    const pageNumbers = [];
    const totalPages = totalProducts / productsPerPage
    // Limit the page numbers show
    const [pageNumberLimit, setpageNumberLimit] = useState(5);
    const [maxPageNumberLimit, setmaxPageNumberLimit] = useState(5);
    const [minPageNumberLimit, setminPageNumberLimit] = useState(0);
    
// paginate
const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
};

// go to next page
const paginateNext = () => {
    setCurrentPage(currentPage + 1);
// show set of next pagenumbers
if (currentPage + 1 > maxPageNumberLimit) {
    setmaxPageNumberLimit(maxPageNumberLimit + pageNumberLimit);
    setminPageNumberLimit(minPageNumberLimit + pageNumberLimit);
  }
};

// go to prev page
const paginatePrev = () => {
    setCurrentPage(currentPage - 1);

    // show set of prev page numbers
    if ((currentPage - 1) % pageNumberLimit === 0) {
        setmaxPageNumberLimit(maxPageNumberLimit - pageNumberLimit);
        setminPageNumberLimit(minPageNumberLimit - pageNumberLimit);
      }
};


    for (let i = 1; i <= Math.ceil(totalProducts / productsPerPage); i++){
        pageNumbers.push(i);
    }
  
  
    return (
    <ul className={styles.pagination}>
        <li onClick={paginatePrev} className={currentPage === pageNumbers[0] ? `${styles.hidden}` : null} >Prev</li>

        {pageNumbers.map((number) => {
           if (number < maxPageNumberLimit + 1 && number > minPageNumberLimit) {
           return (
                
            <li key={number} onClick={() => paginate(number)} className={currentPage == number ? `${styles.active}` : null }>{number}</li>
            );
           }
        })}

        <li onClick={paginateNext} className={currentPage == pageNumbers[pageNumbers.length -1] ? `${styles.hidden}` : null} >Next</li>
        <p>
        <b className={styles.page}>{`page ${currentPage}`}</b>
        <span>{` of `}</span>
        <b>{`${Math.ceil(totalPages)}`}</b>
      </p>
    </ul>
  )
}

export default Pagination