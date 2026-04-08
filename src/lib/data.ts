export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'interior' | 'exterior' | 'accesorios';
  image: string;
  badge?: string;
}

export const catalogData: Product[] = [
  {
    id: "p1",
    name: "Monstera Deliciosa",
    description: "Planta de interior icónica con hojas perforadas gigantes. Ideal para añadir un toque tropical a cualquier espacio bien iluminado.",
    price: 45.00,
    category: "interior",
    image: "https://images.unsplash.com/photo-1614594975525-e45190c55d40?auto=format&fit=crop&q=80&w=800",
    badge: "Más Vendida"
  },
  {
    id: "p2",
    name: "Ficus Lyrata",
    description: "También conocido como el árbol lira. Es elegante, alto y sus grandes hojas verdes purifican el ambiente maravillosamente.",
    price: 65.00,
    category: "interior",
    image: "https://images.unsplash.com/photo-1629838048255-a226501f2fde?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "p3",
    name: "Cactus San Pedro",
    description: "Planta rústica y de exterior que demanda muy poco mantenimiento y aporta un estilo desértico moderno.",
    price: 35.00,
    category: "exterior",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=800",
    badge: "De Temporada"
  },
  {
    id: "p4",
    name: "Maceta de Cerámica Artesanal",
    description: "Maceta premium esmaltada a mano. Perfecta para realzar los colores de tus plantas y decorar tus estanterías.",
    price: 24.00,
    category: "accesorios",
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "p5",
    name: "Helecho de Boston",
    description: "De frondosas hojas colgantes, este helecho es perfecto para purificar el aire natural y humidificar habitaciones.",
    price: 28.00,
    category: "interior",
    image: "https://images.unsplash.com/photo-1621274403997-3ecfaad24d08?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "p6",
    name: "Sustrato Premium Vivero",
    description: "Mezcla perfecta de tierra, perlita y humus de lombriz, asegurando un drenaje óptimo y rico en nutrientes.",
    price: 15.00,
    category: "accesorios",
    image: "https://images.unsplash.com/photo-1596401057633-54cdbe5d8fc2?auto=format&fit=crop&q=80&w=800"
  }
];
