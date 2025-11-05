"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Pencil, Trash2, RotateCcw } from "lucide-react"
import Image from "next/image"
import { ProductModal } from "./product-modal"
import { deleteProduct } from "@/app/actions/products/manage-product"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Product = {
  id: string
  name: string
  category: string
  description: string
  price: number
  stock: number
  image_url?: string
  status: string
  badge_text?: string
  badge_variant?: "preorder" | "new" | "promo" | null
}

interface ProductsManagementProps {
  initialProducts: Product[]
}

export function ProductsManagement({ initialProducts }: ProductsManagementProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // Filter products
  const filterProducts = (search: string, category: string, status: string) => {
    let filtered = products

    if (search) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category !== "all") {
      filtered = filtered.filter(p => p.category === category)
    }

    if (status !== "all") {
      filtered = filtered.filter(p => p.status === status)
    }

    setFilteredProducts(filtered)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    filterProducts(value, categoryFilter, statusFilter)
  }

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value)
    filterProducts(searchQuery, value, statusFilter)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    filterProducts(searchQuery, categoryFilter, value)
  }

  const handleReset = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setStatusFilter("all")
    setFilteredProducts(products)
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    const result = await deleteProduct(productToDelete.id)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Produit supprimé")
    setProducts(prev => prev.filter(p => p.id !== productToDelete.id))
    setFilteredProducts(prev => prev.filter(p => p.id !== productToDelete.id))
    setProductToDelete(null)
  }

  const handleSuccess = () => {
    // Refresh products list
    window.location.reload()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Badge variant="default" className="bg-green-500">En stock</Badge>
      case "low_stock":
        return <Badge variant="secondary" className="bg-yellow-500">Stock faible</Badge>
      case "out_of_stock":
        return <Badge variant="destructive">En rupture</Badge>
      default:
        return null
    }
  }

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))]

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nom du produit..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2 w-full sm:w-48">
            <label className="text-sm font-medium">Catégorie</label>
            <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.filter(c => c !== "all").map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full sm:w-48">
            <label className="text-sm font-medium">Statut du stock</label>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="in_stock">En stock</SelectItem>
                <SelectItem value="low_stock">Stock faible</SelectItem>
                <SelectItem value="out_of_stock">En rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>

          <Button onClick={handleAddProduct} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un produit
          </Button>
        </div>

        {/* Products Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PRODUIT</TableHead>
                <TableHead>PRIX</TableHead>
                <TableHead>STOCK</TableHead>
                <TableHead>STATUT</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun produit trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.price.toFixed(2)} €</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination info */}
        <div className="text-sm text-muted-foreground">
          Affiche {filteredProducts.length} sur {products.length} résultats
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit &ldquo;{productToDelete?.name}&rdquo; ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
              Annuler
            </Button>
            <Button onClick={handleDeleteProduct} variant="destructive">
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
