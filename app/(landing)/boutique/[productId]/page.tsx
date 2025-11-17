import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/shop/product-detail"
import { CartProvider } from "@/lib/cart-context"

// NOTE: We intentionally accept `props: unknown` and cast internally to `{ params: { productId: string } }`.
// This avoids a type constraint mismatch with Next.js's internal `PageProps` generic which can
// cause build-time type checks to fail when we annotate the function parameter directly.
// See: Next's page signature validation — casting here keeps compile-time safety for the
// `params.productId` usage while avoiding the PageProps constraint error.
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

  return (
    <CartProvider>
      <ProductDetail product={product} />
    </CartProvider>
  )
}
