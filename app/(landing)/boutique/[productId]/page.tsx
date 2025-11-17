import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/shop/product-detail"

export default async function ProductPage(props: unknown) {
  const { params } = props as { params: { productId: string } };
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
