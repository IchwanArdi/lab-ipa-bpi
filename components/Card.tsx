import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', title, hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-md hover:shadow-xl
        p-4 sm:p-5 lg:p-6 border border-gray-100
        transition-all duration-300 ease-in-out
        ${hover ? 'hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {title && <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-100">{title}</h3>}
      {children}
    </div>
  );
}
