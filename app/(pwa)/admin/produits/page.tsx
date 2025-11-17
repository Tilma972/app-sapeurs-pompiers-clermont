import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductsManagement } from "@/components/admin/products-management"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ShoppingBag } from "lucide-react"

export default async function ProduitsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all products
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestion des Produits"
        description="Gérez les produits de votre boutique en ligne"
        icon={<ShoppingBag className="h-6 w-6" />}
      />

      <ProductsManagement initialProducts={products || []} />
    </div>
  )
}
