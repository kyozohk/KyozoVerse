import React from 'react';
import styles from './custom-button.module.css';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({ children, ...props }) => {
  return (
    <button className={styles.customButton} {...props}>
      {children}
    </button>
  );
};
