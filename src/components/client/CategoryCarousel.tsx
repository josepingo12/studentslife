import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Folder, Utensils, ShoppingBag, Scissors, Sparkles, Music, Dumbbell, GraduationCap, PartyPopper, Coffee, Beer, Pizza, Heart, Cake, Camera, Shirt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryCarouselProps {
  onSelectCategory: (category: string) => void;
}

interface Category {
  id: string;
  name: string;
  display_name: string;
  image_url: string | null;
}

// Icon mapping for categories
const categoryIcons: { [key: string]: React.ComponentType<any> } = {
  restaurante: Utensils,
  tienda: ShoppingBag,
  peluqueria: Scissors,
  belleza: Sparkles,
  discoteca: Music,
  gimnasio: Dumbbell,
  academia: GraduationCap,
  eventos: PartyPopper,
  cafeteria: Coffee,
  bar: Beer,
  pizzeria: Pizza,
  moda: Shirt,
  fotografia: Camera,
  pasteleria: Cake,
  favoritos: Heart,
};

// Gradient pairs for categories
const categoryGradients = [
  { from: "from-cyan-400", to: "to-blue-500", shadow: "shadow-cyan-200/60" },
  { from: "from-blue-400", to: "to-indigo-500", shadow: "shadow-blue-200/60" },
  { from: "from-sky-400", to: "to-cyan-500", shadow: "shadow-sky-200/60" },
  { from: "from-teal-400", to: "to-cyan-500", shadow: "shadow-teal-200/60" },
  { from: "from-indigo-400", to: "to-blue-500", shadow: "shadow-indigo-200/60" },
  { from: "from-blue-300", to: "to-sky-500", shadow: "shadow-blue-200/60" },
];

const CategoryCarousel = ({ onSelectCategory }: CategoryCarouselProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (value: string) => {
    const newSelected = selected === value ? null : value;
    setSelected(newSelected);
    onSelectCategory(newSelected || "");
  };

  const getCategoryIcon = (name: string) => {
    const normalizedName = name.toLowerCase().replace(/\s+/g, "");
    return categoryIcons[normalizedName] || Folder;
  };

  const getGradient = (index: number) => {
    return categoryGradients[index % categoryGradients.length];
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 px-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-[28px] p-5 shadow-lg"
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-cyan-100 to-blue-100 animate-pulse" />
            <div className="h-4 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full w-3/4 mx-auto animate-pulse" />
          </motion.div>
        ))}
      </div>
    );
  }

  // Calculate grid layout - 2 items first row, 3 items second row pattern like Glovo
  const renderCategoryGrid = () => {
    const rows: { category: Category; index: number }[][] = [];
    let i = 0;
    let rowIndex = 0;
    
    while (i < categories.length) {
      const itemsInRow = rowIndex % 2 === 0 ? 2 : 3;
      const rowItems = categories.slice(i, i + itemsInRow).map((cat, idx) => ({
        category: cat,
        index: i + idx
      }));
      rows.push(rowItems);
      i += itemsInRow;
      rowIndex++;
    }

    return rows.map((row, rowIdx) => (
      <motion.div 
        key={rowIdx} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rowIdx * 0.1, duration: 0.4 }}
        className="flex gap-3 justify-center"
      >
        {row.map(({ category, index }) => {
          const isSelected = selected === category.name;
          const IconComponent = getCategoryIcon(category.name);
          const gradient = getGradient(index);

          return (
            <motion.button
              key={category.id}
              onClick={() => handleSelect(category.name)}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              className={`
                relative flex flex-col items-center gap-2 p-4 rounded-[28px] transition-all duration-300
                ${rowIdx % 2 === 0 ? 'w-[145px]' : 'w-[108px]'}
                ${isSelected 
                  ? `bg-gradient-to-br ${gradient.from} ${gradient.to} shadow-xl ${gradient.shadow}` 
                  : "bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl"
                }
              `}
            >
              {/* Animated ring effect when selected */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="absolute inset-0 rounded-[28px] border-2 border-white/50"
                  />
                )}
              </AnimatePresence>

              {/* Category Icon Container with floating animation */}
              <motion.div 
                animate={isSelected ? { y: [0, -3, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className={`
                  relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
                  ${isSelected 
                    ? "bg-white/30 backdrop-blur-md shadow-inner" 
                    : `bg-gradient-to-br ${gradient.from} ${gradient.to} shadow-md`
                  }
                `}
              >
                {/* Glow effect */}
                <div className={`
                  absolute inset-0 rounded-full blur-md transition-opacity duration-300
                  ${isSelected ? "opacity-0" : `opacity-40 bg-gradient-to-br ${gradient.from} ${gradient.to}`}
                `} />
                
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.display_name}
                    className="w-10 h-10 rounded-full object-cover relative z-10"
                  />
                ) : (
                  <IconComponent 
                    className={`w-7 h-7 relative z-10 transition-colors duration-300 ${
                      isSelected ? "text-white" : "text-white"
                    }`} 
                  />
                )}
              </motion.div>

              {/* Category Name with gradient text when not selected */}
              <span className={`
                text-xs font-bold text-center leading-tight line-clamp-2 transition-colors duration-300
                ${isSelected ? "text-white" : "text-gray-700"}
              `}>
                {category.display_name}
              </span>

              {/* Subtle sparkle decoration */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
    ));
  };

  return (
    <div className="space-y-3">
      {renderCategoryGrid()}
    </div>
  );
};

export default CategoryCarousel;