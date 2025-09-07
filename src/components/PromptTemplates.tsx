'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface PromptTemplate {
  category: string
  templates: Array<{
    title: string
    prompt: string
  }>
}

const promptTemplates: PromptTemplate[] = [
  {
    category: "Sci-Fi & Fantasy",
    templates: [
      {
        title: "Cyberpunk City",
        prompt: "A futuristic cyberpunk cityscape at night with neon lights, flying cars, and towering skyscrapers covered in holographic advertisements"
      },
      {
        title: "Space Station",
        prompt: "A massive space station orbiting Earth, with solar panels gleaming in the sunlight and starships docking at various ports"
      },
      {
        title: "Fantasy Forest",
        prompt: "An enchanted forest with glowing mushrooms, floating fairy lights, and ancient trees with twisted magical roots"
      }
    ]
  },
  {
    category: "Nature & Landscapes",
    templates: [
      {
        title: "Mountain Sunset",
        prompt: "A majestic mountain range at golden hour with warm sunset colors reflecting on snow-capped peaks and a peaceful lake below"
      },
      {
        title: "Tropical Beach",
        prompt: "A pristine tropical beach with crystal clear turquoise water, white sand, swaying palm trees, and a colorful sunset"
      },
      {
        title: "Autumn Forest",
        prompt: "A peaceful autumn forest path with colorful fall leaves, golden sunlight filtering through the trees, and morning mist"
      }
    ]
  },
  {
    category: "Art & Abstract",
    templates: [
      {
        title: "Geometric Patterns",
        prompt: "Abstract geometric art with vibrant colors, overlapping shapes, and modern minimalist design elements"
      },
      {
        title: "Watercolor Style",
        prompt: "A beautiful watercolor painting style artwork with soft flowing colors, paint splatters, and artistic brush strokes"
      },
      {
        title: "Digital Art",
        prompt: "Modern digital art with bold colors, sharp lines, and contemporary artistic elements in a stylized composition"
      }
    ]
  },
  {
    category: "Characters & Portraits",
    templates: [
      {
        title: "Fantasy Warrior",
        prompt: "A powerful fantasy warrior in detailed armor, holding an ornate sword, with an epic battle scene in the background"
      },
      {
        title: "Mystical Wizard",
        prompt: "An wise old wizard with a long flowing beard, magical staff, and mystical robes in an ancient library setting"
      },
      {
        title: "Steampunk Character",
        prompt: "A steampunk character with brass goggles, mechanical arm, and Victorian-era clothing in an industrial workshop"
      }
    ]
  }
]

interface PromptTemplatesProps {
  onSelectTemplate: (prompt: string) => void
}

export default function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category)
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setShowTemplates(!showTemplates)}
        className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-2 mb-2"
      >
        <span>✨ Use prompt templates</span>
        <ChevronDown className={`w-4 h-4 transform transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
      </button>
      
      {showTemplates && (
        <div className="bg-purple-50 rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
          {promptTemplates.map((category) => (
            <div key={category.category}>
              <button
                type="button"
                onClick={() => toggleCategory(category.category)}
                className="w-full text-left font-medium text-purple-800 hover:text-purple-900 flex items-center justify-between py-1"
              >
                <span>{category.category}</span>
                <ChevronDown className={`w-4 h-4 transform transition-transform ${
                  expandedCategory === category.category ? 'rotate-180' : ''
                }`} />
              </button>
              
              {expandedCategory === category.category && (
                <div className="ml-2 space-y-1 mt-1">
                  {category.templates.map((template) => (
                    <button
                      key={template.title}
                      type="button"
                      onClick={() => {
                        onSelectTemplate(template.prompt)
                        setShowTemplates(false)
                        setExpandedCategory(null)
                      }}
                      className="w-full text-left p-2 text-sm bg-white rounded border hover:bg-purple-100 transition-colors"
                    >
                      <div className="font-medium text-purple-700">{template.title}</div>
                      <div className="text-gray-600 text-xs line-clamp-2 mt-1">
                        {template.prompt.slice(0, 100)}...
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}