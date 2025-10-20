"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import Image from "next/image";

interface UnifiedCardProps {
  variant: "stats" | "action" | "product" | "testimonial" | "news" | "contact" | "emergency";
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  description?: string;
  value?: string | number;
  image?: string;
  badge?: string;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export function UnifiedCard({
  variant,
  icon: Icon,
  title,
  subtitle,
  description,
  value,
  image,
  badge,
  buttonText,
  buttonHref,
  className = "",
  children
}: UnifiedCardProps) {
  const baseClasses = "group hover:shadow-lg transition-all duration-300";
  
  const variantClasses = {
    stats: "h-full hover:scale-[1.02]",
    action: "h-full hover:scale-[1.02] text-center",
    product: "overflow-hidden",
    testimonial: "min-w-[85%] md:min-w-[40%] snap-center",
    news: "hover:shadow-md",
    contact: "hover:shadow-lg",
    emergency: "text-center hover:scale-[1.02]"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <Card className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
        <CardHeader className="pb-3">
          {/* Icon */}
          {Icon && (
            <Icon 
              className={`h-8 w-8 lg:h-10 lg:w-10 group-hover:scale-110 transition-transform ${
                variant === 'stats' ? 'text-primary' : 
                variant === 'emergency' ? 'text-destructive' : 
                'text-muted-foreground'
              }`} 
              aria-hidden="true" 
            />
          )}
          
          {/* Image */}
          {image && (
            <div className="relative w-full h-32 mb-3">
              <Image 
                src={image} 
                alt={title} 
                fill 
                className="rounded-lg object-cover" 
              />
            </div>
          )}
          
          {/* Badge */}
          {badge && (
            <Badge variant="outline" className="w-fit mb-2">
              {badge}
            </Badge>
          )}
          
          {/* Title */}
          <CardTitle className={`${
            variant === 'stats' ? 'text-2xl lg:text-3xl font-bold' :
            variant === 'emergency' ? 'text-2xl font-bold text-destructive' :
            'text-base font-semibold'
          }`}>
            {value || title}
          </CardTitle>
          
          {/* Subtitle */}
          {subtitle && (
            <CardDescription className={`${
              variant === 'stats' ? 'text-sm lg:text-base font-medium' :
              'text-sm text-muted-foreground'
            }`}>
              {subtitle}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Description */}
          {description && (
            <p className={`${
              variant === 'testimonial' ? 'text-sm text-muted-foreground italic mb-4' :
              variant === 'news' ? 'text-sm text-muted-foreground' :
              'text-sm text-muted-foreground'
            }`}>
              {description}
            </p>
          )}
          
          {/* Button */}
          {buttonText && (
            <Button 
              size="sm" 
              className="mt-3"
              asChild={!!buttonHref}
            >
              {buttonHref ? (
                <a href={buttonHref}>{buttonText}</a>
              ) : (
                <span>{buttonText}</span>
              )}
            </Button>
          )}
          
          {/* Custom content */}
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
