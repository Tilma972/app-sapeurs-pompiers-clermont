"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck,
  Eye,
  RotateCcw,
  ShoppingBag,
  AlertCircle
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

type OrderItem = {
  id: string
  transaction_id: string
  product_id: string | null
  name: string
  description: string | null
  quantity: number
  unit_price: number
  total_price: number
  image_url: string | null
}

type Order = {
  id: string
  created_at: string
  amount: number
  supporter_name: string | null
  supporter_email: string | null
  stripe_session_id: string | null
  order_status: string | null
  notes: string | null
  source: string | null
  items: OrderItem[]
}

type Stats = {
  total: number
  pending: number
  preparing: number
  ready: number
  completed: number
}

interface OrdersManagementProps {
  initialOrders: Order[]
  stats: Stats
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "En attente", color: "bg-yellow-500", icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: "Confirmée", color: "bg-blue-500", icon: <CheckCircle2 className="h-4 w-4" /> },
  preparing: { label: "En préparation", color: "bg-purple-500", icon: <Package className="h-4 w-4" /> },
  ready: { label: "Prête", color: "bg-green-500", icon: <CheckCircle2 className="h-4 w-4" /> },
  shipped: { label: "Expédiée", color: "bg-cyan-500", icon: <Truck className="h-4 w-4" /> },
  delivered: { label: "Livrée", color: "bg-emerald-600", icon: <CheckCircle2 className="h-4 w-4" /> },
  cancelled: { label: "Annulée", color: "bg-red-500", icon: <AlertCircle className="h-4 w-4" /> },
  refunded: { label: "Remboursée", color: "bg-gray-500", icon: <RotateCcw className="h-4 w-4" /> },
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateStr))

export function OrdersManagement({ initialOrders, stats }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(initialOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [statusNotes, setStatusNotes] = useState("")

  // Filter orders
  const filterOrders = (search: string, status: string) => {
    let filtered = orders

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(o =>
        o.supporter_name?.toLowerCase().includes(searchLower) ||
        o.supporter_email?.toLowerCase().includes(searchLower) ||
        o.id.toLowerCase().includes(searchLower)
      )
    }

    if (status !== "all") {
      filtered = filtered.filter(o => o.order_status === status)
    }

    setFilteredOrders(filtered)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    filterOrders(value, statusFilter)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    filterOrders(searchQuery, value)
  }

  const handleReset = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setFilteredOrders(orders)
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setStatusNotes("")
    setIsDetailOpen(true)
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return

    setIsUpdating(true)
    const supabase = createClient()

    try {
      // Update order status
      const { error: updateError } = await supabase
        .from("support_transactions")
        .update({ order_status: newStatus })
        .eq("id", selectedOrder.id)

      if (updateError) throw updateError

      // Add status history entry
      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          transaction_id: selectedOrder.id,
          status: newStatus,
          notes: statusNotes || null,
        })

      if (historyError) {
        console.error("History insert error:", historyError)
        // Don't throw - the main update succeeded
      }

      // Update local state
      const updatedOrders = orders.map(o => 
        o.id === selectedOrder.id ? { ...o, order_status: newStatus } : o
      )
      setOrders(updatedOrders)
      filterOrders(searchQuery, statusFilter)
      setSelectedOrder({ ...selectedOrder, order_status: newStatus })

      toast.success(`Commande passée en "${STATUS_CONFIG[newStatus]?.label || newStatus}"`)
      setStatusNotes("")
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Erreur lors de la mise à jour du statut")
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    const config = STATUS_CONFIG[status || 'pending'] || STATUS_CONFIG.pending
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">En préparation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.preparing}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Prêtes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Rechercher</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom, email ou ID commande..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2 w-full sm:w-48">
          <label className="text-sm font-medium">Statut</label>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmée</SelectItem>
              <SelectItem value="preparing">En préparation</SelectItem>
              <SelectItem value="ready">Prête</SelectItem>
              <SelectItem value="shipped">Expédiée</SelectItem>
              <SelectItem value="delivered">Livrée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
          <RotateCcw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DATE</TableHead>
              <TableHead>CLIENT</TableHead>
              <TableHead>ARTICLES</TableHead>
              <TableHead className="text-right">TOTAL</TableHead>
              <TableHead>STATUT</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucune commande trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewOrder(order)}>
                  <TableCell>
                    <div className="text-sm">{formatDate(order.created_at)}</div>
                    <div className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.supporter_name || "Client anonyme"}</div>
                    <div className="text-sm text-muted-foreground">{order.supporter_email || "—"}</div>
                  </TableCell>
                  <TableCell>
                    {order.items.length > 0 ? (
                      <div className="text-sm">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i}>{item.quantity}x {item.name}</div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-muted-foreground">+{order.items.length - 2} autres</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Détails non disponibles</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(order.amount)}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewOrder(order) }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Commande #{selectedOrder?.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedOrder.supporter_name || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedOrder.supporter_email || "Non renseigné"}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-3">Articles commandés</h4>
                {selectedOrder.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.name} width={64} height={64} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Détails des articles non disponibles</p>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(selectedOrder.amount)}</span>
              </div>

              {/* Status Update */}
              <div className="space-y-3">
                <h4 className="font-semibold">Mettre à jour le statut</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Statut actuel :</span>
                  {getStatusBadge(selectedOrder.order_status)}
                </div>
                <Textarea 
                  placeholder="Notes (optionnel)..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={2}
                />
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.order_status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => handleUpdateStatus('confirmed')} disabled={isUpdating}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmer
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus('cancelled')} disabled={isUpdating}>
                        <AlertCircle className="h-4 w-4 mr-1" /> Annuler
                      </Button>
                    </>
                  )}
                  {selectedOrder.order_status === 'confirmed' && (
                    <Button size="sm" onClick={() => handleUpdateStatus('preparing')} disabled={isUpdating}>
                      <Package className="h-4 w-4 mr-1" /> En préparation
                    </Button>
                  )}
                  {selectedOrder.order_status === 'preparing' && (
                    <Button size="sm" onClick={() => handleUpdateStatus('ready')} disabled={isUpdating}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Prête
                    </Button>
                  )}
                  {selectedOrder.order_status === 'ready' && (
                    <>
                      <Button size="sm" onClick={() => handleUpdateStatus('shipped')} disabled={isUpdating}>
                        <Truck className="h-4 w-4 mr-1" /> Expédiée
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus('delivered')} disabled={isUpdating}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Retirée/Livrée
                      </Button>
                    </>
                  )}
                  {selectedOrder.order_status === 'shipped' && (
                    <Button size="sm" onClick={() => handleUpdateStatus('delivered')} disabled={isUpdating}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Livrée
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
