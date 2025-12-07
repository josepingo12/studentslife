import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Folder, Utensils, ShoppingBag, Scissors, Sparkles, Music, Dumbbell, GraduationCap, PartyPopper, Coffee, Beer, Pizza } from "lucide-react";
import { useTranslation } from "react-i18next";

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
};

const CategoryCarousel = ({ onSelectCategory }: CategoryCarouselProps) => {
  const { t } = useTranslation();
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

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-6 animate-pulse shadow-sm">
            <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-cyan-100 to-blue-100" />
            <div className="h-4 bg-gray-100 rounded-full w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  // Calculate grid layout - 2 items first row, 3 items second row pattern like Glovo
  const renderCategoryGrid = () => {
    const rows: Category[][] = [];
    let i = 0;
    let rowIndex = 0;
    
    while (i < categories.length) {
      const itemsInRow = rowIndex % 2 === 0 ? 2 : 3;
      rows.push(categories.slice(i, i + itemsInRow));
      i += itemsInRow;
      rowIndex++;
    }

    return rows.map((row, rowIdx) => (
      <div 
        key={rowIdx} 
        className={`flex gap-3 ${rowIdx % 2 === 0 ? 'justify-center' : 'justify-center'}`}
      >
        {row.map((category) => {
          const isSelected = selected === category.name;
          const IconComponent = getCategoryIcon(category.name);

          return (
            <button
              key={category.id}
              onClick={() => handleSelect(category.name)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-3xl transition-all duration-300
                ${rowIdx % 2 === 0 ? 'w-[140px]' : 'w-[110px]'}
                ${isSelected 
                  ? "bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-blue-200/50 scale-105" 
                  : "bg-white hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 shadow-md hover:shadow-lg hover:scale-[1.02]"
                }
              `}
            >
              {/* Category Icon Container */}
              <div className={`
                w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
                ${isSelected 
                  ? "bg-white/30 backdrop-blur-sm" 
                  : "bg-gradient-to-br from-cyan-100 to-blue-100"
                }
              `}>
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.display_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <IconComponent 
                    className={`w-7 h-7 ${isSelected ? "text-white" : "text-cyan-600"}`} 
                  />
                )}
              </div>

              {/* Category Name */}
              <span className={`
                text-xs font-semibold text-center leading-tight line-clamp-2
                ${isSelected ? "text-white" : "text-gray-700"}
              `}>
                {category.display_name}
              </span>
            </button>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="space-y-3">
      {renderCategoryGrid()}
    </div>
  );
};

export default CategoryCarousel;