import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/catalog/HeroSection';
import ProductGrid from '@/components/catalog/ProductGrid';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ProductGrid />
      
      <footer className="border-t border-black/5 dark:border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-foreground/60 text-sm">
          <p>© {new Date().getFullYear()} Vivero Libertad. Creciendo comunidad.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary-500 transition-colors">Términos</a>
            <a href="#" className="hover:text-primary-500 transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
