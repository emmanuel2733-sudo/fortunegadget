import React from 'react'
import styles from "./Search.module.scss"
import {BiSearch} from "react-icons/bi"
import { PropTypes } from "prop-types";



const Search = ({value, onChange}) => { 

  Search.propTypes = {
    value: PropTypes.node.isRequired,
    onChange: PropTypes.node.isRequired,
    };

  return (
    <div className={styles.search}>
       <BiSearch size={18} className={styles.icon}/>

       <input type="text" placeholder="Search by name"
        value={value} onChange={onChange} />
    </div>
  )
}

export default Search