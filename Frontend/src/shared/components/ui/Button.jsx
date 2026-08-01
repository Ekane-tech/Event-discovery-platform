import { motion } from 'framer-motion'



export default function Button({ children, variant = 'primary', className = '', ...props }) {

  const variants = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700',
    secondary: 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-600 dark:text-white',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border-2 border-teal-600 bg-white text-teal-600 hover:bg-teal-50 dark:bg-transparent dark:text-white dark:border-teal-600',
    light: 'bg-white text-teal-600 hover:bg-slate-50 dark:bg-teal-600 dark:text-white',
    pink: 'bg-teal-600 text-white hover:bg-teal-700',
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

