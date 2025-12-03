import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OrdersManagement } from "@/components/admin/orders-management"

export const dynamic = 'force-dynamic'

export default async function AdminCommandesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin or tresorier
  const { data: userData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!userData || !['admin', 'tresorier'].includes(userData.role)) {
    redirect("/dashboard")
  }

  // Fetch boutique orders with items
  const { data: orders, error } = await supabase
    .from("support_transactions")
    .select(`
      id,
      created_at,
      amount,
      supporter_name,
      supporter_email,
      stripe_session_id,
      order_status,
      notes,
      source,
      invoice_number,
      invoice_url,
      invoice_sent
    `)
    .eq("source", "boutique")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching orders:", error)
  }

  console.log("DEBUG - Orders found:", orders?.length, orders)

  // Fetch order items for each order
  const orderIds = orders?.map(o => o.id) || []
  console.log("DEBUG - Order IDs:", orderIds)
  
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .in("transaction_id", orderIds.length > 0 ? orderIds : ['00000000-0000-0000-0000-000000000000'])

  if (itemsError) {
    console.error("Error fetching order items:", itemsError)
  }
  console.log("DEBUG - Order items found:", orderItems?.length, orderItems)

  // Group items by transaction_id
  const itemsByOrder = new Map<string, typeof orderItems>()
  orderItems?.forEach(item => {
    const existing = itemsByOrder.get(item.transaction_id) || []
    existing.push(item)
    itemsByOrder.set(item.transaction_id, existing)
  })

  // Combine orders with their items
  const ordersWithItems = orders?.map(order => ({
    ...order,
    items: itemsByOrder.get(order.id) || []
  })) || []

  // Get stats
  const stats = {
    total: ordersWithItems.length,
    pending: ordersWithItems.filter(o => o.order_status === 'pending').length,
    preparing: ordersWithItems.filter(o => ['confirmed', 'preparing'].includes(o.order_status || '')).length,
    ready: ordersWithItems.filter(o => o.order_status === 'ready').length,
    completed: ordersWithItems.filter(o => ['shipped', 'delivered'].includes(o.order_status || '')).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Commandes</h1>
        <p className="text-muted-foreground">
          Gérez les commandes de la boutique en ligne
        </p>
      </div>

      <OrdersManagement initialOrders={ordersWithItems} stats={stats} />
    </div>
  )
}
