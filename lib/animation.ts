// Animations Framer Motion réutilisables
import { Variants, Transition } from 'framer-motion';

// Animation de fade-in depuis le bas
export const fadeInUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] // easeOutExpo
    }
  }
};

// Animation de fade-in simple
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.8 }
  }
};

// Animation de scale-in
export const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// Container pour animations en cascade (stagger)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// Item pour animations en cascade
export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// Animation de slide depuis la gauche
export const slideInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -60 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// Animation de slide depuis la droite
export const slideInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 60 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// Hover effect pour les cards
export const cardHover = {
  rest: { 
    scale: 1, 
    y: 0,
    transition: { duration: 0.2 }
  },
  hover: { 
    scale: 1.02, 
    y: -8,
    transition: { 
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

// Spring animation pour les modals
export const modalSpring: Transition = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
} as const;

// Viewport settings pour intersection observer
export const viewportSettings = {
  once: true, // Animation ne se joue qu'une fois
  amount: 0.3 // 30% de l'élément visible
};
