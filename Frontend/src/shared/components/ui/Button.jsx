import { motion } from 'framer-motion'



export default function Button({ children, variant = 'primary', className = '', ...props }) {

  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500 dark:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border-2 border-blue-500 bg-white text-blue-500 hover:bg-blue-50 dark:bg-transparent dark:text-white dark:border-blue-500',
    light: 'bg-white text-blue-500 hover:bg-slate-50 dark:bg-blue-500 dark:text-white',
    pink: 'bg-blue-500 text-white hover:bg-blue-600',
    admin: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200',
  }



  return (

    <motion.button

      whileTap={{ scale: 0.97 }}

      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.primary} ${className}`}

      {...props}

    >

      {children}

    </motion.button>

  )

}

