export interface Recipe {
  id: string
  title: string
  description: string
  image: string
  calories: number
  protein: number
  fat: number
  carbs: number
  rating: number
  tags: string[]
  ingredients: Ingredient[]
  cookTime: number
  hasAllIngredients?: boolean
  isSimilarToCooked?: boolean
}

export interface Ingredient {
  name: string
  amount: string
  unit: string
}

export interface FilterGroup {
  id: string
  title: string
  options: FilterOption[]
  isOpen: boolean
}

export interface FilterOption {
  id: string
  label: string
  checked: boolean
}

export type TabId = 'recommendations' | 'favorites' | 'cooked' | 'myProducts'

export interface Tab {
  id: TabId
  label: string
}
