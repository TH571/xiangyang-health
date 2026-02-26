/**
 * Selection Page
 * 向阳优选 - 健康商品推荐
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SimpleDivider } from '@/components/OrganicDivider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Heart, Star } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import { toast } from "sonner";
import { ImagePlaceholder } from "@/components/Placeholder";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string | number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  inStock: boolean;
  discount?: number;
  url?: string;
}

export function SelectionPage() {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['全部']);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories?type=selection')
        ]);

        const loadedProducts = prodRes.data.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          category: item.category?.name || '其他',
          price: item.price || '0',
          originalPrice: undefined,
          image: getImageUrl(item.image) || '',
          rating: item.rating || 5.0,
          reviews: Math.floor(Math.random() * 500) + 50,
          description: item.introduction || '',
          features: ['正品保证', '极速发货'], // Mock features
          inStock: true,
          discount: undefined,
          url: item.url
        }));

        setProducts(loadedProducts);
        setFilteredProducts(loadedProducts);

        const categoryNames = ['全部', ...catRes.data.map((c: any) => c.name)];
        setCategories(categoryNames);
      } catch (error) {
        toast.error("加载数据失败");
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === '全部') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === category));
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleCart = (productId: string) => {
    setCart(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onNavigate={(path) => navigate(path)} />

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 text-white bg-gradient-to-r from-green-600 to-teal-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">向阳优选</h1>
          <p className="text-lg text-white/90 max-w-2xl">
            精选最优质的健康商品，为您的健康生活保驾护航
          </p>
        </div>
      </section>

      <SimpleDivider className="my-0" />

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-border sticky top-16 z-40">
        <div className="container">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 bg-white flex-1">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-lg overflow-hidden bg-white border border-border hover:shadow-lg transition-all duration-300"
              >
                {/* Product Image */}
                <div className="relative overflow-hidden h-48 bg-gray-200">
                  {getImageUrl(product.image) ? (
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImagePlaceholder width={300} height={192} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                  {/* Discount Badge */}
                  {product.discount && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                      -{product.discount}%
                    </div>
                  )}

                  {/* Stock Status */}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">缺货</span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-3 left-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${wishlist.has(product.id)
                          ? 'fill-red-600 text-red-600'
                          : 'text-slate-600'
                        }`}
                    />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-xs text-slate-500 mb-2">{product.category}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-600">({product.reviews})</span>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-900">¥{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-slate-500 line-through">
                          ¥{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.features.slice(0, 2).map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    size="sm"
                    className={`w-full ${product.inStock
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    disabled={!product.inStock}
                    onClick={() => toggleCart(product.id)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    {cart.has(product.id) ? '已加入购物车' : '加入购物车'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">发现更多优质商品</h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            我们精选最优质的健康商品，让您的健康生活更加便捷
          </p>
          <Button
            size="lg"
            className="bg-white text-green-600 hover:bg-gray-100 font-semibold"
          >
            浏览全部商品
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
