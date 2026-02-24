import {
  Repeat, Home, Zap, Wifi, CreditCard, ShoppingCart, Car, Heart,
  GraduationCap, Gamepad2, Phone, Tv, Droplets, Flame, Shield,
  Dumbbell, Utensils, MoreHorizontal, Timer,
} from 'lucide-react';

export interface Category {
  id: string;
  label: string;
  icon: typeof Repeat;
  color: string; // HSL for bg tinting
}

export const CATEGORIES: Category[] = [
  { id: 'subscription', label: 'Subscription', icon: Repeat, color: 'hsl(280, 70%, 55%)' },
  { id: 'rent', label: 'Rent', icon: Home, color: 'hsl(200, 80%, 55%)' },
  { id: 'utilities', label: 'Utilities', icon: Zap, color: 'hsl(38, 92%, 50%)' },
  { id: 'internet', label: 'Internet', icon: Wifi, color: 'hsl(190, 80%, 45%)' },
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard, color: 'hsl(358, 94%, 47%)' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingCart, color: 'hsl(320, 70%, 50%)' },
  { id: 'transport', label: 'Transport', icon: Car, color: 'hsl(160, 60%, 45%)' },
  { id: 'health', label: 'Health', icon: Heart, color: 'hsl(350, 80%, 55%)' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'hsl(220, 70%, 55%)' },
  { id: 'entertainment', label: 'Entertainment', icon: Gamepad2, color: 'hsl(270, 60%, 55%)' },
  { id: 'phone', label: 'Phone', icon: Phone, color: 'hsl(150, 60%, 45%)' },
  { id: 'streaming', label: 'Streaming', icon: Tv, color: 'hsl(0, 75%, 55%)' },
  { id: 'water', label: 'Water', icon: Droplets, color: 'hsl(200, 70%, 50%)' },
  { id: 'gas', label: 'Gas', icon: Flame, color: 'hsl(25, 90%, 50%)' },
  { id: 'insurance', label: 'Insurance', icon: Shield, color: 'hsl(210, 60%, 50%)' },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'hsl(140, 60%, 45%)' },
  { id: 'food', label: 'Food', icon: Utensils, color: 'hsl(30, 80%, 50%)' },
  { id: 'free_trial', label: 'Free Trial', icon: Timer, color: 'hsl(25, 95%, 53%)' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, color: 'hsl(0, 0%, 50%)' },
];

export function getCategoryById(id: string): Category {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}
