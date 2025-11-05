import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductsManagement } from "@/components/admin/products-management"

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Produits</h1>
        <p className="text-muted-foreground">
          Gérez les produits de votre boutique en ligne
        </p>
      </div>

      <ProductsManagement initialProducts={products || []} />
    </div>
  )
}
