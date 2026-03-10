import React from 'react';
import sytles from "./Footer.module.scss"

const date = new Date();
const year = date.getFullYear();

const Footer = () => {
  return <div className={sytles.footer}>
      &copy; {year} All Rights Resrved</div>
  
};

export default Footer;  