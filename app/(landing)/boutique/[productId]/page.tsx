import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/shop/product-detail"

interface ProductPageProps {
  params: {
    productId: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = await createClient()

  // Fetch product from database
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.productId)
    .single()

  if (error || !product) {
    notFound()
  }

  return <ProductDetail product={product} />
}
