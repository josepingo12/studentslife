import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "lucide-react";

interface CategoryCarouselProps {
  onSelectCategory: (category: string) => void;
}

interface Category {
  id: string;
  name: string;
  display_name: string;
  image_url: string | null;
}

const gradients = [
  "from-orange-400 to-red-500",
  "from-green-400 to-emerald-500",
  "from-purple-400 to-pink-500",
  "from-blue-400 to-cyan-500",
  "from-yellow-400 to-orange-500",
  "from-pink-400 to-rose-500",
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
    setSelected(value);
    onSelectCategory(value);
  };

  if (loading) {
    return (
      <div className="flex gap-4 pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-40 ios-card p-6 animate-pulse">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 bg-muted" />
            <div className="h-4 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
      {categories.map((category, idx) => {
        const isSelected = selected === category.name;
        const gradient = gradients[idx % gradients.length];

        return (
          <button
            key={category.id}
            onClick={() => handleSelect(category.name)}
            className={`
              flex-shrink-0 w-40 snap-center
              ios-card p-6 transition-all duration-300
              ${isSelected ? "scale-105 shadow-xl" : "hover:scale-102"}
            `}
          >
            {category.image_url ? (
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 overflow-hidden">
                <img
                  src={category.image_url}
                  alt={category.display_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className={`
                  w-16 h-16 rounded-2xl mx-auto mb-3
                  bg-gradient-to-br ${gradient}
                  flex items-center justify-center
                  transition-transform duration-300
                  ${isSelected ? "animate-bounce" : ""}
                `}
              >
                <Folder className="w-8 h-8 text-white" />
              </div>
            )}
            <p className={`font-semibold text-sm text-center ${isSelected ? "text-primary" : "text-foreground"}`}>
              {category.display_name}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryCarousel;
