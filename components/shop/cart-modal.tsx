"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/lib/cart-context"
import { createShopPayment } from "@/app/actions/shop/create-payment"
import toast from "react-hot-toast"

export function CartModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, updateQuantity, removeItem, totalAmount } = useCart()
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Votre panier est vide")
      return
    }

    if (!customerEmail || !customerName) {
      toast.error("Veuillez renseigner votre nom et email")
      return
    }

    setIsProcessing(true)
    try {
      const result = await createShopPayment({
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        customerEmail,
        customerName,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = result.url
      }
    } catch (error) {
      console.error("Erreur checkout:", error)
      toast.error("Erreur lors du paiement")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-background shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
                <h2 className="text-xl sm:text-2xl font-bold">Panier</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      {item.image && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold truncate">{item.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.price.toFixed(2)} €</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 sm:w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto h-7 w-7 p-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 sm:p-6 border-t space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-sm">Nom complet</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Jean Dupont"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="jean@example.com"
                      className="h-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-base sm:text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{totalAmount.toFixed(2)} €</span>
                </div>
                
                <Button
                  className="w-full h-11 sm:h-12"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Traitement..." : "Procéder au paiement"}
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
