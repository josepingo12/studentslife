import { useState } from "react";
import { Utensils, Dumbbell, PartyPopper, Sparkles } from "lucide-react";

interface CategoryCarouselProps {
  onSelectCategory: (category: string) => void;
}

const categories = [
  {
    value: "bar_restaurant",
    label: "Bar e Ristoranti",
    icon: Utensils,
    gradient: "from-orange-400 to-red-500",
  },
  {
    value: "fitness",
    label: "Fitness",
    icon: Dumbbell,
    gradient: "from-green-400 to-emerald-500",
  },
  {
    value: "entertainment",
    label: "Intrattenimento",
    icon: PartyPopper,
    gradient: "from-purple-400 to-pink-500",
  },
  {
    value: "health_beauty",
    label: "Salute e Bellezza",
    icon: Sparkles,
    gradient: "from-blue-400 to-cyan-500",
  },
];

const CategoryCarousel = ({ onSelectCategory }: CategoryCarouselProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelected(value);
    onSelectCategory(value);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selected === category.value;

        return (
          <button
            key={category.value}
            onClick={() => handleSelect(category.value)}
            className={`
              flex-shrink-0 w-40 snap-center
              ios-card p-6 transition-all duration-300
              ${isSelected ? "scale-105 shadow-xl" : "hover:scale-102"}
            `}
          >
            <div
              className={`
                w-16 h-16 rounded-2xl mx-auto mb-3
                bg-gradient-to-br ${category.gradient}
                flex items-center justify-center
                transition-transform duration-300
                ${isSelected ? "animate-bounce" : ""}
              `}
            >
              <Icon className="w-8 h-8 text-white" />
            </div>
            <p className={`font-semibold text-sm text-center ${isSelected ? "text-primary" : "text-foreground"}`}>
              {category.label}
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryCarousel;
